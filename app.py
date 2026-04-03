"""
SignBridge Backend — Flask API Server
Real-time Indian Sign Language (ISL) Communication Assistant

Endpoints:
    GET  /api/health          → Service health check
    POST /api/predict          → Predict ISL sign from image frame
    POST /api/translate        → Translate text between languages
    GET  /api/signs            → List all supported ISL signs
    POST /api/detect-landmarks → Detect hand landmarks (debug)
"""

import os
import base64
import time
import logging
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
import cv2
import numpy as np

from config import Config
from utils.response import success_response, error_response
from services.hand_detector import HandDetector
from services.gesture_classifier import GestureClassifier
from services.sign_classifier import SignClassifier
from services.translator import SignTranslator
from services.gesture_generator import GestureGenerator

# ── Bootstrap ────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format='%(asctime)s  %(name)-24s  %(levelname)-8s  %(message)s',
)
logger = logging.getLogger(__name__)

# ── Flask App ────────────────────────────────────────────────────────
app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}})

# ── Services ─────────────────────────────────────────────────────────
hand_detector = HandDetector(
    max_hands=Config.MAX_NUM_HANDS,
    min_detection_conf=Config.MIN_DETECTION_CONFIDENCE,
    min_tracking_conf=Config.MIN_TRACKING_CONFIDENCE,
)
sign_classifier = SignClassifier()
translator = SignTranslator()
gesture_classifier = GestureClassifier()
gesture_generator = GestureGenerator()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.route('/api/health', methods=['GET'])
def health_check():
    """Service health & readiness probe."""
    return success_response({
        'status': 'healthy',
        'version': '1.0.0',
        'project': 'SignBridge',
        'services': {
            'hand_detector': hand_detector.is_ready(),
            'sign_classifier': sign_classifier.is_ready(),
            'translator': translator.is_ready(),
        },
        'supported_languages': Config.SUPPORTED_LANGUAGES,
        'timestamp': time.time(),
    })


@app.route('/api/predict', methods=['POST'])
def predict_sign():
    """
    Predict an ISL sign from an image frame.

    Accepts
    -------
    - JSON body  → { "image": "<base64 string>" }
    - Multipart  → file field named `image`

    Query params
    ------------
    - lang : target translation language (default: hi)

    Returns
    -------
    {
        "sign": "hello",
        "confidence": 0.92,
        "translation": "नमस्ते",
        ...
    }
    """
    try:
        frame = _decode_frame(request)

        if frame is None:
            return error_response(
                'No valid image provided. '
                'Send base64 JSON {"image":"..."} or multipart file upload.',
                400,
            )

        # 1️⃣  Detect hand landmarks
        landmarks, annotated_frame, hand_count = hand_detector.detect(frame)

        if not landmarks:
            return success_response({
                'sign': None,
                'confidence': 0.0,
                'hands_detected': 0,
                'translation': '',
                'message': 'No hands detected in frame',
            })

        # 2️⃣  Classify the sign using GestureClassifier
        prediction = gesture_classifier.predict(landmarks)

        # 3️⃣  Translate to requested language
        target_lang = request.args.get('lang', 'hi')
        translation = translator.translate(prediction['sign'], target_lang)

        return success_response({
            'sign': prediction['sign'],
            'confidence': prediction['confidence'],
            'hands_detected': hand_count,
            'landmarks': landmarks,
            'translation': translation,
            'hindi': prediction.get('hindi', ''),
            'description': prediction.get('description', ''),
            'target_language': target_lang,
            'method': prediction.get('method', ''),
        })

    except Exception as e:
        logger.error(f'Prediction error: {e}', exc_info=True)
        return error_response(f'Prediction failed: {str(e)}', 500)


