# Import os untuk membaca environment variable dari sistem
import os

# Import load_dotenv untuk membaca file .env
from dotenv import load_dotenv

# Load semua variabel dari file .env ke environment
load_dotenv()


class Config:
    """
    Class konfigurasi utama aplikasi Flask.

    Digunakan untuk:
    - Secret key
    - Database connection
    - JWT config
    """

    # =========================
    # FLASK SECRET KEY
    # =========================
    # Secret key untuk keamanan Flask (session, CSRF, dll)
    # Jika tidak ada di .env, gunakan fallback (TIDAK AMAN untuk production)
    SECRET_KEY = os.getenv("SECRET_KEY") or "fallback-secret-key-jangan-dipakai-production"


    # =========================
    # DATABASE CONFIG
    # =========================
    # URL koneksi database MySQL menggunakan driver pymysql
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )

    # Nonaktifkan fitur tracking perubahan object (hemat memory)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Opsi tambahan engine database:
    # pool_pre_ping → cek koneksi sebelum dipakai (hindari connection timeout)
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True
    }


    # =========================
    # JWT CONFIG
    # =========================
    # Secret key untuk signing JWT token
    # Jika tidak ada di .env → fallback (tidak aman untuk production)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or "fallback-jwt-secret-jangan-dipakai-production"

    # Waktu expired token dalam menit
    # Default: 20 menit jika tidak diset di .env
    JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", 20))