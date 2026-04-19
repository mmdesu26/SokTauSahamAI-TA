from dataclasses import dataclass  # Import decorator dataclass untuk membuat class lebih ringkas

# Mendefinisikan konfigurasi model harga saham
@dataclass(slots=True)  # slots=True untuk optimasi memory dan akses atribut lebih cepat
class PriceModelConfig:
    ticker: str                     # Kode saham (misal: AAPL, BBCA)
    days: int = 730                 # Jumlah hari data historis (default 2 tahun)
    forecast_horizon: int = 1       # Berapa hari ke depan yang ingin diprediksi
    lag_days: int = 15              # Jumlah lag (fitur historis) untuk model
    cutoff_date: str | None = None  # Batas tanggal data (opsional)
    train_ratio: float = 0.8        # Rasio data untuk training (80% train, 20% test)

    @property
    def artifact_name(self) -> str:
        # Membersihkan nama ticker agar aman untuk nama file
        safe_ticker = (self.ticker or '') \
            .upper() \
            .replace('.', '_') \
            .replace('/', '_')

        # Menghasilkan nama file model (artifact)
        return f"{safe_ticker}_price_model.pkl"