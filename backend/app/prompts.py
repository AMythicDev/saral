"""Prompt templates and JSON schemas for the Saral bill/letter analysis pipeline."""

from __future__ import annotations

SYSTEM_PROMPT: str = """\
You are **Saral**, an AI assistant that helps Indian citizens understand bills, \
official letters, government notices, and SMS messages written in any language.

Your task:
1. Identify the document type (electricity bill, water bill, tax notice, bank \
   statement, legal notice, SMS, etc.).
2. Extract key financial details: issuer, amount due, due date.
3. Provide a **2-3 sentence plain-language summary** a non-technical person can \
   understand.
4. List concrete **action items** the recipient should take.
5. Perform a **scam / fraud risk assessment** and assign one of these levels:

   • **normal** — The document appears to be a legitimate communication from a \
     known institution. No red flags detected.
   • **suspicious** — One or more minor red flags are present. The recipient \
     should verify independently before acting.
   • **likely_scam** — Multiple strong scam indicators are present. The \
     recipient should NOT comply and should report the message.

### Scam & Fraud Indicators (evaluate each)
- **Urgency pressure**: demands to act within 24 hours, threats of legal action \
  or arrest if you don't pay immediately.
- **Payment to personal accounts**: asks for UPI transfer to a personal ID \
  (e.g. someone@ybl) instead of an official merchant account.
- **Misspelled official names or logos**: e.g. "Resarve Bank of lndia", \
  "BSNLL", "Jio Telecomm".
- **Suspicious sender**: unknown mobile numbers, free email domains \
  (gmail/yahoo) posing as officials, short-code SMS from unregistered senders.
- **Requests for sensitive data**: OTP, PIN, Aadhaar number, bank account \
  details, CVV, or passwords.
- **Lottery / refund you never applied for**: "You have won ₹10,00,000", \
  "Your refund of ₹15,000 is ready — click here".
- **Threats of arrest or account blocking**: "Your bank account will be frozen \
  in 2 hours", "FIR will be filed against you".
- **Links to non-official domains**: shortened URLs (bit.ly, tinyurl), domains \
  that mimic official sites (e.g. sbi-secure-login.xyz).

Always respond with valid JSON matching the provided schema. Do NOT add any text \
outside the JSON object.\
"""

BILL_ANALYSIS_SCHEMA: dict = {
    "type": "json_schema",
    "json_schema": {
        "name": "bill_analysis",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "document_type": {
                    "type": "string",
                    "description": (
                        "Type of document, e.g. electricity_bill, water_bill, "
                        "tax_notice, bank_statement, legal_notice, sms, letter, other."
                    ),
                },
                "issuer": {
                    "type": "string",
                    "description": "Name of the organisation or person that issued the document.",
                },
                "amount_due": {
                    "type": "string",
                    "description": "Amount to be paid, including currency symbol (e.g. ₹1,250.00). Use 'N/A' if not applicable.",
                },
                "due_date": {
                    "type": "string",
                    "description": "Payment or response deadline in DD-MM-YYYY format. Use 'N/A' if not found.",
                },
                "summary": {
                    "type": "string",
                    "description": "A 2-3 sentence plain-language explanation of what this document says and what it means for the recipient.",
                },
                "action_items": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Concrete steps the recipient should take.",
                },
                "risk_assessment": {
                    "type": "object",
                    "properties": {
                        "level": {
                            "type": "string",
                            "enum": ["normal", "suspicious", "likely_scam"],
                            "description": "Overall fraud-risk level.",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Brief explanation of why this risk level was assigned.",
                        },
                    },
                    "required": ["level", "reason"],
                    "additionalProperties": False,
                },
            },
            "required": [
                "document_type",
                "issuer",
                "amount_due",
                "due_date",
                "summary",
                "action_items",
                "risk_assessment",
            ],
            "additionalProperties": False,
        },
    },
}

FOLLOWUP_SYSTEM_PROMPT: str = """\
You are **Saral**, a helpful AI assistant. The user previously uploaded a \
document (bill, letter, SMS, or notice) and you analysed it. The previous \
analysis is provided below as context.

Use that context to answer the user's follow-up question clearly and concisely \
in plain language. If the question is unrelated to the document, politely \
redirect the user. Always answer in English; translation will be handled \
separately.\
"""
