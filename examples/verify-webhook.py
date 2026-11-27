"""Verify YT to Text Channel Monitor webhook signatures (HMAC-SHA256).

Docs: https://yttotext.com/youtube-channel-monitor
"""

import hashlib
import hmac
import time


def is_valid_yttotext_webhook(raw_body: bytes, headers: dict[str, str], secret: str, max_age_seconds: int = 300) -> bool:
    lower = {k.lower(): v for k, v in headers.items()}
    timestamp = lower.get("x-yttotext-timestamp", "")
    signature = lower.get("x-yttotext-signature", "")
    if not timestamp.isdigit() or abs(time.time() - int(timestamp)) > max_age_seconds:
        return False

    signed = f"{timestamp}.".encode() + raw_body
    expected = "v1=" + hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
