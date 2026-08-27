"""Helpers for preventing sensitive values from reaching logs."""
import re
from typing import Any

def mask_phone(value: Any) -> str:
    digits = re.sub(r"\D", "", str(value or ""))
    if len(digits) <= 4:
        return "***"
    return f"{digits[:2]}{'*' * max(0, len(digits) - 4)}{digits[-2:]}"

def redact_text(value: Any, max_length: int = 300) -> str:
    text = str(value or "")
    text = re.sub(r"(?i)(apikey|api[_-]?key|authorization|access[_-]?token|token|secret|password)\s*[:=]\s*[^,\s}]+", r"\1=[REDACTED]", text)
    text = re.sub(r"\b\d{10,14}\b", lambda m: mask_phone(m.group(0)), text)
    return text[:max_length]
