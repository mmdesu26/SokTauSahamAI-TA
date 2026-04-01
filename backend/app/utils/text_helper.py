import logging

logger = logging.getLogger(__name__)

try:
    from deep_translator import GoogleTranslator
except Exception:  # pragma: no cover
    GoogleTranslator = None


class TextHelper:
    @staticmethod
    def translate_to_indonesian(text: str) -> str:
        if not text:
            return ""

        if GoogleTranslator is None:
            logger.warning("deep_translator not installed, returning original text")
            return text

        try:
            return GoogleTranslator(source="auto", target="id").translate(text)
        except Exception as e:  # pragma: no cover
            logger.warning(f"Translation failed: {e}")
            return text
