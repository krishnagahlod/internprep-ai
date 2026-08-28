import re
import logging
from typing import Any

logger = logging.getLogger("internprep.security")

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
TOKEN_REGEX = re.compile(r'\b(?:Bearer\s+)?eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b')
KEY_REGEX = re.compile(r'\b(?:AIzaSy[0-9A-Za-z_-]{33}|sk-[0-9A-Za-z_-]{20,}|gsk_[0-9A-Za-z_-]{20,}|csk-[0-9A-Za-z_-]{20,}|rzp_(?:test|live)_[0-9A-Za-z]{14})\b')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')

def redact_sensitive_data(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)
    text = TOKEN_REGEX.sub('[REDACTED_TOKEN]', text)
    text = KEY_REGEX.sub('[REDACTED_KEY]', text)
    text = EMAIL_REGEX.sub('[REDACTED_EMAIL]', text)
    text = PHONE_REGEX.sub('[REDACTED_PHONE]', text)
    return text


def safe_log_info(message: str, **kwargs):
    sanitized = redact_sensitive_data(message)
    logger.info(sanitized, **kwargs)


def safe_log_error(message: str, exc: Any = None, **kwargs):
    sanitized = redact_sensitive_data(message)
    if exc:
        sanitized_exc = redact_sensitive_data(str(exc))
        logger.error(f"{sanitized} - Error: {sanitized_exc}", **kwargs)
    else:
        logger.error(sanitized, **kwargs)
