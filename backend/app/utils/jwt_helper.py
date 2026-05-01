# Import library jwt untuk encode/decode token
import jwt

# Import datetime untuk mengatur waktu expired token
from datetime import datetime, timedelta, timezone

# Import current_app untuk ambil config Flask
from flask import current_app


def generate_jwt(user):
    """
    Membuat JWT token untuk user.

    Isi token:
    - id, username, role
    - token_version → penting untuk invalidasi token lama
    - exp → waktu expired token
    """

    # Ambil durasi expired dari config
    expires_minutes = int(current_app.config["JWT_EXPIRES_MINUTES"])

    # Hitung waktu expired
    exp_time = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

    # Payload token
    payload = {
        "sub": str(user.id),
        "id": user.id,
        "username": user.username,
        "role": "admin",

        # 🔥 penting: untuk invalidate token lama
        "token_version": user.token_version,

        "exp": exp_time,
    }

    # Encode token menggunakan secret key
    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256"
    )


def decode_jwt(token):
    """
    Decode JWT token menjadi payload.

    Akan raise error jika:
    - token expired
    - token tidak valid
    """
    return jwt.decode(
        token,
        current_app.config["JWT_SECRET_KEY"], # Ambil secret key dari config dan harus sama
        algorithms=["HS256"] # algoritma yang digunakan saat encode
    )