# ===================================================================
# IMPORT STATEMENT / PERNYATAAN IMPOR
# ===================================================================
# Bagian ini memanggil library/module yang dibutuhkan script ini.

import argparse
# ^ Module BAWAAN Python untuk membuat CLI (Command Line Interface).
#   argparse = "argument parser", digunakan untuk membaca argumen
#   yang diketik user di terminal/command line.
#   Contoh pemakaian: python train.py --ticker BBCA --days 500

import json
# ^ Module bawaan Python untuk bekerja dengan data JSON
#   (JavaScript Object Notation) — format data standar untuk pertukaran data.
#   Digunakan di sini untuk mengonversi dict Python menjadi string JSON.

import sys
# ^ Module bawaan Python untuk berinteraksi dengan SISTEM/INTERPRETER.
#   Di sini digunakan untuk:
#   - sys.stderr : stream output khusus untuk pesan error
#   - sys.exit() : menghentikan program dengan exit code tertentu

from pathlib import Path
# ^ Mengimpor class 'Path' dari module 'pathlib'.
#   Path = representasi path file/folder dalam bentuk OBJEK (OOP).
#   Lebih modern & cross-platform dibanding manipulasi string path biasa.
#   Contoh: Path("app/ml/models") otomatis menyesuaikan separator
#   (/ di Linux/Mac, \ di Windows).

from app.ml.config import PriceModelConfig
# ^ Mengimpor class 'PriceModelConfig' dari module lokal di project.
#   Kelas ini kemungkinan berisi KONFIGURASI (parameter) untuk model,
#   seperti ticker, jumlah hari, lag, dsb.
#   Pola ini disebut CONFIG OBJECT PATTERN.

from app.ml.training import PriceModelTrainer
# ^ Mengimpor class 'PriceModelTrainer' dari module training.
#   Kelas ini bertugas MELATIH (train) model prediksi harga saham.


# ===================================================================
# KONSTANTA / CONSTANT
# ===================================================================
DEFAULT_OUTPUT_DIR = Path("app/ml/models")
# ^ KONSTANTA GLOBAL (variabel di level module).
#   Konvensi: nama HURUF KAPITAL artinya ini konstanta (tidak diubah).
#   Berisi objek Path yang menunjuk folder default untuk menyimpan
#   hasil training model (artifact).
#   Diletakkan di luar fungsi agar mudah diubah di satu tempat.


