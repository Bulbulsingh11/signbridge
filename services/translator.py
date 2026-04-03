"""
SignBridge - Multilingual Translation Service

Uses LangChain + Anthropic Claude for context-aware translation
with ISL (Indian Sign Language) gloss generation.
"""

import logging
import os

logger = logging.getLogger(__name__)

# Quick translation lookup for common signs (no API call needed)
QUICK_TRANSLATIONS = {
    'hello': {'hi': 'नमस्ते', 'es': 'Hola', 'en': 'Hello', 'ta': 'வணக்கம்', 'te': 'నమస్కారం', 'bn': 'নমস্কার', 'mr': 'नमस्कार', 'gu': 'નમસ્તે'},
    'thank_you': {'hi': 'धन्यवाद', 'es': 'Gracias', 'en': 'Thank you', 'ta': 'நன்றி', 'te': 'ధన్యవాదాలు', 'bn': 'ধন্যবাদ', 'mr': 'धन्यवाद', 'gu': 'આભાર'},
    'yes': {'hi': 'हाँ', 'es': 'Sí', 'en': 'Yes', 'ta': 'ஆம்', 'te': 'అవును', 'bn': 'হ্যাঁ', 'mr': 'हो', 'gu': 'હા'},
    'no': {'hi': 'नहीं', 'es': 'No', 'en': 'No', 'ta': 'இல்லை', 'te': 'కాదు', 'bn': 'না', 'mr': 'नाही', 'gu': 'ના'},
    'please': {'hi': 'कृपया', 'es': 'Por favor', 'en': 'Please', 'ta': 'தயவுசெய்து', 'te': 'దయచేసి', 'bn': 'অনুগ্রহ করে', 'mr': 'कृपया', 'gu': 'કૃપા કરીને'},
    'sorry': {'hi': 'माफ़ी', 'es': 'Lo siento', 'en': 'Sorry', 'ta': 'மன்னிக்கவும்', 'te': 'క్షమించండి', 'bn': 'দুঃখিত', 'mr': 'माफ करा', 'gu': 'માફ કરશો'},
    'help': {'hi': 'मदद', 'es': 'Ayuda', 'en': 'Help', 'ta': 'உதவி', 'te': 'సహాయం', 'bn': 'সাহায্য', 'mr': 'मदत', 'gu': 'મદદ'},
    'good': {'hi': 'अच्छा', 'es': 'Bueno', 'en': 'Good', 'ta': 'நல்லது', 'te': 'మంచిది', 'bn': 'ভালো', 'mr': 'चांगले', 'gu': 'સારું'},
    'bad': {'hi': 'बुरा', 'es': 'Malo', 'en': 'Bad', 'ta': 'கெட்டது', 'te': 'చెడు', 'bn': 'খারাপ', 'mr': 'वाईट', 'gu': 'ખરાબ'},
    'love': {'hi': 'प्यार', 'es': 'Amor', 'en': 'Love', 'ta': 'காதல்', 'te': 'ప్రేమ', 'bn': 'ভালোবাসা', 'mr': 'प्रेम', 'gu': 'પ્રેમ'},
    'stop': {'hi': 'रुको', 'es': 'Para', 'en': 'Stop', 'ta': 'நிறுத்து', 'te': 'ఆపు', 'bn': 'থামো', 'mr': 'थांबा', 'gu': 'રોકો'},
    'water': {'hi': 'पानी', 'es': 'Agua', 'en': 'Water', 'ta': 'தண்ணீர்', 'te': 'నీళ్ళు', 'bn': 'জল', 'mr': 'पाणी', 'gu': 'પાણી'},
    'one': {'hi': 'एक', 'es': 'Uno', 'en': 'One'},
    'two': {'hi': 'दो', 'es': 'Dos', 'en': 'Two'},
    'three': {'hi': 'तीन', 'es': 'Tres', 'en': 'Three'},
    'four': {'hi': 'चार', 'es': 'Cuatro', 'en': 'Four'},
    'five': {'hi': 'पाँच', 'es': 'Cinco', 'en': 'Five'},
    'ok': {'hi': 'ठीक है', 'es': 'De acuerdo', 'en': 'OK'},
    'peace': {'hi': 'शांति', 'es': 'Paz', 'en': 'Peace'},
    'call_me': {'hi': 'मुझे फ़ोन करो', 'es': 'Llámame', 'en': 'Call me'},
}


