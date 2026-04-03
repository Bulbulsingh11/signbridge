"""
SignBridge - ISL Sign Language Classifier

Classifies hand landmarks into Indian Sign Language (ISL) signs.
Uses a hybrid approach:
  1. Rule-based classifier for common static signs (immediate)
  2. ML model classifier for complex signs (when model is available)
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)


# ISL Sign Database — common static signs with finger state rules
ISL_SIGNS = {
    'hello': {
        'description': 'Open palm wave',
        'hindi': 'नमस्ते',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
    },
    'thank_you': {
        'description': 'Flat hand touching chin and moving forward',
        'hindi': 'धन्यवाद',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
        'chin_touch': True,
    },
    'yes': {
        'description': 'Fist with nodding motion',
        'hindi': 'हाँ',
        'fingers': {'thumb': False, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'no': {
        'description': 'Index and middle finger extended, waving side to side',
        'hindi': 'नहीं',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'please': {
        'description': 'Flat hand on chest, circular motion',
        'hindi': 'कृपया',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
    },
    'sorry': {
        'description': 'Fist on chest, circular motion',
        'hindi': 'माफ़ी',
        'fingers': {'thumb': False, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'help': {
        'description': 'Thumbs up on open palm',
        'hindi': 'मदद',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'good': {
        'description': 'Thumbs up gesture',
        'hindi': 'अच्छा',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'bad': {
        'description': 'Thumbs down gesture',
        'hindi': 'बुरा',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'min_hands': 1,
        'thumb_down': True,
    },
    'love': {
        'description': 'ILY handshape — thumb, index, pinky extended',
        'hindi': 'प्यार',
        'fingers': {'thumb': True, 'index': True, 'middle': False, 'ring': False, 'pinky': True},
        'min_hands': 1,
    },
    'stop': {
        'description': 'Open palm facing outward',
        'hindi': 'रुको',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
    },
    'one': {
        'description': 'Index finger extended',
        'hindi': 'एक',
        'fingers': {'thumb': False, 'index': True, 'middle': False, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'two': {
        'description': 'Peace/Victory sign',
        'hindi': 'दो',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'three': {
        'description': 'Three fingers extended',
        'hindi': 'तीन',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': True, 'pinky': False},
        'min_hands': 1,
    },
    'four': {
        'description': 'Four fingers extended, thumb tucked',
        'hindi': 'चार',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
    },
    'five': {
        'description': 'All five fingers extended',
        'hindi': 'पाँच',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
    },
    'ok': {
        'description': 'Thumb and index forming circle, others extended',
        'hindi': 'ठीक है',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'min_hands': 1,
        'ok_gesture': True,
    },
    'peace': {
        'description': 'Index and middle finger in V shape',
        'hindi': 'शांति',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': False, 'pinky': False},
        'min_hands': 1,
    },
    'call_me': {
        'description': 'Thumb and pinky extended (phone shape)',
        'hindi': 'मुझे फ़ोन करो',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': True},
        'min_hands': 1,
    },
    'water': {
        'description': 'W handshape touching chin',
        'hindi': 'पानी',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': True, 'pinky': False},
        'min_hands': 1,
    },
}


class SignClassifier:
    """
    Indian Sign Language sign classifier.
    
    Hybrid approach:
    - Rule-based matching for static signs using finger states
    - ML model-based classification (loaded from /models if available)
    """

    def __init__(self, model_path=None):
        self._ready = True
        self._model = None
        self._model_loaded = False

        # Try loading ML model
        if model_path:
            self._load_model(model_path)

        logger.info(
            f"🤟 SignClassifier initialized | "
            f"rule_based_signs={len(ISL_SIGNS)} | "
            f"ml_model={'loaded' if self._model_loaded else 'not loaded (using rules)'}"
        )

    def _load_model(self, model_path):
        """Load a trained ML model for sign classification"""
        try:
            import joblib
            self._model = joblib.load(model_path)
            self._model_loaded = True
            logger.info(f"ML model loaded from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}. Falling back to rule-based.")
            self._model_loaded = False

    def is_ready(self) -> bool:
        return self._ready

    def classify(self, landmarks_list):
        """
        Classify hand landmarks into an ISL sign.

        Args:
            landmarks_list: list of hand data dicts from HandDetector.detect()

        Returns:
            dict with 'sign', 'confidence', 'hindi', 'description'
        """
        if not landmarks_list:
            return {
                'sign': None,
                'confidence': 0.0,
                'hindi': '',
                'description': 'No landmarks provided'
            }

        # If ML model available, use it
        if self._model_loaded:
            return self._classify_ml(landmarks_list)

        # Otherwise, use rule-based classification
        return self._classify_rules(landmarks_list)

    def _classify_rules(self, landmarks_list):
        """Rule-based classification using finger states"""
        from services.hand_detector import HandDetector

        detector = HandDetector.__new__(HandDetector)
        finger_states = []

        for hand_data in landmarks_list:
            lm = hand_data['landmarks']
            is_right = hand_data.get('handedness', 'Right') == 'Right'

            fingers = {
                'thumb': HandDetector._is_thumb_extended(lm, is_right),
                'index': HandDetector._is_finger_extended(lm, 5, 8),
                'middle': HandDetector._is_finger_extended(lm, 9, 12),
                'ring': HandDetector._is_finger_extended(lm, 13, 16),
                'pinky': HandDetector._is_finger_extended(lm, 17, 20),
            }
            fingers['count'] = sum(v for k, v in fingers.items() if k != 'count')
            finger_states.append(fingers)

        best_match = None
        best_score = 0.0

        for sign_name, sign_data in ISL_SIGNS.items():
            if len(landmarks_list) < sign_data.get('min_hands', 1):
                continue

            score = self._match_score(finger_states[0], sign_data['fingers'])

            if score > best_score:
                best_score = score
                best_match = sign_name

        if best_match and best_score >= 0.6:
            sign_info = ISL_SIGNS[best_match]
            return {
                'sign': best_match,
                'confidence': round(best_score, 4),
                'hindi': sign_info.get('hindi', ''),
                'description': sign_info.get('description', ''),
                'method': 'rule_based'
            }

        return {
            'sign': 'unknown',
            'confidence': round(best_score, 4),
            'hindi': '',
            'description': 'Sign not recognized',
            'method': 'rule_based'
        }

    def _classify_ml(self, landmarks_list):
        """ML model-based classification"""
        try:
            features = []
            for hand_data in landmarks_list:
                for lm in hand_data['landmarks']:
                    features.extend([lm['x'], lm['y'], lm['z']])

            features = np.array(features).reshape(1, -1)
            prediction = self._model.predict(features)[0]
            proba = self._model.predict_proba(features)[0]
            confidence = float(np.max(proba))

            sign_info = ISL_SIGNS.get(prediction, {})

            return {
                'sign': prediction,
                'confidence': round(confidence, 4),
                'hindi': sign_info.get('hindi', ''),
                'description': sign_info.get('description', ''),
                'method': 'ml_model'
            }
        except Exception as e:
            logger.error(f"ML classification failed: {e}, falling back to rules")
            return self._classify_rules(landmarks_list)

    @staticmethod
    def _match_score(detected_fingers, expected_fingers):
        """
        Calculate match score between detected finger states and expected.
        Returns a score between 0.0 and 1.0.
        """
        matches = 0
        total = 0

        for finger in ['thumb', 'index', 'middle', 'ring', 'pinky']:
            if finger in expected_fingers:
                total += 1
                if detected_fingers.get(finger) == expected_fingers[finger]:
                    matches += 1

        return matches / total if total > 0 else 0.0

    def get_supported_signs(self):
        """Return list of all supported ISL signs"""
        return [
            {
                'name': name,
                'description': data['description'],
                'hindi': data.get('hindi', ''),
            }
            for name, data in ISL_SIGNS.items()
        ]

    def get_sign_info(self, sign_name):
        """Get detailed info about a specific sign"""
        sign = ISL_SIGNS.get(sign_name)
        if not sign:
            return None
        return {
            'name': sign_name,
            **sign
        }
