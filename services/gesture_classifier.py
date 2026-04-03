"""
SignBridge - Advanced Gesture Classifier

Enhanced ISL gesture classification using combined landmark analysis:
  - Finger extension states
  - Hand orientation / rotation
  - Inter-finger distances
  - Wrist-to-fingertip vectors

Works as a drop-in replacement for SignClassifier with a .predict() interface.
"""

import logging
import math
import numpy as np

logger = logging.getLogger(__name__)


# Extended ISL gesture rules with richer geometry
ISL_GESTURES = {
    'hello': {
        'description': 'Open palm wave',
        'hindi': 'नमस्ते',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'palm_open': True,
    },
    'thank_you': {
        'description': 'Flat hand touching chin and moving forward',
        'hindi': 'धन्यवाद',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'palm_open': True,
        'hand_near_face': True,
    },
    'yes': {
        'description': 'Fist with nodding motion',
        'hindi': 'हाँ',
        'fingers': {'thumb': False, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
    },
    'no': {
        'description': 'Index and middle finger extended, waving side to side',
        'hindi': 'नहीं',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': False, 'pinky': False},
    },
    'please': {
        'description': 'Flat hand on chest, circular motion',
        'hindi': 'कृपया',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'palm_open': True,
    },
    'sorry': {
        'description': 'Fist on chest, circular motion',
        'hindi': 'माफ़ी',
        'fingers': {'thumb': False, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
    },
    'help': {
        'description': 'Thumbs up on open palm',
        'hindi': 'मदद',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'thumb_up': True,
    },
    'good': {
        'description': 'Thumbs up gesture',
        'hindi': 'अच्छा',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'thumb_up': True,
    },
    'bad': {
        'description': 'Thumbs down gesture',
        'hindi': 'बुरा',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': False},
        'thumb_down': True,
    },
    'love': {
        'description': 'ILY handshape — thumb, index, pinky extended',
        'hindi': 'प्यार',
        'fingers': {'thumb': True, 'index': True, 'middle': False, 'ring': False, 'pinky': True},
    },
    'stop': {
        'description': 'Open palm facing outward',
        'hindi': 'रुको',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'palm_open': True,
    },
    'one': {
        'description': 'Index finger extended',
        'hindi': 'एक',
        'fingers': {'thumb': False, 'index': True, 'middle': False, 'ring': False, 'pinky': False},
    },
    'two': {
        'description': 'Peace / Victory sign',
        'hindi': 'दो',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': False, 'pinky': False},
    },
    'three': {
        'description': 'Three fingers extended',
        'hindi': 'तीन',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': True, 'pinky': False},
    },
    'four': {
        'description': 'Four fingers extended, thumb tucked',
        'hindi': 'चार',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
    },
    'five': {
        'description': 'All five fingers extended',
        'hindi': 'पाँच',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
    },
    'ok': {
        'description': 'Thumb and index forming circle, others extended',
        'hindi': 'ठीक है',
        'fingers': {'thumb': True, 'index': True, 'middle': True, 'ring': True, 'pinky': True},
        'thumb_index_close': True,
    },
    'peace': {
        'description': 'Index and middle finger in V shape',
        'hindi': 'शांति',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': False, 'pinky': False},
    },
    'call_me': {
        'description': 'Thumb and pinky extended (phone shape)',
        'hindi': 'मुझे फ़ोन करो',
        'fingers': {'thumb': True, 'index': False, 'middle': False, 'ring': False, 'pinky': True},
    },
    'water': {
        'description': 'W handshape touching chin',
        'hindi': 'पानी',
        'fingers': {'thumb': False, 'index': True, 'middle': True, 'ring': True, 'pinky': False},
    },
}


class GestureClassifier:
    """
    Advanced ISL gesture classifier using geometric hand analysis.

    Uses finger states plus hand geometry (distances, angles, orientation)
    for more accurate classification than simple finger-matching.
    """

    def __init__(self):
        self._ready = True
        logger.info(
            f"GestureClassifier initialized | gestures={len(ISL_GESTURES)}"
        )

    def is_ready(self) -> bool:
        return self._ready

    def predict(self, landmarks_list):
        """
        Predict an ISL gesture from hand landmarks.

        Args:
            landmarks_list: list of hand data dicts from HandDetector.detect()

        Returns:
            dict with 'sign', 'confidence', 'hindi', 'description', 'method'
        """
        if not landmarks_list:
            return {
                'sign': None,
                'confidence': 0.0,
                'hindi': '',
                'description': 'No landmarks provided',
                'method': 'gesture_classifier',
            }

        hand_data = landmarks_list[0]
        lm = hand_data['landmarks']
        is_right = hand_data.get('handedness', 'Right') == 'Right'

        # Step 1: Compute finger states
        fingers = self._get_finger_states(lm, is_right)

        # Step 2: Compute hand geometry features
        geometry = self._get_hand_geometry(lm)

        # Step 3: Score each gesture
        best_match = None
        best_score = 0.0

        for name, gesture in ISL_GESTURES.items():
            score = self._score_gesture(fingers, geometry, gesture)
            if score > best_score:
                best_score = score
                best_match = name

        if best_match and best_score >= 0.55:
            info = ISL_GESTURES[best_match]
            return {
                'sign': best_match,
                'confidence': round(min(best_score, 1.0), 4),
                'hindi': info.get('hindi', ''),
                'description': info.get('description', ''),
                'method': 'gesture_classifier',
            }

        return {
            'sign': 'unknown',
            'confidence': round(best_score, 4),
            'hindi': '',
            'description': 'Gesture not recognized',
            'method': 'gesture_classifier',
        }

    # ── Finger state detection ───────────────────────────────────────

    def _get_finger_states(self, lm, is_right):
        """Determine which fingers are extended."""
        return {
            'thumb': self._is_thumb_extended(lm, is_right),
            'index': self._is_finger_extended(lm, 5, 6, 7, 8),
            'middle': self._is_finger_extended(lm, 9, 10, 11, 12),
            'ring': self._is_finger_extended(lm, 13, 14, 15, 16),
            'pinky': self._is_finger_extended(lm, 17, 18, 19, 20),
        }

    @staticmethod
    def _is_thumb_extended(lm, is_right):
        """Thumb uses x-axis comparison (left/right dependent)."""
        tip = lm[4]
        ip = lm[3]
        mcp = lm[2]
        if is_right:
            return tip['x'] < ip['x'] and ip['x'] < mcp['x']
        return tip['x'] > ip['x'] and ip['x'] > mcp['x']

    @staticmethod
    def _is_finger_extended(lm, mcp_idx, pip_idx, dip_idx, tip_idx):
        """
        Finger is extended if tip is above PIP and PIP is above MCP
        (y-axis decreases upward in image coords).
        """
        tip_y = lm[tip_idx]['y']
        pip_y = lm[pip_idx]['y']
        mcp_y = lm[mcp_idx]['y']
        return tip_y < pip_y and pip_y < mcp_y

    # ── Hand geometry ────────────────────────────────────────────────

    def _get_hand_geometry(self, lm):
        """Extract geometric features from landmarks."""
        wrist = lm[0]
        index_tip = lm[8]
        middle_tip = lm[12]
        thumb_tip = lm[4]
        index_mcp = lm[5]
        pinky_mcp = lm[17]

        # Thumb-index distance (normalized by palm width)
        palm_width = self._dist(lm[5], lm[17])
        thumb_index_dist = self._dist(thumb_tip, index_tip)
        thumb_index_ratio = thumb_index_dist / max(palm_width, 0.001)

        # Is thumb pointing up?
        thumb_up = (
            thumb_tip['y'] < lm[3]['y'] < lm[2]['y']
            and thumb_tip['y'] < wrist['y']
        )

        # Is thumb pointing down?
        thumb_down = (
            thumb_tip['y'] > lm[3]['y'] > lm[2]['y']
            and thumb_tip['y'] > wrist['y']
        )

        # Palm openness (average fingertip-to-wrist distance)
        tips = [lm[4], lm[8], lm[12], lm[16], lm[20]]
        avg_tip_dist = sum(self._dist(t, wrist) for t in tips) / 5
        palm_open = avg_tip_dist / max(palm_width, 0.001) > 1.8

        # Hand near face (wrist high in frame — y < 0.4)
        hand_near_face = wrist['y'] < 0.4

        return {
            'thumb_index_ratio': thumb_index_ratio,
            'thumb_index_close': thumb_index_ratio < 0.5,
            'thumb_up': thumb_up,
            'thumb_down': thumb_down,
            'palm_open': palm_open,
            'hand_near_face': hand_near_face,
            'palm_width': palm_width,
        }

    @staticmethod
    def _dist(a, b):
        """Euclidean distance between two landmarks."""
        return math.sqrt(
            (a['x'] - b['x']) ** 2 +
            (a['y'] - b['y']) ** 2 +
            (a['z'] - b['z']) ** 2
        )

    # ── Scoring ──────────────────────────────────────────────────────

    def _score_gesture(self, fingers, geometry, gesture):
        """
        Score how well the current hand state matches a gesture rule.
        Returns a score between 0.0 and 1.0.
        """
        total_weight = 0
        matched_weight = 0

        # Finger matching (weight: 5 each = 25 max)
        expected_fingers = gesture.get('fingers', {})
        for fname in ['thumb', 'index', 'middle', 'ring', 'pinky']:
            if fname in expected_fingers:
                total_weight += 5
                if fingers.get(fname) == expected_fingers[fname]:
                    matched_weight += 5

        # Geometry bonuses (weight: 3 each)
        for geo_key in ['thumb_up', 'thumb_down', 'palm_open',
                        'thumb_index_close', 'hand_near_face']:
            if geo_key in gesture:
                total_weight += 3
                if geometry.get(geo_key) == gesture[geo_key]:
                    matched_weight += 3

        return matched_weight / max(total_weight, 1)

    # ── Utility ──────────────────────────────────────────────────────

    def get_supported_signs(self):
        """Return list of all supported gestures."""
        return [
            {
                'name': name,
                'description': data['description'],
                'hindi': data.get('hindi', ''),
            }
            for name, data in ISL_GESTURES.items()
        ]
