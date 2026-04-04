"""
SignBridge - ISL Sign Language Classifier

Two-step classification:
  1. If HandDetector ran GestureRecognizer Task API → use its gesture label directly
  2. Otherwise → rule-based finger-state matching with priority tiebreaker
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)


# ── ISL Sign Database ─────────────────────────────────────────────────────────
# priority: when two signs have identical finger patterns, higher priority wins
# KEY RULE: Semantic/meaningful signs should have higher priority than number signs
#           because numbers are less commonly used in conversation.
ISL_SIGNS = {
    # ── All fingers open [T I M R P] ──
    'hello':     {'description': 'Open palm wave',                              'hindi': 'नमस्ते',        'fingers': {'thumb': True,  'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 5},
    'stop':      {'description': 'Open palm facing outward',                    'hindi': 'रुको',           'fingers': {'thumb': True,  'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 2},
    'five':      {'description': 'All five fingers extended',                   'hindi': 'पाँच',           'fingers': {'thumb': True,  'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 1},
    'thank_you': {'description': 'Flat hand from chin forward',                 'hindi': 'धन्यवाद',       'fingers': {'thumb': True,  'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 3},
    'please':    {'description': 'Flat hand on chest, circular motion',         'hindi': 'कृपया',          'fingers': {'thumb': True,  'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 2},
    'ok':        {'description': 'Thumb + index circle, others extended',       'hindi': 'ठीक है',         'fingers': {'thumb': True,  'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 1},

    # ── Fist (all closed) ──
    'yes':       {'description': 'Fist with nodding motion',                    'hindi': 'हाँ',            'fingers': {'thumb': False, 'index': False, 'middle': False, 'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 5},
    'sorry':     {'description': 'Fist on chest, circular motion',              'hindi': 'माफ़ी',          'fingers': {'thumb': False, 'index': False, 'middle': False, 'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 2},

    # ── Index + Middle [0 I M 0 0] ──
    'no':        {'description': 'Index + middle, wave side to side',           'hindi': 'नहीं',           'fingers': {'thumb': False, 'index': True,  'middle': True,  'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 4},
    'peace':     {'description': 'Index + middle in V shape',                   'hindi': 'शांति',          'fingers': {'thumb': False, 'index': True,  'middle': True,  'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 3},
    'two':       {'description': 'Peace / V sign',                              'hindi': 'दो',             'fingers': {'thumb': False, 'index': True,  'middle': True,  'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 2},

    # ── Thumb only [T 0 0 0 0] ──
    'good':      {'description': 'Thumbs up gesture',                           'hindi': 'अच्छा',          'fingers': {'thumb': True,  'index': False, 'middle': False, 'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 5},
    'bad':       {'description': 'Thumbs down gesture',                         'hindi': 'बुरा',           'fingers': {'thumb': True,  'index': False, 'middle': False, 'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 3},
    'help':      {'description': 'Thumbs up raised on open palm',               'hindi': 'मदद',            'fingers': {'thumb': True,  'index': False, 'middle': False, 'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 2},

    # ── Unique patterns ──
    'love':      {'description': 'ILY — thumb, index, pinky extended',          'hindi': 'प्यार',          'fingers': {'thumb': True,  'index': True,  'middle': False, 'ring': False, 'pinky': True},  'min_hands': 1, 'priority': 5},
    'call_me':   {'description': 'Thumb + pinky extended (phone shape)',        'hindi': 'मुझे फ़ोन करो', 'fingers': {'thumb': True,  'index': False, 'middle': False, 'ring': False, 'pinky': True},  'min_hands': 1, 'priority': 5},
    'one':       {'description': 'Index finger extended',                       'hindi': 'एक',             'fingers': {'thumb': False, 'index': True,  'middle': False, 'ring': False, 'pinky': False}, 'min_hands': 1, 'priority': 3},
    'three':     {'description': 'Three fingers extended',                      'hindi': 'तीन',            'fingers': {'thumb': False, 'index': True,  'middle': True,  'ring': True,  'pinky': False}, 'min_hands': 1, 'priority': 3},
    'four':      {'description': 'Four fingers, thumb tucked',                  'hindi': 'चार',            'fingers': {'thumb': False, 'index': True,  'middle': True,  'ring': True,  'pinky': True},  'min_hands': 1, 'priority': 3},
    'water':     {'description': 'W handshape, touch chin',                     'hindi': 'पानी',           'fingers': {'thumb': False, 'index': True,  'middle': True,  'ring': True,  'pinky': False}, 'min_hands': 1, 'priority': 2},
}

# MediaPipe GestureRecognizer label → ISL sign name
# MediaPipe recognizes these built-in gestures:
#   Closed_Fist, Open_Palm, Pointing_Up, Thumb_Down, Thumb_Up, Victory, ILoveYou
GESTURE_MAP = {
    'Thumb_Up':    'good',
    'Thumb_Down':  'bad',
    'Open_Palm':   'hello',
    'Victory':     'peace',     # V-sign → peace (two/no use same shape but different context)
    'ILoveYou':    'love',
    'Pointing_Up': 'one',
    'Closed_Fist': 'yes',
}


class SignClassifier:
    """
    ISL sign classifier.
    - If GestureRecognizer already labelled the gesture → use that directly.
    - Otherwise → rule-based finger-state matching with priority tiebreaker.
    """

    def __init__(self, model_path=None):
        self._ready = True
        self._model = None
        self._model_loaded = False

        if model_path:
            self._load_model(model_path)

        logger.info(
            f"🤟 SignClassifier ready | "
            f"isl_signs={len(ISL_SIGNS)} | "
            f"ml_model={'loaded' if self._model_loaded else 'not loaded (rules active)'}"
        )

    def _load_model(self, model_path):
        try:
            import joblib
            self._model = joblib.load(model_path)
            self._model_loaded = True
            logger.info(f"ML model loaded from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}")

    def is_ready(self) -> bool:
        return self._ready

    def classify(self, landmarks_list):
        """
        Classify landmarks → ISL sign dict.

        Args:
            landmarks_list: output from HandDetector.detect()

        Returns:
            dict: {sign, confidence, hindi, description, method}
        """
        if not landmarks_list:
            return {'sign': None, 'confidence': 0.0, 'hindi': '', 'description': ''}

        # ── Path 1: GestureRecognizer already labelled it ──
        gesture = landmarks_list[0].get('gesture')
        if gesture and gesture not in (None, 'Unknown', 'None', ''):
            mapped = GESTURE_MAP.get(gesture)
            if mapped:
                sign_info = ISL_SIGNS.get(mapped, {})
                return {
                    'sign':        mapped,
                    'confidence':  landmarks_list[0].get('confidence', 0.85),
                    'hindi':       sign_info.get('hindi', ''),
                    'description': sign_info.get('description', ''),
                    'method':      'gesture_recognizer',
                }

        # ── Path 2: ML model (if loaded) ──
        if self._model_loaded:
            return self._classify_ml(landmarks_list)

        # ── Path 3: Advanced geometry-based classifier ──
        # Uses finger states + hand geometry (thumb direction, palm openness, etc.)
        # for better differentiation of similar signs
        try:
            from services.gesture_classifier import GestureClassifier
            if not hasattr(self, '_gesture_clf'):
                self._gesture_clf = GestureClassifier()
            result = self._gesture_clf.predict(landmarks_list)
            if result and result.get('sign') and result['sign'] != 'unknown' and result.get('confidence', 0) >= 0.55:
                return result
        except Exception as e:
            logger.debug(f"GestureClassifier fallback error: {e}")

        # ── Path 4: Basic rule-based finger matching ──
        return self._classify_rules(landmarks_list)

    # ── Rule-based ──────────────────────────────────────────────────────────

    def _classify_rules(self, landmarks_list):
        from services.hand_detector import HandDetector

        finger_states = []
        for hand_data in landmarks_list:
            lm = hand_data['landmarks']
            is_right = hand_data.get('handedness', 'Right') == 'Right'

            fingers = {
                'thumb':  HandDetector._is_thumb_extended(lm, is_right),
                'index':  HandDetector._is_finger_extended(lm, 5, 8),
                'middle': HandDetector._is_finger_extended(lm, 9, 12),
                'ring':   HandDetector._is_finger_extended(lm, 13, 16),
                'pinky':  HandDetector._is_finger_extended(lm, 17, 20),
            }
            fingers['count'] = sum(v for k, v in fingers.items() if k != 'count')
            finger_states.append(fingers)

        best_match = None
        best_score = 0.0

        for sign_name, sign_data in ISL_SIGNS.items():
            if len(landmarks_list) < sign_data.get('min_hands', 1):
                continue

            score = self._match_score(finger_states[0], sign_data['fingers'])
            current_priority = sign_data.get('priority', 1)
            best_priority = ISL_SIGNS.get(best_match, {}).get('priority', 1) if best_match else 0

            if score > best_score or (score == best_score and current_priority > best_priority):
                best_score = score
                best_match = sign_name

        if best_match and best_score >= 0.6:
            sign_info = ISL_SIGNS[best_match]
            return {
                'sign':        best_match,
                'confidence':  round(best_score, 4),
                'hindi':       sign_info.get('hindi', ''),
                'description': sign_info.get('description', ''),
                'method':      'rule_based',
            }

        return {
            'sign':        'unknown',
            'confidence':  round(best_score, 4),
            'hindi':       '',
            'description': 'Sign not recognized',
            'method':      'rule_based',
        }

    # ── ML model ─────────────────────────────────────────────────────────────

    def _classify_ml(self, landmarks_list):
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
                'sign':        prediction,
                'confidence':  round(confidence, 4),
                'hindi':       sign_info.get('hindi', ''),
                'description': sign_info.get('description', ''),
                'method':      'ml_model',
            }
        except Exception as e:
            logger.error(f"ML classification failed: {e}, falling back to rules")
            return self._classify_rules(landmarks_list)

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _match_score(detected_fingers, expected_fingers) -> float:
        matches = sum(
            1 for f in ['thumb', 'index', 'middle', 'ring', 'pinky']
            if f in expected_fingers and detected_fingers.get(f) == expected_fingers[f]
        )
        total = sum(1 for f in ['thumb', 'index', 'middle', 'ring', 'pinky'] if f in expected_fingers)
        return matches / total if total > 0 else 0.0

    def get_supported_signs(self):
        return [
            {'name': name, 'description': data['description'], 'hindi': data.get('hindi', '')}
            for name, data in ISL_SIGNS.items()
        ]

    def get_sign_info(self, sign_name):
        sign = ISL_SIGNS.get(sign_name)
        if not sign:
            return None
        return {'name': sign_name, **sign}