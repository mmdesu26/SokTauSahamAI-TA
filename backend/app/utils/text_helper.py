# Import logging untuk mencatat warning/error
import logging

# Membuat logger berdasarkan nama module
logger = logging.getLogger(__name__)

# Coba import GoogleTranslator dari deep_translator
# Jika gagal (misalnya library belum diinstall), set ke None
try:
    from deep_translator import GoogleTranslator
except Exception:  # pragma: no cover
    GoogleTranslator = None


class TextHelper:
    """
    Helper class untuk operasi teks, khususnya translasi.

    Saat ini hanya mendukung:
    - translate ke Bahasa Indonesia
    """

    @staticmethod
    def translate_to_indonesian(text: str) -> str:
        """
        Menerjemahkan teks ke Bahasa Indonesia menggunakan GoogleTranslator.

        Behavior:
        - Jika text kosong → return ""
        - Jika library tidak tersedia → return teks asli
        - Jika terjadi error saat translate → fallback ke teks asli

        Parameter:
        - text: string yang ingin diterjemahkan

        Return:
        - hasil terjemahan (string)
        """

        # Jika input kosong → langsung return string kosong
        if not text:
            return ""

        # Jika library deep_translator tidak tersedia
        if GoogleTranslator is None:
            logger.warning("deep_translator not installed, returning original text")
            return text

        try:
            # Gunakan GoogleTranslator:
            # - source="auto" → deteksi bahasa otomatis
            # - target="id" → translate ke Bahasa Indonesia
            return GoogleTranslator(source="auto", target="id").translate(text)

        except Exception as e:  # pragma: no cover
            # Jika terjadi error saat translate (misalnya API error, koneksi, dll)
            logger.warning(f"Translation failed: {e}")

            # Fallback: return teks asli
            return text