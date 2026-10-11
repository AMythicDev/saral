"""Core orchestration pipeline for document analysis and voice follow-up Q&A."""

from __future__ import annotations

import base64
import io
import json
import logging
import re
import time
from typing import Any

from app.prompts import FOLLOWUP_SYSTEM_PROMPT, SYSTEM_PROMPT
from app.sarvam_client import get_sarvam_client

logger = logging.getLogger(__name__)

# Valid speaker mapping per language according to bulbul:v4-flash model specs
VOICE_MAP: dict[str, tuple[str, str]] = {
    "hi-IN": ("hi-IN", "shubh_hi_ads"),
    "bn-IN": ("bn-IN", "arnab_bn_conversation"),
    "ta-IN": ("ta-IN", "vijay_ta_narration"),
    "te-IN": ("te-IN", "kavitha_te_conversation"),
    "mr-IN": ("mr-IN", "mrunal_mr_narration"),
    "gu-IN": ("gu-IN", "pooja_gu_conversational"),
    "kn-IN": ("kn-IN", "chaitra_kn_conversation"),
    "pa-IN": ("pa-IN", "harpreet_pa_narration"),
    "as-IN": ("as-IN", "kangkana_as_conversational"),
    "en-IN": ("en-IN", "shubh_enhi_ads"),
    # Languages where bulbul:v4-flash uses high-quality fallback voice
    "ml-IN": ("en-IN", "shubh_enhi_ads"),
    "od-IN": ("en-IN", "shubh_enhi_ads"),
    "ur-IN": ("hi-IN", "shubh_hi_ads"),
}


def _extract_content(choice: Any) -> str:
    """Safely extract assistant message text from an LLM choice object."""
    if not choice:
        return ""
    msg = getattr(choice, "message", None)
    if not msg:
        return ""
    content = getattr(msg, "content", None)
    if content:
        return str(content).strip()
    reasoning = getattr(msg, "reasoning_content", None)
    if reasoning:
        return str(reasoning).strip()
    return ""


def _parse_analysis_json(raw_text: str) -> dict[str, Any]:
    """Parse JSON output from LLM, stripping markdown fences and providing resilient defaults."""
    if not raw_text:
        return {
            "document_type": "Notice",
            "issuer": "Unspecified Issuer",
            "amount_due": "N/A",
            "due_date": "N/A",
            "summary": "Document received but detailed structure could not be parsed.",
            "action_items": ["Verify the source directly with the issuing authority before taking action."],
            "risk_assessment": {"level": "suspicious", "reason": "Message format could not be verified automatically."},
        }

    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    data: dict[str, Any] = {}
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Search for first { to last }
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
            except json.JSONDecodeError:
                data = {}

    # Extract and normalize risk assessment
    risk = data.get("risk_assessment")
    if not isinstance(risk, dict):
        raw_level = str(data.get("scam_risk", data.get("risk_level", "normal"))).lower()
        if "scam" in raw_level:
            level = "likely_scam"
        elif "suspicious" in raw_level or "caution" in raw_level:
            level = "suspicious"
        else:
            level = "normal"
        risk = {
            "level": level,
            "reason": str(data.get("risk_reason", data.get("reason", "Standard bill/notice evaluation."))),
        }

    # Normalize fields with safe fallbacks
    amount = data.get("amount_due")
    if amount is None or str(amount).lower() in ("null", "none"):
        amount = "Not mentioned"
    due_date = data.get("due_date")
    if due_date is None or str(due_date).lower() in ("null", "none"):
        due_date = "Not mentioned"

    return {
        "document_type": str(data.get("document_type") or "Document"),
        "issuer": str(data.get("issuer") or "Unknown Issuer"),
        "amount_due": str(amount),
        "due_date": str(due_date),
        "summary": str(data.get("summary") or cleaned[:300]),
        "action_items": list(data.get("action_items") or ["Check and verify the document details."]),
        "risk_assessment": risk,
    }


