import logging  # buat logging (debug/error)
import numpy as np  # buat hitung numerik
import pandas as pd  # buat olah data tabel
from sklearn.ensemble import RandomForestRegressor  # model random forest
from sklearn.linear_model import LinearRegression  # model linear regression
from sklearn.metrics import mean_squared_error  # buat hitung error
from sklearn.preprocessing import StandardScaler  # buat normalisasi data
from app.utils.yfinance_helper import YFinanceHelper  # ambil data saham dari yfinance

logger = logging.getLogger(__name__)  # logger buat nampilin error


class StockPricePredictor:
    """predict harga saham pake RF + LR + fundamental"""

    def __init__(self, ticker, days=252):
        self.ticker = ticker  # kode saham
        self.days = days  # jumlah hari data
        self.rf_model = RandomForestRegressor(n_estimators=200, random_state=42, min_samples_leaf=2)  # model RF
        self.lr_model = LinearRegression()  # model LR
        self.scaler = StandardScaler()  # buat scaling data

        # fitur yg dipakai buat training
        self.feature_columns = [
            "open",
            "high",
            "low",
            "close",
            "volume",
            "lag_close_1",
            "lag_close_3",
            "return_1d",
            "eps",
            "per",
            "pbv",
            "roe",
        ]
        self.dataset = None  # tempat nyimpen dataset

    def prepare_dataset(self):
        # ambil data harga saham
        hist_df = YFinanceHelper.get_historical_prices(self.ticker, days=self.days, exclude_today=True)
        if hist_df is None or hist_df.empty:
            return None  # kalau kosong

        # ambil data fundamental
        fundamentals = YFinanceHelper.get_fundamentals(self.ticker)
        if not fundamentals:
            return None

        # ambil kolom penting
        df = hist_df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.columns = ["open", "high", "low", "close", "volume"]  # rename biar simpel

        # bikin fitur tambahan
        df["lag_close_1"] = df["close"].shift(1)  # harga kemarin
        df["lag_close_3"] = df["close"].shift(3)  # harga 3 hari lalu
        df["return_1d"] = df["close"].pct_change()  # perubahan harian

        # masukin data fundamental (fix per row)
        df["eps"] = float(fundamentals.get("eps") or 0)
        df["per"] = float(fundamentals.get("pe") or 0)
        df["pbv"] = float(fundamentals.get("pbv") or 0)
        df["roe"] = float(fundamentals.get("roe") or 0)

        # target yg mau diprediksi (harga besok)
        df["target_close_next"] = df["close"].shift(-1)

        # bersihin data (hapus nan & inf)
        df = df.replace([np.inf, -np.inf], np.nan).dropna().copy()
        return df

    def train(self):
        df = self.prepare_dataset()  # siapin data

        # cek data cukup atau gak
        if df is None or df.empty or len(df) < 30:
            logger.error(f"Dataset tidak cukup untuk melatih model {self.ticker}")
            return False

        X = df[self.feature_columns].values  # fitur
        y = df["target_close_next"].values  # target

        # scaling data
        X_scaled = self.scaler.fit_transform(X)

        # training model
        self.rf_model.fit(X_scaled, y)
        self.lr_model.fit(X_scaled, y)

        self.dataset = df  # simpen dataset
        return True

    def predict_next_month(self):
        # kalau belum training
        if self.dataset is None and not self.train():
            return None

        df = self.dataset.copy()
        latest = df.iloc[-1]  # ambil data terakhir

        # ambil fitur terbaru
        X_latest = latest[self.feature_columns].to_frame().T.values
        X_latest_scaled = self.scaler.transform(X_latest)

        # prediksi masing2 model
        rf_pred = float(self.rf_model.predict(X_latest_scaled)[0])
        lr_pred = float(self.lr_model.predict(X_latest_scaled)[0])

        # gabung hasil (ensemble)
        predicted_close = (rf_pred * 0.6) + (lr_pred * 0.4)

        # evaluasi model
        X_train_scaled = self.scaler.transform(df[self.feature_columns].values)
        y_true = df["target_close_next"].values

        y_rf = self.rf_model.predict(X_train_scaled)
        y_lr = self.lr_model.predict(X_train_scaled)
        y_ensemble = (y_rf * 0.6) + (y_lr * 0.4)

        mse = mean_squared_error(y_true, y_ensemble)  # error rata2
        rmse = float(np.sqrt(mse))  # akar error

        current_price = float(latest["close"])  # harga sekarang

        # persen perubahan
        expected_change_pct = ((predicted_close - current_price) / current_price) * 100 if current_price else 0

        return {
            "ticker": self.ticker,
            "predicted_close_1m": float(round(predicted_close, 2)),  # hasil prediksi
            "rf_prediction": float(round(rf_pred, 2)),  # hasil RF
            "lr_prediction": float(round(lr_pred, 2)),  # hasil LR
            "rmse": float(round(rmse, 2)),  # error
            "mse": float(round(mse, 2)),
            "prediction_date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),  # waktu prediksi
            "current_price": float(round(current_price, 2)),
            "expected_change_pct": float(round(expected_change_pct, 2)),  # naik/turun %

            # info tambahan
            "features_used": {
                "model": ["Random Forest", "Linear Regression"],
                "fundamentals": ["PER", "EPS", "PBV", "ROE"],
                "price_inputs": ["Open", "High", "Low", "Close", "Volume", "Lag Close"],
            },
        }


# fungsi simple buat langsung prediksi
def predict_stock_price(ticker):
    try:
        predictor = StockPricePredictor(ticker)  # bikin object

        if not predictor.train():  # kalau gagal training
            return None

        return predictor.predict_next_month()  # hasil prediksi

    except Exception as e:
        logger.error(f"Error in predict_stock_price for {ticker}: {str(e)}")  # log error
        return None  # kalau ada error, balikin None