# Import library jwt untuk encode & decode token
import jwt

# Import datetime untuk mengatur waktu expired token
from datetime import datetime, timedelta, timezone

# Import current_app untuk akses config Flask
from flask import current_app


def generate_jwt(user):
    """
    Fungsi untuk membuat JWT token berdasarkan data user.

    Alur:
    1. Ambil durasi expired dari config
    2. Hitung waktu expired
    3. Buat payload (isi token)
    4. Encode jadi JWT string
    """

    # Ambil durasi expired (dalam menit) dari config Flask
    expires_minutes = int(current_app.config["JWT_EXPIRES_MINUTES"])

    # Hitung waktu expired token (UTC timezone)
    exp_time = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

    # Payload JWT (data yang akan disimpan di dalam token)
    payload = {
        "sub": str(user.id),      # subject (standar JWT) → biasanya ID user
        "id": user.id,            # ID user
        "username": user.username, # username user
        "role": "admin",          # role user (di sini hardcoded admin)
        "exp": exp_time           # waktu expired token
    }

    # Encode payload menjadi JWT
    # Menggunakan secret key dari config Flask
    # Algoritma: HS256 (HMAC SHA-256)
    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256"
    )


def decode_jwt(token):
    """
    Fungsi untuk decode & verifikasi JWT token.

    Alur:
    1. Decode token menggunakan secret key
    2. Validasi signature & expiration otomatis
    3. Return payload jika valid
    """

    return jwt.decode(
        token,
        current_app.config["JWT_SECRET_KEY"],  # secret key harus sama dengan saat encode
        algorithms=["HS256"]                   # algoritma yang digunakan
    )