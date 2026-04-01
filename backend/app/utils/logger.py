from app import db  # ambil koneksi database
from app.models import SystemLog  # model tabel log
from datetime import datetime  # buat ambil waktu sekarang
import logging as python_logging  # logging bawaan python (buat backup error)
from datetime import timedelta  # buat hitung mundur waktu

logger = python_logging.getLogger(__name__)  # bikin logger biasa buat debug


class SystemLogger:
    """pusat logging semua aktivitas sistem"""

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
        try:
            # bikin object log baru
            log = SystemLog(
                timestamp=datetime.utcnow(),  # waktu sekarang (UTC)
                level=level,  # level log (success, error, dll)
                source=source,  # dari mana (misal: auth, ML)
                message=message,  # isi pesan
                details=details,  # detail tambahan (biasanya error)
                user_id=user_id,  # id user yg melakukan
                action_type=action_type,  # aksi (create, delete, dll)
                entity_type=entity_type,  # jenis data (stock, user, dll)
                entity_id=entity_id,  # id data
                ip_address=ip_address,  # ip user
            )

            db.session.add(log)  # masukin ke DB
            db.session.commit()  # simpan permanen
            return log  # balikin hasil

        except Exception as e:
            logger.error(f"Failed to log: {str(e)}")  # tampil error di console
            try:
                db.session.rollback()  # batalin biar DB aman
            except Exception:
                pass
            return None  # kalau gagal

    # shortcut biar gak nulis panjang
    @staticmethod
    def success(source: str, message: str, **kwargs):
        return SystemLogger.log(level="success", source=source, message=message, **kwargs)

    @staticmethod
    def error(source: str, message: str, details: str = None, **kwargs):
        return SystemLogger.log(level="error", source=source, message=message, details=details, **kwargs)

    @staticmethod
    def warning(source: str, message: str, details: str = None, **kwargs):
        return SystemLogger.log(level="warning", source=source, message=message, details=details, **kwargs)

    @staticmethod
    def info(source: str, message: str, **kwargs):
        return SystemLogger.log(level="info", source=source, message=message, **kwargs)


# log buat CRUD saham
def log_stock_crud(action: str, stock_id: int, ticker: str, user_id: int = None, error: str = None, ip_address: str = None):
    if error:
        # kalau gagal
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
        # kalau berhasil
        SystemLogger.success(
            source="Stock Management",
            message=f"Saham {ticker} berhasil {action.lower()}",
            user_id=user_id,
            action_type=action,
            entity_type="Stock",
            entity_id=stock_id,
            ip_address=ip_address,
        )


# log buat hasil prediksi ML
def log_prediction(ticker: str, success: bool, error_msg: str = None, rmse: float = None, user_id: int = None, ip_address: str = None):
    if success:
        suffix = f" (RMSE: {rmse:.2f})" if rmse is not None else ""  # kalau ada nilai RMSE
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


# log buat login/logout user
def log_auth(action: str, username: str, user_id: int = None, success: bool = True, error_msg: str = None, ip_address: str = None):
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


# log buat glosarium
def log_glossary(action: str, term: str, user_id: int = None, error: str = None, ip_address: str = None):
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


# log buat API / service luar
def log_external_service(source: str, message: str, details: str = None, success: bool = False, user_id: int = None, ip_address: str = None):
    fn = SystemLogger.success if success else SystemLogger.error  # pilih otomatis success/error
    return fn(
        source=source,
        message=message,
        details=details,
        user_id=user_id,
        action_type="EXTERNAL_SERVICE",
        entity_type="System",
        ip_address=ip_address,
    )

# auto hapus log lama (lebih dari 6 bulan)
def cleanup_old_logs():
    try:
        # hitung batas waktu (6 bulan kebelakang)
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        # ambil log yg lebih lama dari 6 bulan
        old_logs = SystemLog.query.filter(SystemLog.timestamp < six_months_ago)

        deleted_count = old_logs.count()  # jumlah yg mau dihapus

        old_logs.delete()  # hapus semua
        db.session.commit()  # simpan perubahan

        logger.info(f"Cleanup log: {deleted_count} data lama dihapus")  # log hasil

        return deleted_count

    except Exception as e:
        logger.error(f"Gagal cleanup log: {str(e)}")
        try:
            db.session.rollback()  # rollback kalau error
        except Exception:
            pass
        return 0