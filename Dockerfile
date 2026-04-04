# SignBridge Backend — Dockerfile
# Optimized for MediaPipe/OpenCV on Render/CloudRun

FROM python:3.11-slim-bullseye

# ── System Dependencies ─────────────────────────────────────────────
# libgl1 is required by OpenCV (cv2)
# libglib2.0-0 is required by MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# ── App Setup ───────────────────────────────────────────────────────
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure weights/models are present (if needed)
# MediaPipe gestures.task is used by services/hand_detector.py
# If NOT in git, they must be uploaded/copied — assuming they ARE in git.

# ── Environment ─────────────────────────────────────────────────────
# Render/Heroku/Railway provide PORT env variable
ENV PORT=10000
ENV FLASK_ENV=production

# ── Execution ───────────────────────────────────────────────────────
# Use gunicorn with a single worker for memory efficiency (free plan limit is 512MB)
CMD gunicorn app:app --bind 0.0.0.0:$PORT --log-level info