def _tts(text: str, target_language: str) -> str:
    """Synthesise text into speech and return base64-encoded audio."""
    client = get_sarvam_client()
    lang_code, speaker = VOICE_MAP.get(target_language, ("hi-IN", "shubh_hi_ads"))

    # Cap text length for TTS to prevent excessive processing
    truncated_text = text[:800] if len(text) > 800 else text

    try:
        response = client.text_to_speech.convert(
            text=truncated_text,
            language_code=lang_code,
            speaker=speaker,
            model="bulbul:v4-flash",
        )
        if hasattr(response, "audios") and response.audios:
            return response.audios[0]
        return ""
    except Exception as exc:
        logger.warning("Sarvam TTS convert failed for %s (%s): %s; trying fallback speaker", lang_code, speaker, exc)
        try:
            # Fallback to standard Hindi speaker
            response = client.text_to_speech.convert(
                text=truncated_text,
                language_code="hi-IN",
                speaker="shubh_hi_ads",
                model="bulbul:v4-flash",
            )
            if hasattr(response, "audios") and response.audios:
                return response.audios[0]
        except Exception as inner_exc:
            logger.warning("Fallback TTS also failed: %s", inner_exc)
        return ""


def _extract_text_from_file(file_bytes: bytes) -> str:
    """Extract text from an uploaded document using Sarvam Doc AI digitise."""
    client = get_sarvam_client()
    try:
        file_tuple = ("uploaded_doc", io.BytesIO(file_bytes), "application/octet-stream")
        job = client.doc_ai.digitise(file=file_tuple, output_format="md")
        job_id = getattr(job, "job_id", None)

        if not job_id:
            logger.warning("Doc AI digitise did not return job_id: %s", job)
            return "Unable to extract text from document automatically."

        # Poll for completion (up to 20 seconds)
        max_attempts = 10
        for _ in range(max_attempts):
            status_resp = client.doc_ai.get_status(job_id=job_id)
            current_status = getattr(status_resp, "status", "").lower()
            if current_status in ("completed", "done", "success"):
                break
            if current_status in ("failed", "error"):
                raise RuntimeError(f"Doc AI job {job_id} failed with status: {current_status}")
            time.sleep(2)

        # Retrieve results
        results = client.doc_ai.get_results(job_id=job_id)
        extracted_pages = []
        if hasattr(results, "documents") and results.documents:
            for doc in results.documents:
                if hasattr(doc, "pages") and doc.pages:
                    for page in doc.pages:
                        page_content = getattr(page, "content", getattr(page, "md", getattr(page, "text", "")))
                        if page_content:
                            extracted_pages.append(str(page_content))

        if extracted_pages:
            return "\n\n".join(extracted_pages)
        return str(results)

    except Exception as exc:
        logger.exception("Doc AI extraction error: %s", exc)
        raise RuntimeError(f"Document extraction failed: {exc}") from exc


def analyze_document(
    file_bytes: bytes | None = None,
    raw_text: str | None = None,
    target_language: str = "hi-IN",
) -> dict[str, Any]:
    """Analyse a bill, letter, or SMS and return structured JSON + audio."""
    if not file_bytes and not raw_text:
        raise ValueError("Provide either file_bytes or raw_text.")

    client = get_sarvam_client()

    # 1. Text extraction
    if file_bytes:
        extracted_text = _extract_text_from_file(file_bytes)
    else:
        extracted_text = raw_text or ""

    # 2. LLM Analysis with json_object format
    try:
        llm_response = client.chat.completions(
            model="sarvam-105b-conversations",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{SYSTEM_PROMPT}\n\n"
                        "IMPORTANT: You MUST return a single valid JSON object with the following keys:\n"
                        "- document_type (string)\n"
                        "- issuer (string)\n"
                        "- amount_due (string or 'Not mentioned')\n"
                        "- due_date (string or 'Not mentioned')\n"
                        "- summary (string: plain-language 2-3 sentence explanation)\n"
                        "- action_items (array of strings)\n"
                        "- risk_assessment (object with 'level': 'normal'|'suspicious'|'likely_scam' and 'reason': string)\n"
                        "Return ONLY the JSON object. Do not include markdown codeblocks or conversational text."
                    ),
                },
                {"role": "user", "content": f"Document text to analyze:\n\n{extracted_text}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.2,
        )
        raw_content = _extract_content(llm_response.choices[0])
        analysis = _parse_analysis_json(raw_content)
    except Exception as exc:
        logger.exception("LLM completion failed: %s", exc)
        raise RuntimeError(f"LLM analysis failed: {exc}") from exc

    # 3. Translation (if target is not English)
    translated_summary: str | None = None
    speak_text = analysis.get("summary", "")

    if target_language != "en-IN" and speak_text:
        try:
            translation = client.text.translate(
                input=speak_text,
                source_language_code="en-IN",
                target_language_code=target_language,
            )
            translated_summary = getattr(translation, "translated_text", None)
            if translated_summary:
                speak_text = translated_summary
        except Exception as exc:
            logger.warning("Translation to %s failed: %s; falling back to English", target_language, exc)

    # 4. Text-to-Speech
    audio_b64 = ""
    try:
        if speak_text:
            audio_b64 = _tts(speak_text, target_language)
    except Exception as exc:
        logger.warning("TTS generation failed: %s", exc)

    return {
        "document_type": analysis.get("document_type", "Unknown Document"),
        "issuer": analysis.get("issuer", "Unknown Issuer"),
        "amount_due": analysis.get("amount_due", "N/A"),
        "due_date": analysis.get("due_date", "N/A"),
        "summary": analysis.get("summary", ""),
        "translated_summary": translated_summary,
        "action_items": analysis.get("action_items", []),
        "risk_assessment": analysis.get("risk_assessment", {
            "level": "normal",
            "reason": "Analysis completed without red flags.",
        }),
        "audio_base64": audio_b64,
    }


