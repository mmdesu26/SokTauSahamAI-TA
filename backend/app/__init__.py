from flask import Flask
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

from app.config import Config

db = SQLAlchemy()
bcrypt = Bcrypt()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    limiter.init_app(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173", "http://localhost:3000"]
            }
        },
        supports_credentials=False,
    )

    from app.routes.auth_routes import auth_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.investor_routes import investor_bp
    from app.routes.glossary import glossary_bp
    from app.routes.stocks import stocks_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(investor_bp, url_prefix="/api/investor")
    app.register_blueprint(glossary_bp, url_prefix="/api")
    app.register_blueprint(stocks_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        try:
            conn = db.engine.connect()
            conn.close()
            return {"status": "ok", "db_connected": True}, 200
        except Exception:
            return {"status": "error", "db_connected": False}, 500

    return app