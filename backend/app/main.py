"""FastAPI application for the Saral — Bill & Letter Explainer backend."""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.pipeline import analyze_document, handle_followup, handle_voice_query, transcribe_audio
from app.sarvam_client import is_api_configured
from app.schemas import AnalysisResult, ErrorResponse, FollowupResult, TranscribeResult

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_FILE_SIZE_BYTES: int = 200 * 1024 * 1024  # 200 MB
ALLOWED_CONTENT_TYPES: set[str] = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}
ALLOWED_EXTENSIONS: set[str] = {"jpg", "jpeg", "png", "pdf"}

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Saral — Bill & Letter Explainer",
    version="0.1.0",
    description=(
        "API that analyses bills, official letters, government notices and SMS "
        "messages, explains them in simple language, detects scams, translates "
        "into Indian languages, and reads the summary aloud."
    ),
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _validate_upload(file: UploadFile, file_bytes: bytes) -> None:
    """Validate file size and type; raise HTTPException on failure.

    Args:
        file: The uploaded file metadata.
        file_bytes: Already-read raw bytes (used to check size).

    Raises:
        HTTPException: 413 if too large, 415 if unsupported type.
    """
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({len(file_bytes) / (1024 * 1024):.1f} MB). "
                f"Maximum allowed size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            ),
        )

    # Check by extension (more reliable when content_type is missing)
    extension = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename else ""
    content_type = file.content_type or ""

    if extension not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type (extension={extension!r}, "
                f"content_type={content_type!r}). "
                f"Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
            ),
        )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health_check() -> dict[str, Any]:
    """Liveness probe reporting backend and Sarvam configuration status."""
    return {"status": "ok", "api_configured": is_api_configured()}


@app.post(
    "/api/analyze",
    response_model=AnalysisResult,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Analyse a bill, letter, or SMS",
)
async def analyze(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    target_language: str = Form("hi-IN"),
) -> JSONResponse:
    """Accept a document image/PDF **or** raw text and return a structured analysis.

    At least one of ``file`` or ``text`` must be provided.
    """
    # --- Input validation ---
    if file is None and not text:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of 'file' (image/PDF upload) or 'text'.",
        )

    file_bytes: bytes | None = None
    if file is not None:
        file_bytes = await file.read()
        _validate_upload(file, file_bytes)

    # --- Pipeline ---
    try:
        result = analyze_document(
            file_bytes=file_bytes,
            raw_text=text,
            target_language=target_language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        error_msg = str(exc)
        if "not configured" in error_msg.lower() or "extraction failed" in error_msg.lower():
            raise HTTPException(status_code=503, detail=error_msg) from exc
        raise HTTPException(status_code=500, detail=error_msg) from exc
    except Exception as exc:
        logger.exception("Unexpected error in /api/analyze")
        raise HTTPException(
            status_code=500, detail="Internal server error"
        ) from exc

    return JSONResponse(content=result)


@app.post(
    "/api/followup",
    response_model=FollowupResult,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Ask a follow-up voice question",
)
async def followup(
    audio: UploadFile = File(...),
    context: str = Form(...),
    target_language: str = Form("hi-IN"),
) -> JSONResponse:
    """Accept a voice recording and the previous analysis context, then return an answer."""
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    try:
        result = handle_followup(
            audio_bytes=audio_bytes,
            context_json=context,
            target_language=target_language,
        )
    except RuntimeError as exc:
        error_msg = str(exc)
        if "not configured" in error_msg.lower() or "transcription failed" in error_msg.lower():
            raise HTTPException(status_code=503, detail=error_msg) from exc
        raise HTTPException(status_code=500, detail=error_msg) from exc
    except Exception as exc:
        logger.exception("Unexpected error in /api/followup")
        raise HTTPException(
            status_code=500, detail="Internal server error"
        ) from exc

    return JSONResponse(content=result)


@app.post(
    "/api/transcribe",
    response_model=TranscribeResult,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Transcribe audio to text using Sarvam Saaras STT",
)
async def transcribe(
    audio: UploadFile = File(...),
    mode: str = Form("transcribe"),
) -> JSONResponse:
    """Accept voice recording and return transcribed text in the spoken language."""
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    try:
        text = transcribe_audio(audio_bytes=audio_bytes, mode=mode)
        return JSONResponse(content={"transcript": text})
    except RuntimeError as exc:
        error_msg = str(exc)
        if "not configured" in error_msg.lower() or "transcription failed" in error_msg.lower():
            raise HTTPException(status_code=503, detail=error_msg) from exc
        raise HTTPException(status_code=500, detail=error_msg) from exc
    except Exception as exc:
        logger.exception("Unexpected error in /api/transcribe")
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@app.post(
    "/api/voice-query",
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Speak at any time: either ask questions about a bill or describe a situation",
)
async def voice_query(
    audio: UploadFile = File(...),
    context: Optional[str] = Form(None),
    target_language: str = Form("hi-IN"),
) -> JSONResponse:
    """Accept spoken query and return either document analysis or conversational answer with audio."""
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    try:
        result = handle_voice_query(
            audio_bytes=audio_bytes,
            context_json=context,
            target_language=target_language,
        )
        return JSONResponse(content=result)
    except RuntimeError as exc:
        error_msg = str(exc)
        if "not configured" in error_msg.lower() or "transcription failed" in error_msg.lower():
            raise HTTPException(status_code=503, detail=error_msg) from exc
        raise HTTPException(status_code=500, detail=error_msg) from exc
    except Exception as exc:
        logger.exception("Unexpected error in /api/voice-query")
        raise HTTPException(status_code=500, detail="Internal server error") from exc