def handle_followup(
    audio_bytes: bytes,
    context_json: str,
    target_language: str = "hi-IN",
) -> dict[str, Any]:
    """Transcribe voice question with Saaras STT, query LLM, and return TTS audio."""
    client = get_sarvam_client()

    # 1. Transcribe voice question
    try:
        audio_file = ("user_question.wav", io.BytesIO(audio_bytes), "audio/wav")
        stt_resp = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v4",
            mode="translate",
        )
        user_question = getattr(stt_resp, "transcript", str(stt_resp))
    except Exception as exc:
        logger.exception("STT transcription failed: %s", exc)
        raise RuntimeError(f"Transcription failed: {exc}") from exc

    # 2. Query LLM
    try:
        prompt_content = f"Previous document context:\n{context_json}\n\nUser Question:\n{user_question}"
        llm_resp = client.chat.completions(
            model="sarvam-105b-conversations",
            messages=[
                {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content},
            ],
            max_tokens=800,
            temperature=0.3,
        )
        answer = _extract_content(llm_resp.choices[0]) or "I could not generate an answer for this question."
    except Exception as exc:
        logger.exception("Follow-up LLM completion failed: %s", exc)
        raise RuntimeError(f"Follow-up LLM failed: {exc}") from exc

    # 3. Translate answer
    translated_answer: str | None = None
    speak_text = answer
    if target_language != "en-IN" and answer:
        try:
            translation = client.text.translate(
                input=answer,
                source_language_code="en-IN",
                target_language_code=target_language,
            )
            translated_answer = getattr(translation, "translated_text", None)
            if translated_answer:
                speak_text = translated_answer
        except Exception as exc:
            logger.warning("Followup translation to %s failed: %s", target_language, exc)

    # 4. Synthesize voice answer
    audio_b64 = ""
    try:
        if speak_text:
            audio_b64 = _tts(speak_text, target_language)
    except Exception as exc:
        logger.warning("Followup TTS failed: %s", exc)

    return {
        "answer": answer,
        "translated_answer": translated_answer,
        "audio_base64": audio_b64,
    }


def transcribe_audio(
    audio_bytes: bytes,
    mode: str = "transcribe",
) -> str:
    """Transcribe raw audio bytes using Sarvam Saaras STT."""
    client = get_sarvam_client()
    try:
        audio_file = ("user_voice.wav", io.BytesIO(audio_bytes), "audio/wav")
        stt_resp = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v4",
            mode=mode,
        )
        return getattr(stt_resp, "transcript", str(stt_resp))
    except Exception as exc:
        logger.exception("STT transcription failed: %s", exc)
        raise RuntimeError(f"Transcription failed: {exc}") from exc


def handle_voice_query(
    audio_bytes: bytes,
    context_json: str | None = None,
    target_language: str = "hi-IN",
) -> dict[str, Any]:
    """Transcribe user voice and either answer in context or perform full analysis."""
    if context_json and context_json.strip():
        return handle_followup(audio_bytes, context_json, target_language)

    # Direct voice query with no prior document context
    transcript = transcribe_audio(audio_bytes, mode="translate")
    analysis = analyze_document(raw_text=transcript, target_language=target_language)
    analysis["user_prompt"] = transcript
    return analysis
