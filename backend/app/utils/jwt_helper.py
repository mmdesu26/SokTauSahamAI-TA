import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app

def generate_jwt(user):
    expires_minutes = int(current_app.config["JWT_EXPIRES_MINUTES"])
    exp_time = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

    payload = {
        "sub": str(user.id),
        "id": user.id,
        "username": user.username,
        "role": "admin",
        "exp": exp_time
    }

    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256"
    )

def decode_jwt(token):
    return jwt.decode(
        token,
        current_app.config["JWT_SECRET_KEY"],
        algorithms=["HS256"]
    )