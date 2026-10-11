"""SQLite database module for bill reminders.

Uses the stdlib ``sqlite3`` driver with a ``threading.Lock`` for thread safety
(FastAPI dispatches sync callables on a threadpool).  The database file is
stored at ``backend/data/reminders.db`` relative to the project root.
"""

from __future__ import annotations

import logging
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database location
# ---------------------------------------------------------------------------
_DB_DIR: Path = Path(__file__).resolve().parent.parent / "data"
_DB_PATH: Path = _DB_DIR / "reminders.db"

_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Date parsing helpers
# ---------------------------------------------------------------------------

# Formats to try when ``dateutil`` is unavailable.
_DATE_FORMATS: list[str] = [
    "%d-%m-%Y",       # 25-12-2025
    "%d/%m/%Y",       # 25/12/2025
    "%d %B %Y",       # 25 December 2025
    "%d %b %Y",       # 25 Dec 2025
    "%B %d, %Y",      # December 25, 2025
    "%b %d, %Y",      # Dec 25, 2025
    "%Y-%m-%d",       # 2025-12-25  (ISO)
    "%d.%m.%Y",       # 25.12.2025
    "%m/%d/%Y",       # 12/25/2025
    "%d %B, %Y",      # 25 December, 2025
    "%B %d %Y",       # December 25 2025
]


def _parse_due_date(raw: str) -> Optional[str]:
    """Attempt to parse *raw* into ISO ``YYYY-MM-DD`` format.

    Tries ``python-dateutil`` first, then falls back to a list of common
    ``strptime`` patterns.  Returns ``None`` on failure.
    """
    if not raw or raw.strip().upper() in {"N/A", "NA", "-", "NONE", ""}:
        return None

    cleaned = raw.strip()

    # 1. Try dateutil ---------------------------------------------------------
    try:
        from dateutil import parser as _du_parser  # type: ignore[import-untyped]

        parsed = _du_parser.parse(cleaned, dayfirst=True)
        return parsed.strftime("%Y-%m-%d")
    except Exception:  # noqa: BLE001
        pass

    # 2. Manual strptime fallback ---------------------------------------------
    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    logger.warning("Could not parse due_date: %r", raw)
    return None


# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------

def _get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row-factory set to ``sqlite3.Row``."""
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------------------------
# Schema initialisation
# ---------------------------------------------------------------------------

_CREATE_TABLE_SQL = """\
CREATE TABLE IF NOT EXISTS reminders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type   TEXT    NOT NULL,
    issuer          TEXT    NOT NULL,
    amount_due      TEXT    NOT NULL,
    due_date        TEXT    NOT NULL,
    due_date_parsed TEXT,
    summary         TEXT    NOT NULL,
    risk_level      TEXT    NOT NULL DEFAULT 'normal',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    is_dismissed    INTEGER NOT NULL DEFAULT 0
);
"""


def init_db() -> None:
    """Create the ``reminders`` table if it does not already exist."""
    _DB_DIR.mkdir(parents=True, exist_ok=True)
    with _lock:
        conn = _get_connection()
        try:
            conn.execute(_CREATE_TABLE_SQL)
            conn.commit()
        finally:
            conn.close()
    logger.info("Database initialised at %s", _DB_PATH)


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------

def add_reminder(
    document_type: str,
    issuer: str,
    amount_due: str,
    due_date: str,
    summary: str,
    risk_level: str = "normal",
) -> int:
    """Insert a new reminder and return its row id.

    ``due_date`` is stored verbatim; an ISO-parsed version is stored
    separately in ``due_date_parsed`` (or ``NULL`` on parse failure).
    """
    due_date_parsed = _parse_due_date(due_date)

    with _lock:
        conn = _get_connection()
        try:
            cursor = conn.execute(
                """
                INSERT INTO reminders
                    (document_type, issuer, amount_due, due_date, due_date_parsed, summary, risk_level)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (document_type, issuer, amount_due, due_date, due_date_parsed, summary, risk_level),
            )
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]
        finally:
            conn.close()


def get_reminders(include_dismissed: bool = False) -> list[dict]:
    """Return all reminders as a list of dicts.

    Sorted by ``due_date_parsed ASC NULLS LAST``, then ``created_at DESC``.
    If *include_dismissed* is ``False`` (the default), dismissed reminders are
    excluded.
    """
    query = "SELECT * FROM reminders"
    if not include_dismissed:
        query += " WHERE is_dismissed = 0"
    # SQLite sorts NULLs first by default; use a CASE to push them last.
    query += (
        " ORDER BY CASE WHEN due_date_parsed IS NULL THEN 1 ELSE 0 END,"
        " due_date_parsed ASC,"
        " created_at DESC"
    )

    with _lock:
        conn = _get_connection()
        try:
            rows = conn.execute(query).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()


def dismiss_reminder(reminder_id: int) -> bool:
    """Mark a reminder as dismissed.  Returns ``True`` if the row existed."""
    with _lock:
        conn = _get_connection()
        try:
            cursor = conn.execute(
                "UPDATE reminders SET is_dismissed = 1 WHERE id = ?",
                (reminder_id,),
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


def delete_reminder(reminder_id: int) -> bool:
    """Permanently delete a reminder.  Returns ``True`` if the row existed."""
    with _lock:
        conn = _get_connection()
        try:
            cursor = conn.execute(
                "DELETE FROM reminders WHERE id = ?",
                (reminder_id,),
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Auto-initialise on import
# ---------------------------------------------------------------------------
init_db()
