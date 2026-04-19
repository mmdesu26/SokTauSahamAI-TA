# ============================================================
# app/__init__.py — factory Flask, inisialisasi extensions + blueprint
# ============================================================

from flask import Flask  # core framework
from flask_bcrypt import Bcrypt  # hash password
from flask_cors import CORS  # biar frontend beda origin bisa akses
from flask_limiter import Limiter  # rate limiting
from flask_limiter.util import get_remote_address  # kunci rate limit by IP
from flask_sqlalchemy import SQLAlchemy  # ORM

from app.config import Config  # config app

# --- extension global — dipake di seluruh app ---
db = SQLAlchemy()  # ORM instance
bcrypt = Bcrypt()  # password hasher
limiter = Limiter(  # rate limiter
    key_func=get_remote_address,  # key: IP request
    default_limits=["200 per day", "50 per hour"],  # default limit
    storage_uri="memory://",  # simpen di memory (dev). Prod: pake redis://
)


def create_app():
    # factory pattern — bikin Flask app instance
    app = Flask(__name__)  # instantiate
    app.config.from_object(Config)  # load config dari class

    # bind extension ke app
    db.init_app(app)  # hook SQLAlchemy
    bcrypt.init_app(app)  # hook bcrypt
    limiter.init_app(app)  # hook limiter

    # setup CORS — allow frontend dev server (Vite default 5173)
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173", "http://localhost:3000"]
            }
        },
        supports_credentials=False,  # false = nggak butuh cookie auth
    )

    # import blueprint di dalam factory biar hindari circular import
    from app.routes.auth_routes import auth_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.investor_routes import investor_bp
    from app.routes.glossary import glossary_bp
    from app.routes.stocks import stocks_bp

    # daftarin blueprint dengan prefix URL
    app.register_blueprint(auth_bp, url_prefix="/api/auth")  # login/logout
    app.register_blueprint(admin_bp, url_prefix="/api/admin")  # fitur admin
    app.register_blueprint(investor_bp, url_prefix="/api/investor")  # fitur user
    app.register_blueprint(glossary_bp, url_prefix="/api")  # glossary istilah
    app.register_blueprint(stocks_bp, url_prefix="/api")  # data saham + prediksi

    # healthcheck endpoint — buat cek server hidup
    @app.route("/api/health")
    def health():
        try:
            conn = db.engine.connect()  # coba connect DB
            conn.close()  # tutup koneksi
            return {"status": "ok", "db_connected": True}, 200
        except Exception:  # gagal konek DB
            return {"status": "error", "db_connected": False}, 500

    return app  # balikin instance Flask