@app.route('/api/translate', methods=['POST'])
def translate_text():
    """
    Translate arbitrary text between languages with ISL context.

    Body
    ----
    {
        "text": "Hello, how are you?",
        "source_lang": "en",
        "target_lang": "hi",
        "context": "sign_language"          // optional
    }
    """
    try:
        data = request.get_json(silent=True)
        if not data or 'text' not in data:
            return error_response('JSON body with "text" field required', 400)

        text = data['text']
        source_lang = data.get('source_lang', 'en')
        target_lang = data.get('target_lang', 'hi')
        context = data.get('context', 'sign_language')

        result = translator.translate_text(
            text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            context=context,
        )

        return success_response({
            'original_text': text,
            'translated_text': result['translated_text'],
            'source_language': source_lang,
            'target_language': target_lang,
            'isl_gloss': result.get('isl_gloss', ''),
            'context': context,
        })

    except Exception as e:
        logger.error(f'Translation error: {e}', exc_info=True)
        return error_response(f'Translation failed: {str(e)}', 500)


@app.route('/api/signs', methods=['GET'])
def list_signs():
    """List every supported ISL sign with metadata."""
    signs = sign_classifier.get_supported_signs()
    return success_response({
        'signs': signs,
        'total': len(signs),
    })


@app.route('/api/detect-landmarks', methods=['POST'])
def detect_landmarks():
    """
    Detect hand landmarks without sign classification.
    Useful for debugging and model training data collection.
    """
    try:
        frame = _decode_frame(request)
        if frame is None:
            return error_response('No valid image provided', 400)

        landmarks, _, hand_count = hand_detector.detect(frame)

        # Also compute finger states for debugging
        finger_states = []
        if landmarks:
            finger_states = hand_detector.get_finger_states(landmarks)

        return success_response({
            'hands_detected': hand_count,
            'landmarks': landmarks,
            'finger_states': finger_states,
        })

    except Exception as e:
        logger.error(f'Landmark detection error: {e}', exc_info=True)
        return error_response(f'Detection failed: {str(e)}', 500)




@app.route('/api/generate', methods=['POST'])
def generate_sign():
    """Generate an MP4 video for the given text using GestureGenerator."""
    data = request.get_json(silent=True) or {}
    text = data.get('text')
    if not text:
        return error_response('JSON body with "text" field required', 400)
    try:
        video_bytes = gesture_generator.generate(text)
        b64 = base64.b64encode(video_bytes).decode()
        return success_response({'video_base64': b64})
    except Exception as e:
        logger.error(f'Generation error: {e}', exc_info=True)
        return error_response(f'Generation failed: {str(e)}', 500)


@app.errorhandler(404)
def not_found(e):
    return error_response('Endpoint not found', 404)


@app.errorhandler(405)
def method_not_allowed(e):
    return error_response('Method not allowed', 405)


@app.errorhandler(500)
def internal_error(e):
    return error_response('Internal server error', 500)


# ── Helpers ──────────────────────────────────────────────────────────

def _decode_frame(req):
    """
    Extract an OpenCV BGR frame from the incoming request.
    Supports both base64 JSON and multipart file upload.
    """
    try:
        # JSON with base64 image
        if req.is_json:
            data = req.get_json(silent=True) or {}
            image_data = data.get('image')
            if not image_data:
                return None
            if ',' in image_data:          # strip data-URI prefix
                image_data = image_data.split(',', 1)[1]
            raw = base64.b64decode(image_data)

        # Multipart file upload
        elif 'image' in req.files:
            raw = req.files['image'].read()

        else:
            return None

        arr = np.frombuffer(raw, np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)

    except Exception as e:
        logger.warning(f'Image decode failed: {e}')
        return None


# ── Entry point ──────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = Config.DEBUG

    logger.info('━' * 56)
    logger.info('  🤟  SignBridge Backend')
    logger.info(f'  📡  http://localhost:{port}')
    logger.info(f'  🔧  Debug = {debug}')
    logger.info('━' * 56)

    app.run(host='0.0.0.0', port=port, debug=debug)
