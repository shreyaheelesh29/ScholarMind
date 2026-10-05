"""Small, dependency-free password and bearer-token helpers."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from typing import Any

PBKDF2_ROUNDS = 310_000


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${PBKDF2_ROUNDS}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, rounds, salt, expected = encoded.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.urlsafe_b64decode(salt + "=="), int(rounds))
        return hmac.compare_digest(_b64(digest), expected)
    except (ValueError, TypeError):
        return False


def token_secret() -> bytes:
    secret = os.getenv("AUTH_SECRET", "").strip()
    if len(secret) < 32:
        raise RuntimeError("AUTH_SECRET must be set to a random value of at least 32 characters.")
    return secret.encode()


def create_token(user: dict[str, Any], lifetime_seconds: int = 60 * 60 * 24 * 7) -> str:
    now = int(time.time())
    payload = {"sub": user["id"], "email": user["email"], "role": user["role"], "iat": now, "exp": now + lifetime_seconds}
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    signature = _b64(hmac.new(token_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{signature}"


def decode_token(token: str) -> dict[str, Any]:
    try:
        body, signature = token.split(".", 1)
        expected = _b64(hmac.new(token_secret(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid token")
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if int(payload["exp"]) <= int(time.time()):
            raise ValueError("Expired token")
        return payload
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid or expired bearer token") from exc


def is_valid_email(email: str) -> bool:
    return bool(re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email))
