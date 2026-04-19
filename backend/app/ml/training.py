import logging  # dipakai untuk menampilkan log, misalnya error atau info proses
import pickle  # dipakai untuk menyimpan model ke file .pkl
from pathlib import Path  # dipakai untuk mengelola path/folder file

import numpy as np  # library numerik untuk operasi array dan perhitungan matematika
from sklearn.ensemble import RandomForestRegressor  # model Random Forest untuk regresi
from sklearn.linear_model import LinearRegression  # model Linear Regression
from sklearn.metrics import mean_squared_error  # fungsi untuk menghitung MSE
from sklearn.preprocessing import StandardScaler  # untuk normalisasi / standarisasi fitur

from .config import PriceModelConfig  # class konfigurasi model
from .features import PriceFeatureBuilder  # class untuk membangun fitur dari data historis

logger = logging.getLogger(__name__)  # membuat logger sesuai nama file/module ini


class PriceModelTrainer:
    # class ini bertugas untuk:
    # 1. menyiapkan dataset
    # 2. membagi data train-test
    # 3. melatih model Random Forest dan Linear Regression
    # 4. menghitung evaluasi model
    # 5. menyimpan model yang sudah jadi

    def __init__(self, config: PriceModelConfig, historical_df=None):
        # constructor
        # dipanggil saat object PriceModelTrainer dibuat

        self.config = config
        # menyimpan object konfigurasi model
        # misalnya ticker, jumlah hari data, rasio train-test, dll

        self.feature_builder = PriceFeatureBuilder(config, historical_df=historical_df)
        # membuat object pembangun fitur
        # tugasnya menyiapkan fitur-fitur dari data historis harga saham

        self.feature_columns = self.feature_builder.build_feature_columns()
        # mengambil daftar nama kolom fitur
        # misalnya lag close, lag return, lag volume, dll

        self.scaler = StandardScaler()
        # membuat scaler untuk standarisasi fitur
        # supaya nilai fitur lebih seimbang saat masuk ke model

        self.rf_model = RandomForestRegressor(
            n_estimators=400,       # jumlah pohon dalam random forest
            max_depth=10,           # kedalaman maksimal tiap pohon
            min_samples_split=5,    # minimal jumlah sampel untuk split node
            min_samples_leaf=2,     # minimal jumlah sampel di leaf
            random_state=42,        # seed agar hasil konsisten
            n_jobs=-1,              # memakai semua core CPU
        )
        # model Random Forest utama

        self.lr_model = LinearRegression()
        # model Linear Regression sebagai model pembanding / ensemble

        self.dataset = None
        # tempat menyimpan dataset yang sudah dibangun

        self.latest_completed_close = None
        # menyimpan harga close terakhir yang sudah lengkap

        self.metrics = None
        # menyimpan hasil evaluasi model

        self.ensemble_weights = {"rf": 0.5, "lr": 0.5}
        # bobot awal ensemble
        # nanti akan diupdate berdasarkan performa model

    def prepare_dataset(self):
        # fungsi untuk menyiapkan dataset dari feature builder

        dataset, latest_completed_close = self.feature_builder.prepare_price_dataset()
        # memanggil feature builder untuk membuat dataset
        # hasilnya:
        # - dataset: tabel fitur + target
        # - latest_completed_close: harga close terakhir yang valid

        self.dataset = dataset
        # simpan dataset ke variabel object

        self.latest_completed_close = latest_completed_close
        # simpan harga close terakhir ke variabel object

        return dataset
        # kembalikan dataset

    def time_series_split(self, df):
        # fungsi untuk membagi data train dan test berdasarkan urutan waktu
        # penting: tidak diacak, karena ini data time series

        split_idx = int(len(df) * self.config.train_ratio)
        # menentukan titik pembagian berdasarkan train_ratio
        # misalnya 80% train, 20% test

        train_df = df.iloc[:split_idx].copy()
        # data sebelum split_idx dijadikan data training

        test_df = df.iloc[split_idx:].copy()
        # data setelah split_idx dijadikan data testing

        if len(train_df) < 60 or len(test_df) < 20:
            # validasi minimal jumlah data train dan test
            # kalau terlalu sedikit, model tidak layak dilatih

            logger.error("Ukuran train/test tidak memadai untuk %s", self.config.ticker)
            # tulis log error jika data terlalu sedikit

            return None, None
            # kembalikan None kalau gagal

        return train_df, test_df
        # kembalikan data train dan test

    @staticmethod
    def calculate_mape(actual_prices, predicted_prices):
        # fungsi statis untuk menghitung MAPE
        # MAPE = Mean Absolute Percentage Error
        # semakin kecil nilainya, semakin baik

        actual_arr = np.asarray(actual_prices, dtype=float)
        # ubah actual prices menjadi array float

        pred_arr = np.asarray(predicted_prices, dtype=float)
        # ubah predicted prices menjadi array float

        actual_safe = np.where(np.abs(actual_arr) < 1e-8, 1e-8, actual_arr)
        # menghindari pembagian dengan nol
        # kalau actual terlalu kecil, diganti 1e-8

        return float(np.mean(np.abs((actual_arr - pred_arr) / actual_safe)) * 100)
        # rumus MAPE:
        # rata-rata error persentase absolut × 100

    @staticmethod
    def calculate_directional_accuracy(actual_returns, predicted_returns):
        # fungsi statis untuk menghitung akurasi arah
        # maksudnya: apakah arah prediksi benar? naik/turun

        actual_arr = np.asarray(actual_returns, dtype=float)
        # ubah actual return jadi array float

        pred_arr = np.asarray(predicted_returns, dtype=float)
        # ubah predicted return jadi array float

        if actual_arr.size == 0:
            # kalau data kosong, akurasi dianggap 0
            return 0.0

        actual_sign = np.sign(actual_arr)
        # ambil tanda actual return:
        # negatif = turun, positif = naik, nol = tetap

        pred_sign = np.sign(pred_arr)
        # ambil tanda predicted return

        correct = actual_sign == pred_sign
        # cek apakah arah actual dan prediksi sama

        return float(np.mean(correct) * 100)
        # hitung persentase arah yang benar

    @staticmethod
    def baseline_price_from_current_close(current_close):
        # fungsi baseline
        # asumsi prediksi paling sederhana:
        # harga besok = harga hari ini

        return np.asarray(current_close, dtype=float)
        # kembalikan current close sebagai baseline prediksi

    def _fit_models_for_split(self, train_df, test_df):
        # fungsi internal untuk:
        # 1. ambil fitur dan target
        # 2. scaling data
        # 3. training RF dan LR
        # 4. prediksi
        # 5. hitung bobot ensemble
        # 6. kembalikan semua hasil penting

        X_train = train_df[self.feature_columns].values
        # fitur training

        y_train = train_df["target_return_future"].values
        # target training = return masa depan

        X_test = test_df[self.feature_columns].values
        # fitur testing

        y_test_return = test_df["target_return_future"].values
        # target testing = return masa depan

        scaler = StandardScaler()
        # scaler lokal untuk split ini

        X_train_scaled = scaler.fit_transform(X_train)
        # fit scaler di data train, lalu transform

        X_test_scaled = scaler.transform(X_test)
        # transform data test pakai scaler yang sama

        rf_model = RandomForestRegressor(
            n_estimators=400,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        # buat model RF baru untuk split ini

        lr_model = LinearRegression()
        # buat model LR baru untuk split ini

        rf_model.fit(X_train_scaled, y_train)
        # latih Random Forest dengan data train

        lr_model.fit(X_train_scaled, y_train)
        # latih Linear Regression dengan data train

        rf_pred_return = rf_model.predict(X_test_scaled)
        # prediksi return dengan RF

        lr_pred_return = lr_model.predict(X_test_scaled)
        # prediksi return dengan LR

        current_close_test = test_df["close"].values
        # ambil harga close saat ini dari data test

        actual_price = current_close_test * (1 + y_test_return)
        # konversi actual return menjadi actual harga masa depan

        rf_pred_price = current_close_test * (1 + rf_pred_return)
        # konversi prediksi RF dari return ke harga

        lr_pred_price = current_close_test * (1 + lr_pred_return)
        # konversi prediksi LR dari return ke harga

        rf_rmse_internal = float(np.sqrt(mean_squared_error(actual_price, rf_pred_price)))
        # hitung RMSE internal untuk RF

        lr_rmse_internal = float(np.sqrt(mean_squared_error(actual_price, lr_pred_price)))
        # hitung RMSE internal untuk LR

        eps = 1e-8
        # angka kecil untuk mencegah pembagian nol

        inv_rf = 1.0 / max(rf_rmse_internal, eps)
        # inverse error RF
        # makin kecil error → makin besar inverse → makin besar bobot

        inv_lr = 1.0 / max(lr_rmse_internal, eps)
        # inverse error LR

        weight_sum = inv_rf + inv_lr
        # jumlah total inverse error

        rf_weight = inv_rf / weight_sum
        # bobot RF dalam ensemble

        lr_weight = inv_lr / weight_sum
        # bobot LR dalam ensemble

        ensemble_pred_return = (rf_pred_return * rf_weight) + (lr_pred_return * lr_weight)
        # gabungkan prediksi return RF dan LR berdasarkan bobot

        ensemble_pred_price = (rf_pred_price * rf_weight) + (lr_pred_price * lr_weight)
        # gabungkan prediksi harga RF dan LR berdasarkan bobot

        baseline_pred_price = self.baseline_price_from_current_close(current_close_test)
        # baseline harga = harga hari ini

        baseline_pred_return = np.zeros_like(y_test_return)
        # baseline return = 0
        # artinya diasumsikan harga tidak berubah

        return {
            "scaler": scaler,                          # scaler untuk split ini
            "rf_model": rf_model,                     # model RF yang sudah dilatih
            "lr_model": lr_model,                     # model LR yang sudah dilatih
            "rf_weight": float(rf_weight),            # bobot RF
            "lr_weight": float(lr_weight),            # bobot LR
            "actual_price": actual_price,             # harga aktual masa depan
            "actual_return": y_test_return,           # return aktual masa depan
            "current_close": current_close_test,      # harga close saat ini
            "rf_pred_price": rf_pred_price,           # prediksi harga RF
            "lr_pred_price": lr_pred_price,           # prediksi harga LR
            "ensemble_pred_price": ensemble_pred_price,   # prediksi harga ensemble
            "ensemble_pred_return": ensemble_pred_return, # prediksi return ensemble
            "baseline_pred_price": baseline_pred_price,   # baseline harga
            "baseline_pred_return": baseline_pred_return, # baseline return
            "rf_rmse_internal": rf_rmse_internal,     # RMSE RF
            "lr_rmse_internal": lr_rmse_internal,     # RMSE LR
        }

    def evaluate_walk_forward(self, df, max_windows=6):
        # fungsi untuk evaluasi walk-forward
        # konsepnya: training bertahap dengan expanding window
        # lalu test 1 langkah ke depan setiap fold

        train_df, test_df = self.time_series_split(df)
        # lakukan split awal train-test

        if train_df is None or test_df is None:
            # kalau split gagal, langsung return None
            return None

        split_idx = len(train_df)
        # indeks batas train awal

        remaining = len(df) - split_idx
        # jumlah data sisa untuk evaluasi walk-forward

        if remaining < 5:
            # kalau sisa data terlalu sedikit, evaluasi tidak dilakukan
            return None

        candidate_offsets = np.linspace(0, remaining - 1, num=min(max_windows, remaining), dtype=int)
        # membuat titik-titik offset secara merata
        # misalnya 6 window evaluasi

        candidate_offsets = sorted(set(int(x) for x in candidate_offsets))
        # hilangkan duplikat dan urutkan

        results = []
        # list untuk menyimpan hasil tiap fold

        min_train_size = max(60, len(self.feature_columns) + 5)
        # ukuran minimal data train
        # harus cukup untuk jumlah fitur + buffer

        for offset in candidate_offsets:
            # loop tiap titik evaluasi

            pivot = split_idx + offset
            # titik batas train untuk fold saat ini

            if pivot >= len(df):
                # kalau pivot melewati panjang data, skip
                continue

            expanding_train = df.iloc[:pivot].copy()
            # training set bertambah terus dari awal sampai pivot

            one_step_test = df.iloc[pivot:pivot + 1].copy()
            # test set cuma 1 langkah ke depan

            if len(expanding_train) < min_train_size or one_step_test.empty:
                # validasi ukuran train dan test
                continue

            fold = self._fit_models_for_split(expanding_train, one_step_test)
            # latih model dan evaluasi untuk fold ini

            actual_price = float(fold["actual_price"][0])
            # ambil harga aktual pada fold ini

            predicted_price = float(fold["ensemble_pred_price"][0])
            # ambil harga prediksi ensemble

            actual_return = float(fold["actual_return"][0])
            # return aktual

            predicted_return = float(fold["ensemble_pred_return"][0])
            # return prediksi ensemble

            baseline_price = float(fold["baseline_pred_price"][0])
            # harga baseline

            baseline_return = float(fold["baseline_pred_return"][0])
            # return baseline

            results.append({
                "date": str(one_step_test.index[0].date()),  # tanggal fold
                "train_size": int(len(expanding_train)),     # ukuran train
                "actual_price": actual_price,                # harga aktual
                "predicted_price": predicted_price,          # harga prediksi
                "baseline_price": baseline_price,            # harga baseline
                "mape": self.calculate_mape([actual_price], [predicted_price]),  # MAPE fold
                "baseline_mape": self.calculate_mape([actual_price], [baseline_price]),  # MAPE baseline
                "direction_correct": int(np.sign(actual_return) == np.sign(predicted_return)),  # arah benar?
                "baseline_direction_correct": int(np.sign(actual_return) == np.sign(baseline_return)),  # arah baseline benar?
            })

        if not results:
            # kalau tidak ada hasil fold, return None
            return None

        return {
            "method": "walk-forward expanding window",
            # nama metode evaluasi

            "windows_evaluated": len(results),
            # jumlah fold yang dievaluasi

            "window_results": results,
            # detail hasil tiap fold

            "avg_mape": float(round(np.mean([r["mape"] for r in results]), 4)),
            # rata-rata MAPE semua fold

            "avg_baseline_mape": float(round(np.mean([r["baseline_mape"] for r in results]), 4)),
            # rata-rata MAPE baseline

            "directional_accuracy": float(round(np.mean([r["direction_correct"] for r in results]) * 100, 2)),
            # rata-rata akurasi arah model

            "baseline_directional_accuracy": float(round(np.mean([r["baseline_direction_correct"] for r in results]) * 100, 2)),
            # rata-rata akurasi arah baseline
        }

    def fit(self):
        # fungsi utama untuk melatih model

        df = self.prepare_dataset()
        # siapkan dataset

        if df is None or df.empty:
            # kalau dataset kosong / gagal
            return False

        train_df, test_df = self.time_series_split(df)
        # split train-test

        if train_df is None or test_df is None:
            # kalau split gagal
            return False

        split_eval = self._fit_models_for_split(train_df, test_df)
        # latih model dan evaluasi pada holdout split

        self.scaler = split_eval["scaler"]
        # simpan scaler hasil training

        self.rf_model = split_eval["rf_model"]
        # simpan model RF hasil training

        self.lr_model = split_eval["lr_model"]
        # simpan model LR hasil training

        actual_price = split_eval["actual_price"]
        # harga aktual test

        actual_return = split_eval["actual_return"]
        # return aktual test

        ensemble_pred_price = split_eval["ensemble_pred_price"]
        # harga prediksi ensemble

        ensemble_pred_return = split_eval["ensemble_pred_return"]
        # return prediksi ensemble

        baseline_pred_price = split_eval["baseline_pred_price"]
        # harga baseline

        baseline_pred_return = split_eval["baseline_pred_return"]
        # return baseline

        mape = self.calculate_mape(actual_price, ensemble_pred_price)
        # hitung MAPE model

        baseline_mape = self.calculate_mape(actual_price, baseline_pred_price)
        # hitung MAPE baseline

        directional_accuracy = self.calculate_directional_accuracy(actual_return, ensemble_pred_return)
        # hitung akurasi arah model

        baseline_directional_accuracy = self.calculate_directional_accuracy(actual_return, baseline_pred_return)
        # hitung akurasi arah baseline

        model_beats_baseline = bool(mape < baseline_mape)
        # cek apakah model lebih bagus dari baseline

        self.ensemble_weights = {
            "rf": float(round(split_eval["rf_weight"], 4)),
            "lr": float(round(split_eval["lr_weight"], 4)),
        }
        # simpan bobot ensemble akhir

        walk_forward = self.evaluate_walk_forward(df)
        # lakukan evaluasi walk-forward tambahan

        self.metrics = {
            "mape": float(round(mape, 4)),                            # MAPE model
            "baseline_mape": float(round(baseline_mape, 4)),         # MAPE baseline
            "directional_accuracy": float(round(directional_accuracy, 2)),  # akurasi arah model
            "baseline_directional_accuracy": float(round(baseline_directional_accuracy, 2)),  # akurasi arah baseline
            "model_beats_baseline": model_beats_baseline,            # model menang baseline atau tidak
            "train_size": int(len(train_df)),                        # jumlah data train
            "test_size": int(len(test_df)),                          # jumlah data test
            "rf_rmse_internal": float(round(split_eval["rf_rmse_internal"], 6)),  # RMSE RF
            "lr_rmse_internal": float(round(split_eval["lr_rmse_internal"], 6)),  # RMSE LR
            "evaluation_method": "time-series holdout split + walk-forward backtesting",
            # metode evaluasi yang dipakai

            "price_metric_basis": "predicted return converted back to price",
            # dasar evaluasi harga: return diprediksi lalu dikonversi ke harga

            "accuracy_metric": "MAPE",
            # metrik utama yang dipakai

            "baseline_method": "next close equals current close",
            # baseline sederhana: close besok = close hari ini

            "walk_forward": walk_forward,
            # detail hasil evaluasi walk-forward
        }

        return True
        # training sukses

    def build_artifact(self):
        # fungsi untuk membangun artifact model
        # artifact = paket lengkap model + scaler + metrics + config
        # nanti disimpan ke file .pkl

        if self.dataset is None or self.metrics is None:
            # kalau model belum dilatih, artifact tidak bisa dibuat
            raise ValueError("Model belum dilatih. Jalankan fit() terlebih dahulu.")

        return {
            "config": {
                "ticker": self.config.ticker,                   # kode saham
                "days": self.config.days,                       # jumlah hari data
                "forecast_horizon": self.config.forecast_horizon,  # horizon prediksi
                "lag_days": self.config.lag_days,               # jumlah lag
                "train_ratio": self.config.train_ratio,         # rasio train-test
            },
            "feature_columns": self.feature_columns,            # daftar fitur
            "rf_model": self.rf_model,                          # model RF
            "lr_model": self.lr_model,                          # model LR
            "scaler": self.scaler,                              # scaler
            "ensemble_weights": self.ensemble_weights,          # bobot ensemble
            "metrics": self.metrics,                            # hasil evaluasi
            "latest_completed_close": self.latest_completed_close,  # harga close terakhir
        }

    def save_artifact(self, directory: str | Path):
        # fungsi untuk menyimpan artifact ke file .pkl

        directory = Path(directory)
        # ubah directory menjadi object Path

        directory.mkdir(parents=True, exist_ok=True)
        # buat folder jika belum ada

        path = directory / self.config.artifact_name
        # gabungkan path folder dengan nama file artifact

        artifact = self.build_artifact()
        # buat artifact yang akan disimpan

        with path.open("wb") as fh:
            # buka file dalam mode write-binary
            pickle.dump(artifact, fh)
            # simpan artifact ke file .pkl

        return path
        # kembalikan path file hasil simpan