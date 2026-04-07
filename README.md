# 🤟 SignBridge

> *"63 million voices. Finally heard."*

Real-time two-way Indian Sign Language (ISL) communication assistant.
Built for 63 million deaf and hard-of-hearing individuals in India.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-orange)
![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-purple)
![React](https://img.shields.io/badge/React-18-cyan)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚨 The Problem

Over 63 million people in India are deaf or hard of hearing.
They use Indian Sign Language (ISL) to communicate —
but fewer than 1% of the hearing population understands it.

Every hospital visit, classroom, job interview, and emergency
is a communication failure. Existing tools either:

- Support only ASL — not ISL
- Work one-way only — no response
- Require expensive hardware or app installs
- Don't work in real time

---

## 💡 What SignBridge Does

### 🤟 Sign → Text
Webcam detects ISL gestures in real time using
MediaPipe's pre-trained neural network (trained on 30K real hands).
Converts instantly to Hindi, English, Spanish, or Bengali.

### 💬 Text → Sign
Type or speak anything.
Claude Sonnet 4.6 converts it to correct ISL grammar
(ISL uses SOV structure — different from English).
An animated avatar performs the signs on screen.

### 🌍 Multilingual
Hindi • English • Spanish • Bengali
More languages via Claude API.

---

## ⚡ What Makes It Different

| Feature | Others | SignBridge |
|---|---|---|
| ISL-first (not ASL) | ❌ | ✅ |
| Two-way communication | ❌ | ✅ |
| Real-time webcam | Some | ✅ |
| Multilingual output | ❌ | ✅ |
| ISL grammar conversion | ❌ | ✅ |
| No install needed | ❌ | ✅ |
| LLM-powered | ❌ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Hand Detection | MediaPipe Gesture Recognizer | Pre-trained on 30K hands, production-grade, real-time |
| Language AI | Claude Sonnet 4.6 (Anthropic) | ISL grammar conversion + multilingual translation |
| Backend | Flask + Gunicorn | Lightweight Python API, easy deployment |
| Frontend | React 18 + Vite | Fast, component-based UI |
| Deployment | Render + Vercel | Free tier, instant CI/CD |

---

## 🏗️ Architecture
Webcam Frame
↓
MediaPipe Gesture Recognizer (.task model)
↓ gesture name + confidence
Sign Classifier (ISL mapping)
↓ ISL sign + hindi
Claude Sonnet 4.6 (translation + ISL gloss)
↓
Frontend (React) — live result display

---

## 📁 Project Structure
signbridge/
├── backend/
│   ├── app.py                  ← Flask API (4 endpoints)
│   ├── requirements.txt
│   ├── Procfile                ← Render deployment
│   ├── .env.example
│   └── services/
│       ├── hand_detector.py    ← MediaPipe pre-trained model
│       ├── sign_classifier.py  ← ISL sign mapping (20 signs)
│       └── translator.py       ← Claude API integration
└── frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
├── main.jsx
└── App.jsx             ← Full UI (webcam + avatar)

---

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # add your ANTHROPIC_API_KEY
python app.py
```
→ http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
→ http://localhost:5173

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| POST | `/api/predict` | Webcam frame → ISL sign + translation |
| POST | `/api/translate` | Text → ISL gloss + sign sequence |
| GET | `/api/signs` | List all 20 supported signs |

### POST /api/predict
```json
// Request
{ "image": "<base64 string>" }

// Response
{
  "sign": "hello",
  "confidence": 0.94,
  "hindi": "नमस्ते",
  "translation": "नमस्ते",
  "hands_detected": 1,
  "method": "mediapipe_pretrained"
}
```

### POST /api/translate
```json
// Request
{ "text": "How are you", "target_lang": "hi" }

// Response
{
  "isl_gloss": "YOU HOW",
  "isl_signs": ["you", "how"],
  "translation": "आप कैसे हैं"
}
```

---

## 🤟 Supported Gestures

| Gesture | ISL Sign | Hindi |
|---|---|---|
| 👍 Thumb Up | good | अच्छा |
| 👎 Thumb Down | bad | बुरा |
| 👋 Open Palm | hello | नमस्ते |
| ✊ Closed Fist | yes | हाँ |
| ✌️ Victory | peace | शांति |
| 🤟 ILoveYou | love | प्यार |
| ☝️ Pointing Up | one | एक |

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Backend | Render | https://signbridge-backend.onrender.com |
| Frontend | Vercel | https://signbridge.vercel.app |

---

## 👥 Team

Built at hackathon by a 3-person team in 24 hours.

| Role | Responsibility |
|---|---|
| AI/ML Engineer | MediaPipe pipeline + Claude integration |
| Frontend Engineer | React UI + webcam + avatar |
| Full Stack | Chrome Extension + deployment |

---

## 📊 Impact

- 🎯 63 million deaf/HoH individuals in India
- 🏥 Healthcare — doctor-patient communication
- 🏫 Education — classroom accessibility
- 💼 Workplace — inclusive hiring
- 🚨 Emergency — critical situation communication

---

## 🔮 What's Next

- [ ] Fine-tune MediaPipe model on ISL-specific dataset (INCLUDE — IIT Delhi)
- [ ] Google Meet Chrome Extension overlay
- [ ] Mobile app (React Native)
- [ ] Crowdsourced ISL dataset collection
- [ ] Support for 100+ ISL signs
- [ ] Facial expression recognition (ISL grammar uses eyebrows)

---

## 📄 License

MIT License — see LICENSE file.

---

> Built with ❤️ for 63 million ISL users in India
> Powered by MediaPipe + Claude Sonnet 4.6