# ===================================================================
# FUNGSI UTAMA: main
# ===================================================================
# Fungsi 'main' adalah KONVENSI untuk menandai fungsi UTAMA/ENTRY POINT
# program. Di sini semua alur utama script dijalankan.
def main():
    # -------------------------------------------------------------------
    # LANGKAH 1: MEMBUAT ARGUMENT PARSER
    # -------------------------------------------------------------------
    # Membuat objek parser yang akan membaca argumen dari command line.
    parser = argparse.ArgumentParser(description="Train dan simpan model prediksi harga saham")
    # ^ argparse.ArgumentParser(...) = class untuk memproses argumen CLI.
    #   - description : deskripsi yang muncul ketika user ketik --help.
    #     Contoh output: python train.py --help
    #     => akan tampil "Train dan simpan model prediksi harga saham".

    # -------------------------------------------------------------------
    # LANGKAH 2: MENDAFTARKAN ARGUMEN-ARGUMEN CLI
    # -------------------------------------------------------------------
    # Method .add_argument() = mendefinisikan argumen yang diterima.
    # Setiap argumen punya: nama, tipe, default, help text.

    parser.add_argument("--ticker", required=True, help="Ticker saham, contoh: BBCA atau BBCA.JK")
    # ^ ARGUMEN: --ticker
    #   - required=True : WAJIB diisi user (kalau tidak, error).
    #   - help          : keterangan argumen saat --help.
    #   Awalan "--" menandakan ini OPTIONAL FLAG (walau required=True di sini).
    #   Cara pakai: --ticker BBCA

    parser.add_argument("--days", type=int, default=730, help="Jumlah hari historis untuk training")
    # ^ ARGUMEN: --days
    #   - type=int    : nilai dikonversi otomatis ke INTEGER.
    #   - default=730 : nilai default jika user tidak mengisi (± 2 tahun
    #                   trading days, karena 1 tahun ≈ 252 hari trading,
    #                   730 hari kalender memberi buffer cukup).

    parser.add_argument("--lag-days", type=int, default=15, help="Jumlah lag fitur harga")
    # ^ ARGUMEN: --lag-days
    #   LAG dalam konteks time series = nilai masa lalu yang dipakai
    #   sebagai FITUR (feature) untuk memprediksi harga hari ini.
    #   Default 15 = pakai harga 15 hari ke belakang sebagai fitur.
    #   PERHATIKAN: "--lag-days" (pakai dash) di CLI otomatis jadi
    #   args.lag_days (pakai underscore) di Python — konvensi argparse.

    parser.add_argument("--forecast-horizon", type=int, default=1, help="Horizon prediksi trading day")
    # ^ ARGUMEN: --forecast-horizon
    #   HORIZON = berapa hari ke depan yang mau diprediksi.
    #   Default 1 = prediksi harga 1 trading day (hari bursa) ke depan.

    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Folder output artifact model")
    # ^ ARGUMEN: --output-dir
    #   - default=str(DEFAULT_OUTPUT_DIR)
    #     => pakai konstanta yang di-define di atas, dikonversi ke string.
    #     (argparse lebih friendly dengan string daripada Path object).

    # -------------------------------------------------------------------
    # LANGKAH 3: PARSE ARGUMEN
    # -------------------------------------------------------------------
    args = parser.parse_args()
    # ^ parse_args() = MEMBACA argumen dari sys.argv (argumen terminal)
    #   dan mengembalikan objek Namespace.
    #   Hasilnya bisa diakses seperti atribut: args.ticker, args.days, dll.
    #   Jika user salah input (misal tipe tidak cocok), argparse otomatis
    #   menampilkan error + help text dan menghentikan program.

    # -------------------------------------------------------------------
    # LANGKAH 4: MEMBUAT OBJEK KONFIGURASI
    # -------------------------------------------------------------------
    config = PriceModelConfig(
        ticker=args.ticker,
        days=args.days,
        lag_days=args.lag_days,
        forecast_horizon=args.forecast_horizon,
    )
    # ^ Membuat INSTANCE (objek) dari kelas PriceModelConfig.
    #   Parameter dikirim dengan KEYWORD ARGUMENT (nama=nilai), bukan
    #   positional, supaya LEBIH EKSPLISIT dan tidak mudah tertukar urutan.
    #   Objek 'config' ini akan dipakai sebagai "wadah" konfigurasi
    #   yang dioper ke trainer.

    # -------------------------------------------------------------------
    # LANGKAH 5: MEMBUAT OBJEK TRAINER
    # -------------------------------------------------------------------
    trainer = PriceModelTrainer(config)
    # ^ Instansiasi kelas PriceModelTrainer dengan parameter config.
    #   Pola ini disebut DEPENDENCY INJECTION: config di-INJECT ke trainer,
    #   memisahkan concerns antara "konfigurasi" dan "proses training".

    # -------------------------------------------------------------------
    # LANGKAH 6: TRAINING MODEL
    # -------------------------------------------------------------------
    # trainer.fit() = method untuk MELATIH model dengan data historis.
    # Konvensi ".fit()" populer di library ML (seperti scikit-learn).
    # Method ini return True jika sukses, False jika gagal.
    if not trainer.fit():
        # BLOK ERROR HANDLING: jika training gagal.
        print(json.dumps({"success": False, "message": "Model gagal dilatih"}, ensure_ascii=False), file=sys.stderr)
        # ^ json.dumps(dict) = konversi dict Python -> string JSON.
        #   - ensure_ascii=False : JANGAN escape karakter non-ASCII
        #     (penting untuk bahasa Indonesia agar karakter tidak jadi \uXXXX).
        #   - file=sys.stderr    : output ke STREAM ERROR (bukan stdout).
        #     STDERR vs STDOUT: dibedakan agar pesan error bisa dipisah
        #     dari output normal (best practice untuk CLI).

        sys.exit(1)
        # ^ sys.exit(1) = HENTIKAN program dengan EXIT CODE = 1.
        #   EXIT CODE / RETURN CODE:
        #   - 0 = sukses (konvensi Unix)
        #   - != 0 (mis. 1) = ada error
        #   Exit code ini dibaca oleh shell/script lain untuk cek status.

    # -------------------------------------------------------------------
    # LANGKAH 7: MENYIMPAN MODEL (ARTIFACT)
    # -------------------------------------------------------------------
    path = trainer.save_artifact(args.output_dir)
    # ^ save_artifact() = method untuk menyimpan MODEL terlatih ke disk.
    #   ARTIFACT dalam ML = file hasil training (model + metadata + scaler)
    #   yang bisa di-load ulang untuk inference/prediksi nanti.
    #   Biasanya disimpan dalam format .pkl, .joblib, atau .h5.
    #   Return: path lokasi file artifact disimpan.

    # -------------------------------------------------------------------
    # LANGKAH 8: MENYIAPKAN PAYLOAD OUTPUT (HASIL)
    # -------------------------------------------------------------------
    payload = {
        "success": True,
        "ticker": config.ticker,
        "artifact_path": str(path),
        # ^ Konversi Path ke string agar bisa di-JSON-serialize
        #   (objek Path tidak bisa langsung di-dump ke JSON).
        "metrics": trainer.metrics,
        # ^ METRICS = ukuran evaluasi performa model,
        #   contoh: MAE, RMSE, MAPE, R², dsb.
        "ensemble_weights": trainer.ensemble_weights,
        # ^ ENSEMBLE WEIGHTS = bobot masing-masing sub-model dalam ensemble.
        #   ENSEMBLE = teknik menggabungkan beberapa model (misal Linear
        #   Regression + Random Forest + XGBoost) untuk hasil lebih akurat.
        #   Weights menunjukkan seberapa besar kontribusi tiap model.
    }
    # ^ 'payload' = dict Python yang akan dikembalikan sebagai output JSON.
    #   Istilah "payload" sering dipakai di context HTTP/API untuk
    #   menyebut data yang dibawa dalam request/response.

    # -------------------------------------------------------------------
    # LANGKAH 9: CETAK HASIL KE STDOUT
    # -------------------------------------------------------------------
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    # ^ Print payload dalam bentuk JSON yang rapi:
    #   - indent=2           : tambahkan indentasi 2 spasi (pretty print).
    #     Tanpa indent, output 1 baris panjang. Dengan indent, mudah dibaca.
    #   - ensure_ascii=False : sama seperti sebelumnya, untuk support UTF-8.
    #   Output ini bisa di-PIPE atau di-parse oleh script lain.


# ===================================================================
# ENTRY POINT / IDIOM "if __name__ == '__main__'"
# ===================================================================
if __name__ == "__main__":
    main()
# ^ Ini adalah IDIOM STANDAR Python untuk ENTRY POINT script.
#
#   Penjelasan:
#   - __name__ = variabel spesial bawaan Python.
#     - Jika script dijalankan LANGSUNG (python train.py),
#       nilainya = "__main__"
#     - Jika file di-IMPORT oleh file lain,
#       nilainya = nama modulenya (misal "train_price_model")
#
#   Jadi blok ini hanya dijalankan jika script DIPANGGIL LANGSUNG,
#   bukan di-import.
#
#   MANFAAT:
#   - Mencegah main() otomatis berjalan saat file di-import dari file lain.
#   - Memungkinkan file ini dipakai sebagai MODULE (impor fungsi di dalamnya)
#     tanpa mengeksekusi main().