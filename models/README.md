# SignBridge — ISL Gesture Models

This directory holds trained ML models for Indian Sign Language classification.

## Current Approach

The backend uses a **hybrid classification system**:

1. **Rule-based classifier** (default) — Matches finger extension patterns against a database of 20+ common ISL signs. Zero latency, works out of the box.

2. **ML model classifier** (optional) — Load a trained `scikit-learn` model for higher accuracy on complex/dynamic signs.

## Training Your Own Model

```bash
# 1. Collect landmark data via /api/detect-landmarks endpoint
# 2. Label the data with sign names
# 3. Train a classifier:

python train.py --data collected_landmarks.csv --output gesture_model.pkl
```

## Supported Model Formats

| Format | Extension | Library |
|--------|-----------|---------|
| Scikit-learn | `.pkl` | joblib |
| TensorFlow Lite | `.tflite` | tflite-runtime |
| ONNX | `.onnx` | onnxruntime |

## File Naming Convention

```
gesture_model_v{version}_{date}.pkl
```

> **Note**: Model files (`.pkl`, `.h5`, `.pt`, `.onnx`) are excluded from git via `.gitignore`. Use Git LFS or external storage for model distribution.
