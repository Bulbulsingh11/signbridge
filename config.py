"""
SignBridge - Configuration Management
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration"""

    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'signbridge-dev-key-change-in-prod')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # CORS
    ALLOWED_ORIGINS = os.getenv(
        'ALLOWED_ORIGINS',
        'http://localhost:3000,http://localhost:5173,chrome-extension://*'
    ).split(',')

    # Anthropic / Claude
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
    CLAUDE_MODEL = os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-20250514')

    # MediaPipe
    MAX_NUM_HANDS = int(os.getenv('MAX_NUM_HANDS', '2'))
    MIN_DETECTION_CONFIDENCE = float(os.getenv('MIN_DETECTION_CONFIDENCE', '0.7'))
    MIN_TRACKING_CONFIDENCE = float(os.getenv('MIN_TRACKING_CONFIDENCE', '0.5'))

    # Sign Classification
    PREDICTION_CONFIDENCE_THRESHOLD = float(
        os.getenv('PREDICTION_CONFIDENCE_THRESHOLD', '0.6')
    )

    # Supported Languages
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'hi': 'Hindi',
        'es': 'Spanish',
        'ta': 'Tamil',
        'te': 'Telugu',
        'bn': 'Bengali',
        'mr': 'Marathi',
        'gu': 'Gujarati',
    }

    # Rate Limiting
    RATE_LIMIT = os.getenv('RATE_LIMIT', '100/minute')

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
