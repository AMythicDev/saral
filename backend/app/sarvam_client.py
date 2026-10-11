"""Sarvam AI client initialization and helper."""

from __future__ import annotations

import logging
import os
from typing import Optional

from dotenv import load_dotenv
from sarvamai import SarvamAI

load_dotenv()
logger = logging.getLogger(__name__)

_client_instance: Optional[SarvamAI] = None


def get_sarvam_client() -> SarvamAI:
    """Return the singleton SarvamAI client, initializing it if needed.

    Raises:
        RuntimeError: If SARVAM_API_KEY environment variable is not set.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise RuntimeError(
            "SARVAM_API_KEY is not configured. "
            "Please create a .env file in the backend directory with your key: SARVAM_API_KEY=your_key"
        )

    _client_instance = SarvamAI(api_subscription_key=api_key)
    return _client_instance


def is_api_configured() -> bool:
    """Check if SARVAM_API_KEY is present in the environment."""
    key = os.getenv("SARVAM_API_KEY")
    return bool(key and key != "your_api_key_here")
