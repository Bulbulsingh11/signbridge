"""
SignBridge - MediaPipe Hand Landmark Detection Service

Detects hand landmarks from video frames using Google MediaPipe.
Returns normalized 3D coordinates for 21 hand landmarks per hand.

Compatible with MediaPipe >= 0.10.30 (new Task API).
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

MEDIAPIPE_AVAILABLE = False
MEDIAPIPE_LEGACY = False

try:
    import mediapipe as mp
    # Check if legacy solutions API exists
    if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'hands'):
        MEDIAPIPE_AVAILABLE = True
        MEDIAPIPE_LEGACY = True
        logger.info("MediaPipe loaded (legacy solutions API)")
    else:
        # New Task API (0.10.30+)
        MEDIAPIPE_AVAILABLE = True
        MEDIAPIPE_LEGACY = False
        logger.info("MediaPipe loaded (new Task API)")
except ImportError:
    logger.warning("MediaPipe not installed. Hand detection will be unavailable.")


class HandDetector:
    """
    Hand landmark detection using MediaPipe Hands.
    
    Detects up to 2 hands and returns 21 landmarks each with
    (x, y, z) normalized coordinates.
    """

    LANDMARK_NAMES = [
        'WRIST',
        'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
        'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
        'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
        'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
        'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP',
    ]

    def __init__(self, max_hands=2, min_detection_conf=0.7, min_tracking_conf=0.5):
        self.max_hands = max_hands
        self.min_detection_conf = min_detection_conf
        self.min_tracking_conf = min_tracking_conf
        self._ready = False
        self._use_legacy = MEDIAPIPE_LEGACY

        if not MEDIAPIPE_AVAILABLE:
            self.hands = None
            logger.error("HandDetector could not initialize — MediaPipe missing")
            return

        if self._use_legacy:
            self._init_legacy()
        else:
            self._init_task_api()

    def _init_legacy(self):
        """Initialize with legacy mp.solutions.hands API"""
        try:
            self.mp_hands = mp.solutions.hands
            self.mp_drawing = mp.solutions.drawing_utils
            self.mp_drawing_styles = mp.solutions.drawing_styles
            self.hands = self.mp_hands.Hands(
                static_image_mode=True,
                max_num_hands=self.max_hands,
                min_detection_confidence=self.min_detection_conf,
                min_tracking_confidence=self.min_tracking_conf,
            )
            self._ready = True
            logger.info(
                f"HandDetector initialized (legacy) | max_hands={self.max_hands}"
            )
        except Exception as e:
            logger.error(f"Legacy API init failed: {e}")
            self._try_task_api_fallback()

    def _init_task_api(self):
        """Initialize with new MediaPipe Task API (0.10.30+)"""
        try:
            from mediapipe.tasks import python as mp_tasks
            from mediapipe.tasks.python import vision

            # Download the hand landmarker model
            import urllib.request
            import os
            import tempfile

            model_path = os.path.join(
                tempfile.gettempdir(), 'hand_landmarker.task'
            )

            if not os.path.exists(model_path):
                logger.info("Downloading hand landmarker model...")
                url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
                urllib.request.urlretrieve(url, model_path)
                logger.info("Model downloaded successfully")

            base_options = mp_tasks.BaseOptions(
                model_asset_path=model_path
            )
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                num_hands=self.max_hands,
                min_hand_detection_confidence=self.min_detection_conf,
                min_tracking_confidence=self.min_tracking_conf,
            )
            self.hands = vision.HandLandmarker.create_from_options(options)
            self._ready = True
            self._use_legacy = False
            logger.info(
                f"HandDetector initialized (Task API) | max_hands={self.max_hands}"
            )
        except Exception as e:
            logger.error(f"Task API init failed: {e}")
            self._ready = False

    def _try_task_api_fallback(self):
        """Fallback: try Task API if legacy fails"""
        logger.info("Trying Task API as fallback...")
        self._use_legacy = False
        self._init_task_api()

    def is_ready(self) -> bool:
        return self._ready

    def detect(self, frame: np.ndarray):
        """
        Detect hand landmarks in a BGR image frame.

        Args:
            frame: OpenCV BGR image (numpy array)

        Returns:
            tuple: (landmarks_list, annotated_frame, hand_count)
        """
        if not self._ready:
            logger.warning("HandDetector not ready")
            return [], None, 0

        if self._use_legacy:
            return self._detect_legacy(frame)
        else:
            return self._detect_task_api(frame)

    def _detect_legacy(self, frame):
        """Detect using legacy solutions API"""
        import cv2

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        results = self.hands.process(rgb_frame)
        rgb_frame.flags.writeable = True
        annotated_frame = frame.copy()

        if not results.multi_hand_landmarks:
            return [], annotated_frame, 0

        all_landmarks = []
        hand_count = len(results.multi_hand_landmarks)

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
                'landmarks': []
            }

            for i, landmark in enumerate(hand_landmarks.landmark):
                hand_data['landmarks'].append({
                    'id': i,
                    'name': self.LANDMARK_NAMES[i],
                    'x': round(landmark.x, 6),
                    'y': round(landmark.y, 6),
                    'z': round(landmark.z, 6),
                })

            all_landmarks.append(hand_data)

        logger.info(f"Detected {hand_count} hand(s)")
        return all_landmarks, annotated_frame, hand_count

    def _detect_task_api(self, frame):
        """Detect using new Task API"""
        import cv2

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        result = self.hands.detect(mp_image)
        annotated_frame = frame.copy()

        if not result.hand_landmarks:
            return [], annotated_frame, 0

        all_landmarks = []
        hand_count = len(result.hand_landmarks)

        for idx, hand_lms in enumerate(result.hand_landmarks):
            # Get handedness
            handedness_label = 'Right'
            handedness_conf = 0.0
            if result.handedness and idx < len(result.handedness):
                h = result.handedness[idx]
                if h:
                    handedness_label = h[0].category_name
                    handedness_conf = round(h[0].score, 4)

            hand_data = {
                'hand_index': idx,
                'handedness': handedness_label,
                'handedness_confidence': handedness_conf,
                'landmarks': []
            }

            for i, landmark in enumerate(hand_lms):
                hand_data['landmarks'].append({
                    'id': i,
                    'name': self.LANDMARK_NAMES[i] if i < len(self.LANDMARK_NAMES) else f'POINT_{i}',
                    'x': round(landmark.x, 6),
                    'y': round(landmark.y, 6),
                    'z': round(landmark.z, 6),
                })

            all_landmarks.append(hand_data)

        logger.info(f"Detected {hand_count} hand(s)")
        return all_landmarks, annotated_frame, hand_count

    def extract_feature_vector(self, landmarks_list):
        """Convert landmarks to a flat feature vector for ML classification."""
        features = []
        for hand_data in landmarks_list:
            hand_features = []
            for lm in hand_data['landmarks']:
                hand_features.extend([lm['x'], lm['y'], lm['z']])
            features.append(hand_features)
        return np.array(features, dtype=np.float32)

    def get_finger_states(self, landmarks_list):
        """Determine which fingers are extended for each detected hand."""
        finger_states = []
        for hand_data in landmarks_list:
            lm = hand_data['landmarks']
            is_right = hand_data['handedness'] == 'Right'

            fingers = {
                'thumb': self._is_thumb_extended(lm, is_right),
                'index': self._is_finger_extended(lm, 5, 8),
                'middle': self._is_finger_extended(lm, 9, 12),
                'ring': self._is_finger_extended(lm, 13, 16),
                'pinky': self._is_finger_extended(lm, 17, 20),
            }
            fingers['count'] = sum(fingers.values())

            finger_states.append({
                'hand_index': hand_data['hand_index'],
                'handedness': hand_data['handedness'],
                'fingers': fingers
            })
        return finger_states

    @staticmethod
    def _is_thumb_extended(landmarks, is_right):
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        if is_right:
            return thumb_tip['x'] < thumb_ip['x']
        return thumb_tip['x'] > thumb_ip['x']

    @staticmethod
    def _is_finger_extended(landmarks, mcp_idx, tip_idx):
        return landmarks[tip_idx]['y'] < landmarks[mcp_idx]['y']

    def __del__(self):
        if hasattr(self, 'hands') and self.hands:
            try:
                self.hands.close()
            except Exception:
                pass
