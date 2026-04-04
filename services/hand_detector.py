"""
SignBridge - Hand Landmark Detection Service

Tries MediaPipe GestureRecognizer Task API first (if model file exists).
Falls back to mp.solutions.hands automatically if model is missing.
"""

import os
import logging
import numpy as np
import cv2  # pylint: disable=no-member
import mediapipe as mp  # pylint: disable=no-member

logger = logging.getLogger(__name__)

# Absolute path to model — works regardless of working directory
_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'models', 'gesture_recognizer.task'
)

LANDMARK_NAMES = [
    'WRIST',
    'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
    'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
    'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
    'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
    'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP',
]


class HandDetector:
    def __init__(self, max_hands=2, min_detection_conf=0.7, min_tracking_conf=0.5):
        self.max_hands = max_hands
        self.min_detection_conf = min_detection_conf
        self.min_tracking_conf = min_tracking_conf
        self._ready = False
        self._use_task_api = False

        # ── Option 1: GestureRecognizer Task API (needs .task model file) ──
        if os.path.exists(_MODEL_PATH):
            try:
                BaseOptions = mp.tasks.BaseOptions
                GestureRecognizer = mp.tasks.vision.GestureRecognizer
                GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
                RunningMode = mp.tasks.vision.RunningMode

                options = GestureRecognizerOptions(
                    base_options=BaseOptions(model_asset_path=_MODEL_PATH),
                    running_mode=RunningMode.IMAGE,
                    num_hands=max_hands,
                    min_hand_detection_confidence=min_detection_conf,
                    min_hand_presence_confidence=min_tracking_conf,
                )
                self.recognizer = GestureRecognizer.create_from_options(options)
                self._ready = True
                self._use_task_api = True
                logger.info("✋ HandDetector using GestureRecognizer Task API")
            except Exception as e:
                logger.warning(f"Task API failed ({e}), falling back to solutions API")

        # ── Option 2: Legacy mp.solutions.hands (no model file needed) ──
        if not self._ready:
            try:
                self.mp_hands = mp.solutions.hands  # pyright: ignore
                self.mp_drawing = mp.solutions.drawing_utils  # pyright: ignore
                self.mp_drawing_styles = mp.solutions.drawing_styles  # pyright: ignore
                self.hands = self.mp_hands.Hands(
                    static_image_mode=False,  # tracking mode for video
                    max_num_hands=max_hands,
                    min_detection_confidence=min_detection_conf,
                    min_tracking_confidence=min_tracking_conf,
                )
                self._ready = True
                logger.info("✋ HandDetector using mp.solutions.hands (tracking mode)")
            except Exception as e:
                logger.error(f"HandDetector init completely failed: {e}")

    def is_ready(self) -> bool:
        return self._ready

    def detect(self, frame: np.ndarray):
        if not self._ready:
            return [], None, 0
        if self._use_task_api:
            return self._detect_task_api(frame)
        return self._detect_solutions_api(frame)

    # ── Task API path ────────────────────────────────────────────────────────
    def _detect_task_api(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.recognizer.recognize(mp_image)

        if not result.gestures:
            return [], frame, 0

        all_landmarks = []
        for idx, (gesture, hand_lms) in enumerate(
            zip(result.gestures, result.hand_landmarks)
        ):
            gesture_name = gesture[0].category_name
            confidence = round(gesture[0].score, 4)

            landmarks = [
                {'id': i, 'x': round(lm.x, 6), 'y': round(lm.y, 6), 'z': round(lm.z, 6)}
                for i, lm in enumerate(hand_lms)
            ]

            all_landmarks.append({
                'hand_index':  idx,
                'handedness':  result.handedness[idx][0].category_name,
                'gesture':     gesture_name,
                'confidence':  confidence,
                'landmarks':   landmarks,
            })

        logger.debug(f"Task API: detected {len(all_landmarks)} hand(s)")
        return all_landmarks, frame, len(all_landmarks)

    # ── Solutions API path ───────────────────────────────────────────────────
    def _detect_solutions_api(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        results = self.hands.process(rgb_frame)
        rgb_frame.flags.writeable = True
        annotated_frame = frame.copy()

        if not results.multi_hand_landmarks:
            return [], annotated_frame, 0

        all_landmarks = []
        for idx, (hand_landmarks, handedness) in enumerate(
            zip(results.multi_hand_landmarks, results.multi_handedness)
        ):
            self.mp_drawing.draw_landmarks(
                annotated_frame,
                hand_landmarks,
                self.mp_hands.HAND_CONNECTIONS,
                self.mp_drawing_styles.get_default_hand_landmarks_style(),
                self.mp_drawing_styles.get_default_hand_connections_style(),
            )

            hand_data = {
                'hand_index': idx,
                'handedness': handedness.classification[0].label,
                'handedness_confidence': round(handedness.classification[0].score, 4),
                'gesture': None,     # filled in by SignClassifier rule-based
                'confidence': None,
                'landmarks': []
            }

            for i, lm in enumerate(hand_landmarks.landmark):
                hand_data['landmarks'].append({
                    'id': i,
                    'name': LANDMARK_NAMES[i],
                    'x': round(lm.x, 6),
                    'y': round(lm.y, 6),
                    'z': round(lm.z, 6),
                })

            all_landmarks.append(hand_data)

        logger.debug(f"Solutions API: detected {len(all_landmarks)} hand(s)")
        return all_landmarks, annotated_frame, len(all_landmarks)

    # ── Finger state helpers (used by SignClassifier rule-based path) ────────
    @staticmethod
    def _is_thumb_extended(landmarks, is_right: bool) -> bool:
        """Thumb extends horizontally — compare x coords of tip vs IP joint."""
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        if is_right:
            return thumb_tip['x'] > thumb_ip['x']   # right hand: tip to the right
        return thumb_tip['x'] < thumb_ip['x']        # left hand:  tip to the left

    @staticmethod
    def _is_finger_extended(landmarks, mcp_idx: int, tip_idx: int) -> bool:
        """Fingers extend upward — tip y should be less than MCP y (y=0 is top)."""
        return landmarks[tip_idx]['y'] < landmarks[mcp_idx]['y']

    def get_finger_states(self, landmarks_list):
        finger_states = []
        for hand_data in landmarks_list:
            lm = hand_data['landmarks']
            is_right = hand_data.get('handedness', 'Right') == 'Right'
            fingers = {
                'thumb':  self._is_thumb_extended(lm, is_right),
                'index':  self._is_finger_extended(lm, 5, 8),
                'middle': self._is_finger_extended(lm, 9, 12),
                'ring':   self._is_finger_extended(lm, 13, 16),
                'pinky':  self._is_finger_extended(lm, 17, 20),
            }
            count = int(sum(fingers.values()))
            fingers_with_count = {**fingers, 'count': count}
            finger_states.append({
                'hand_index': hand_data['hand_index'],
                'handedness': hand_data.get('handedness', ''),
                'fingers': fingers_with_count
            })
        return finger_states

    def __del__(self):
        if hasattr(self, 'hands') and self.hands:
            try:
                self.hands.close()
            except Exception:
                pass
        if hasattr(self, 'recognizer'):
            try:
                self.recognizer.close()
            except Exception:
                pass