class SignTranslator:
    """
    Multilingual translation service for SignBridge.
    
    Uses quick lookup for known signs, and LangChain + Claude
    for complex text translation with ISL context awareness.
    """

    def __init__(self):
        self._ready = True
        self._llm = None
        self._chain = None
        self._init_langchain()

    def _init_langchain(self):
        """Initialize LangChain with Anthropic Claude"""
        api_key = os.getenv('ANTHROPIC_API_KEY', '')

        if not api_key:
            logger.warning(
                "⚠️  ANTHROPIC_API_KEY not set. "
                "Translation will use local lookup only."
            )
            return

        try:
            from langchain_anthropic import ChatAnthropic
            from langchain_core.prompts import ChatPromptTemplate

            self._llm = ChatAnthropic(
                model=os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-20250514'),
                anthropic_api_key=api_key,
                temperature=0.3,
                max_tokens=512,
            )

            self._translation_prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "You are a professional translator specializing in Indian Sign Language (ISL) "
                    "and Indian languages. Translate accurately while preserving the meaning and "
                    "cultural context. When translating sign language concepts, consider the visual "
                    "and gestural nature of the communication.\n\n"
                    "For ISL gloss, provide a simplified word-order representation of the sign "
                    "language structure (subject-object-verb order commonly used in ISL)."
                )),
                ("human", (
                    "Translate the following text from {source_lang} to {target_lang}.\n"
                    "Context: {context}\n\n"
                    "Text: {text}\n\n"
                    "Respond in JSON format:\n"
                    '{{"translated_text": "...", "isl_gloss": "..."}}'
                ))
            ])

            self._chain = self._translation_prompt | self._llm
            logger.info("🌐 LangChain translator initialized with Claude")

        except ImportError as e:
            logger.warning(f"LangChain not fully installed: {e}")
        except Exception as e:
            logger.error(f"Failed to init LangChain: {e}")

    def is_ready(self) -> bool:
        return self._ready

    def translate(self, sign_name, target_lang='hi'):
        """
        Quick translate a recognized sign to target language.
        Uses local lookup first, falls back to LLM if needed.

        Args:
            sign_name: The English name of the recognized sign
            target_lang: Target language code (hi, es, en, ta, te, bn, mr, gu)

        Returns:
            Translated string
        """
        if not sign_name or sign_name == 'unknown':
            return ''

        # Quick lookup
        sign_translations = QUICK_TRANSLATIONS.get(sign_name.lower(), {})
        if target_lang in sign_translations:
            return sign_translations[target_lang]

        # Fallback to English name
        if target_lang == 'en':
            return sign_name.replace('_', ' ').title()

        # Try LLM translation
        if self._chain:
            try:
                result = self._chain.invoke({
                    'text': sign_name.replace('_', ' '),
                    'source_lang': 'English',
                    'target_lang': self._get_lang_name(target_lang),
                    'context': 'sign language vocabulary'
                })
                import json
                parsed = json.loads(result.content)
                return parsed.get('translated_text', sign_name)
            except Exception as e:
                logger.warning(f"LLM translation failed: {e}")

        return sign_name.replace('_', ' ').title()

    def translate_text(self, text, source_lang='en', target_lang='hi', context='general'):
        """
        Translate arbitrary text with ISL context awareness.

        Args:
            text: Text to translate
            source_lang: Source language code
            target_lang: Target language code
            context: Context hint (general, sign_language, medical, education)

        Returns:
            dict with 'translated_text' and 'isl_gloss'
        """
        if not text:
            return {'translated_text': '', 'isl_gloss': ''}

        # Same language — no translation needed
        if source_lang == target_lang:
            return {
                'translated_text': text,
                'isl_gloss': self._generate_simple_gloss(text)
            }

        # Try LLM
        if self._chain:
            try:
                result = self._chain.invoke({
                    'text': text,
                    'source_lang': self._get_lang_name(source_lang),
                    'target_lang': self._get_lang_name(target_lang),
                    'context': context
                })

                import json
                parsed = json.loads(result.content)
                return {
                    'translated_text': parsed.get('translated_text', text),
                    'isl_gloss': parsed.get('isl_gloss', '')
                }
            except Exception as e:
                logger.warning(f"LLM text translation failed: {e}")

        return {
            'translated_text': f'[Translation unavailable — set ANTHROPIC_API_KEY] {text}',
            'isl_gloss': self._generate_simple_gloss(text)
        }

    @staticmethod
    def _generate_simple_gloss(text):
        """Generate a simple ISL gloss (basic word reordering)"""
        words = text.strip().split()
        # ISL typically uses Subject-Object-Verb order
        # This is a very basic approximation
        return ' '.join(words).upper()

    @staticmethod
    def _get_lang_name(code):
        """Convert language code to full name"""
        lang_map = {
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali',
            'mr': 'Marathi',
            'gu': 'Gujarati',
        }
        return lang_map.get(code, 'English')
