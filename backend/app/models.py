from app import db, bcrypt

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"
    

class Glossary(db.Model):
    __tablename__ = "glossaries"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    term = db.Column(db.String(150), unique=True, nullable=False)
    definition = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    def to_dict(self):
        return {
            "id": self.id,
            "term": self.term,
            "definition": self.definition,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Glossary {self.term}>"
    

class Stock(db.Model):
    __tablename__ = "stocks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ticker = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    sector = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Numeric(15, 2), nullable=False, server_default="0")
    change_percent = db.Column(db.String(20), nullable=False, server_default="0.00%")
    volume = db.Column(db.String(50), nullable=False, server_default="0")
    status = db.Column(db.String(20), nullable=False, server_default="Active")
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    def to_dict(self):
        return {
            "id": self.id,
            "ticker": self.ticker,
            "name": self.name,
            "sector": self.sector,
            "price": str(self.price) if self.price is not None else "0",
            "change": self.change_percent,
            "volume": self.volume,
            "status": self.status,
            "lastUpdated": self.updated_at.strftime("%Y-%m-%d %H:%M") if self.updated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Stock {self.ticker}>"
    
class StockProfile(db.Model):
    __tablename__ = "stock_profiles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False, unique=True)

    long_name = db.Column(db.String(200), nullable=False)
    short_name = db.Column(db.String(100), nullable=True)
    sector = db.Column(db.String(100), nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    long_business_summary = db.Column(db.Text, nullable=True)
    website = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    stock = db.relationship("Stock", backref=db.backref("profile", uselist=False))

    def to_dict(self):
        return {
            "id": self.id,
            "stock_id": self.stock_id,
            "longName": self.long_name,
            "shortName": self.short_name,
            "sector": self.sector,
            "industry": self.industry,
            "longBusinessSummary": self.long_business_summary,
            "website": self.website,
            "city": self.city,
            "country": self.country,
        }


class StockFundamental(db.Model):
    __tablename__ = "stock_fundamentals"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False, unique=True)

    eps_ttm = db.Column(db.Float, nullable=True)
    per_ttm = db.Column(db.Float, nullable=True)
    pbv = db.Column(db.Float, nullable=True)
    roe = db.Column(db.Float, nullable=True)
    revenue = db.Column(db.BigInteger, nullable=True)
    net_income = db.Column(db.BigInteger, nullable=True)
    total_assets = db.Column(db.BigInteger, nullable=True)
    total_equity = db.Column(db.BigInteger, nullable=True)

    benchmark_per = db.Column(db.Float, nullable=True)
    benchmark_pbv = db.Column(db.Float, nullable=True)
    benchmark_roe = db.Column(db.Float, nullable=True)
    benchmark_eps = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    stock = db.relationship("Stock", backref=db.backref("fundamental", uselist=False))

    def to_dict(self):
        return {
            "id": self.id,
            "stock_id": self.stock_id,
            "epsTTM": self.eps_ttm,
            "perTTM": self.per_ttm,
            "pbv": self.pbv,
            "roe": self.roe,
            "revenue": self.revenue,
            "netIncome": self.net_income,
            "totalAssets": self.total_assets,
            "totalEquity": self.total_equity,
            "benchmarks": {
                "per": self.benchmark_per,
                "pbv": self.benchmark_pbv,
                "roe": self.benchmark_roe,
                "eps": self.benchmark_eps,
            },
        }


class StockPriceHistory(db.Model):
    __tablename__ = "stock_price_histories"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stock_id = db.Column(db.Integer, db.ForeignKey("stocks.id"), nullable=False)

    timeframe = db.Column(db.String(10), nullable=False)  # 1D, 1W, 1M, 3M, 1Y, 1h
    label = db.Column(db.String(50), nullable=False)      # 09:00, H1, 2026-03-01, dll
    open_price = db.Column(db.Float, nullable=False)
    high_price = db.Column(db.Float, nullable=False)
    low_price = db.Column(db.Float, nullable=False)
    close_price = db.Column(db.Float, nullable=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    stock = db.relationship("Stock", backref=db.backref("price_histories", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "stock_id": self.stock_id,
            "timeframe": self.timeframe,
            "t": self.label,
            "open": self.open_price,
            "high": self.high_price,
            "low": self.low_price,
            "close": self.close_price,
            "sortOrder": self.sort_order,
        }


class SystemLog(db.Model):
    __tablename__ = "system_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, nullable=False, server_default=db.func.current_timestamp())
    level = db.Column(db.String(20), nullable=False)  # 'success', 'warning', 'error', 'info'
    source = db.Column(db.String(100), nullable=False)  # 'Stock Management', 'ML Prediction', 'Authentication', etc
    message = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text, nullable=True)  # Error details, stack trace, JSON data, etc
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    action_type = db.Column(db.String(50), nullable=True)  # 'CREATE', 'UPDATE', 'DELETE', 'PREDICT', 'LOGIN', 'PASSWORD_CHANGE'
    entity_type = db.Column(db.String(50), nullable=True)  # 'Stock', 'Glossary', 'User', 'Prediction'
    entity_id = db.Column(db.Integer, nullable=True)  # ID of the entity affected
    ip_address = db.Column(db.String(50), nullable=True)

    user = db.relationship("User", backref=db.backref("logs", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None,
            "level": self.level,
            "source": self.source,
            "message": self.message,
            "details": self.details,
            "user_id": self.user_id,
            "action_type": self.action_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "username": self.user.username if self.user else "system",
        }

    def __repr__(self):
        return f"<SystemLog {self.level} - {self.source}>"