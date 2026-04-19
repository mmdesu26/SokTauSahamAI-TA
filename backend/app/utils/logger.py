# Import koneksi database dari app
from app import db

# Import model SystemLog (tabel untuk menyimpan log)
from app.models import SystemLog

# Import datetime untuk mendapatkan waktu sekarang (UTC)
from datetime import datetime

# Import logging bawaan Python (sebagai fallback jika DB gagal)
import logging as python_logging

# Import timedelta untuk menghitung waktu (misalnya 6 bulan lalu)
from datetime import timedelta

# Membuat logger Python biasa untuk debugging internal
logger = python_logging.getLogger(__name__)


class SystemLogger:
    """
    Class utama untuk mencatat semua aktivitas sistem ke database.

    Digunakan untuk:
    - logging aktivitas user (login, CRUD)
    - logging error sistem
    - logging ML prediction
    - audit trail (penting di sistem finansial)
    """

    @staticmethod
    def log(
        level: str,
        source: str,
        message: str,
        details: str = None,
        user_id: int = None,
        action_type: str = None,
        entity_type: str = None,
        entity_id: int = None,
        ip_address: str = None,
    ):
        """
        Fungsi utama untuk menyimpan log ke database.

        Parameter:
        - level: jenis log (success, error, warning, info)
        - source: asal log (Auth, ML, Stock, dll)
        - message: pesan utama
        - details: detail tambahan (biasanya error)
        - user_id: ID user yang melakukan aksi
        - action_type: jenis aksi (CREATE, DELETE, LOGIN, dll)
        - entity_type: jenis data (Stock, User, dll)
        - entity_id: ID data yang terkait
        - ip_address: IP user
        """
        try:
            # Membuat object log baru
            log = SystemLog(
                timestamp=datetime.utcnow(),  # waktu sekarang (UTC)
                level=level,
                source=source,
                message=message,
                details=details,
                user_id=user_id,
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                ip_address=ip_address,
            )

            # Simpan ke database
            db.session.add(log)
            db.session.commit()

            return log

        except Exception as e:
            # Jika gagal simpan ke DB, log ke console
            logger.error(f"Failed to log: {str(e)}")

            # Rollback agar DB tetap aman
            try:
                db.session.rollback()
            except Exception:
                pass

            return None

    # =========================
    # Shortcut Methods
    # =========================

    @staticmethod
    def success(source: str, message: str, **kwargs):
        """Shortcut untuk log success"""
        return SystemLogger.log(level="success", source=source, message=message, **kwargs)

    @staticmethod
    def error(source: str, message: str, details: str = None, **kwargs):
        """Shortcut untuk log error"""
        return SystemLogger.log(level="error", source=source, message=message, details=details, **kwargs)

    @staticmethod
    def warning(source: str, message: str, details: str = None, **kwargs):
        """Shortcut untuk log warning"""
        return SystemLogger.log(level="warning", source=source, message=message, details=details, **kwargs)

    @staticmethod
    def info(source: str, message: str, **kwargs):
        """Shortcut untuk log info"""
        return SystemLogger.log(level="info", source=source, message=message, **kwargs)


# =========================
# LOG KHUSUS (DOMAIN-BASED)
# =========================

def log_stock_crud(action: str, stock_id: int, ticker: str,
                   user_id: int = None, error: str = None, ip_address: str = None):
    """
    Logging untuk operasi CRUD saham (CREATE, UPDATE, DELETE)
    """
    if error:
        # Jika gagal
        SystemLogger.error(
            source="Stock Management",
            message=f"Gagal {action.lower()} saham {ticker}",
            details=error,
            user_id=user_id,
            action_type=action,
            entity_type="Stock",
            entity_id=stock_id,
            ip_address=ip_address,
        )
    else:
        # Jika berhasil
        SystemLogger.success(
            source="Stock Management",
            message=f"Saham {ticker} berhasil {action.lower()}",
            user_id=user_id,
            action_type=action,
            entity_type="Stock",
            entity_id=stock_id,
            ip_address=ip_address,
        )


def log_prediction(ticker: str, success: bool,
                   error_msg: str = None, mape: float = None,
                   user_id: int = None, ip_address: str = None):
    """
    Logging untuk hasil prediksi Machine Learning
    """
    if success:
        suffix = f" (MAPE: {mape:.2f}%)" if mape is not None else ""

        SystemLogger.success(
            source="ML Prediction",
            message=f"Prediksi berhasil dibuat untuk {ticker}{suffix}",
            user_id=user_id,
            action_type="PREDICT",
            entity_type="Prediction",
            ip_address=ip_address,
        )
    else:
        SystemLogger.error(
            source="ML Prediction",
            message=f"Prediksi gagal untuk {ticker}",
            details=error_msg,
            user_id=user_id,
            action_type="PREDICT",
            entity_type="Prediction",
            ip_address=ip_address,
        )


def log_auth(action: str, username: str,
             user_id: int = None, success: bool = True,
             error_msg: str = None, ip_address: str = None):
    """
    Logging untuk autentikasi (LOGIN, LOGOUT, PASSWORD_CHANGE)
    """
    if success:
        SystemLogger.success(
            source="Authentication",
            message=f"User {username} berhasil {action.lower()}",
            user_id=user_id,
            action_type=action,
            entity_type="User",
            entity_id=user_id,
            ip_address=ip_address,
        )
    else:
        SystemLogger.error(
            source="Authentication",
            message=f"User {username} gagal {action.lower()}",
            details=error_msg,
            user_id=user_id,
            action_type=action,
            entity_type="User",
            ip_address=ip_address,
        )


def log_glossary(action: str, term: str,
                 user_id: int = None, error: str = None, ip_address: str = None):
    """
    Logging untuk CRUD glosarium
    """
    if error:
        SystemLogger.error(
            source="Glossary Management",
            message=f"Gagal {action.lower()} glosarium '{term}'",
            details=error,
            user_id=user_id,
            action_type=action,
            entity_type="Glossary",
            ip_address=ip_address,
        )
    else:
        SystemLogger.success(
            source="Glossary Management",
            message=f"Glosarium '{term}' berhasil {action.lower()}",
            user_id=user_id,
            action_type=action,
            entity_type="Glossary",
            ip_address=ip_address,
        )


def log_external_service(source: str, message: str,
                         details: str = None, success: bool = False,
                         user_id: int = None, ip_address: str = None):
    """
    Logging untuk API/service eksternal (misal: Yahoo Finance)
    """
    fn = SystemLogger.success if success else SystemLogger.error

    return fn(
        source=source,
        message=message,
        details=details,
        user_id=user_id,
        action_type="EXTERNAL_SERVICE",
        entity_type="System",
        ip_address=ip_address,
    )


# =========================
# CLEANUP LOG
# =========================

def cleanup_old_logs():
    """
    Menghapus log lama (> 6 bulan)
    Berguna untuk:
    - menghemat storage
    - menjaga performa database
    """
    try:
        # Hitung batas waktu (6 bulan lalu)
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        # Ambil log lama
        old_logs = SystemLog.query.filter(SystemLog.timestamp < six_months_ago)

        # Hitung jumlah yang akan dihapus
        deleted_count = old_logs.count()

        # Hapus semua log lama
        old_logs.delete()

        # Commit perubahan
        db.session.commit()

        # Log hasil cleanup
        logger.info(f"Cleanup log: {deleted_count} data lama dihapus")

        return deleted_count

    except Exception as e:
        logger.error(f"Gagal cleanup log: {str(e)}")

        try:
            db.session.rollback()
        except Exception:
            pass

        return 0