"""Pydantic response models for the Saral API."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class RiskAssessment(BaseModel):
    """Fraud / scam risk assessment returned by the LLM."""

    level: Literal["normal", "suspicious", "likely_scam"] = Field(
        ..., description="Overall fraud-risk level."
    )
    reason: str = Field(
        ..., description="Brief explanation of the assigned risk level."
    )


class AnalysisResult(BaseModel):
    """Structured result of a bill / letter / SMS analysis."""

    document_type: str = Field(..., description="Category of the document.")
    issuer: str = Field(..., description="Organisation or person that issued the document.")
    amount_due: str = Field(..., description="Amount payable, with currency symbol.")
    due_date: str = Field(..., description="Payment or response deadline (DD-MM-YYYY or N/A).")
    summary: str = Field(..., description="Plain-language summary in English.")
    translated_summary: Optional[str] = Field(
        None, description="Summary translated into the target language, if applicable."
    )
    action_items: list[str] = Field(
        default_factory=list, description="Concrete steps the recipient should take."
    )
    risk_assessment: RiskAssessment
    audio_base64: str = Field(
        ..., description="Base64-encoded audio of the summary spoken aloud."
    )


class FollowupResult(BaseModel):
    """Result of a follow-up voice question about a previously analysed document."""

    answer: str = Field(..., description="Plain-language answer in English.")
    translated_answer: Optional[str] = Field(
        None, description="Answer translated into the target language, if applicable."
    )
    audio_base64: str = Field(
        ..., description="Base64-encoded audio of the answer spoken aloud."
    )


class ErrorResponse(BaseModel):
    """Standard error envelope returned by the API."""

    detail: str = Field(..., description="Human-readable error message.")
