const API_BASE = 'http://localhost:5000/api';

// ── Mock Data ──
const MOCK_SIGNS = [
  { sign: 'Hello', confidence: 0.94, hindi: 'नमस्ते', spanish: 'Hola' },
  { sign: 'Thank You', confidence: 0.89, hindi: 'धन्यवाद', spanish: 'Gracias' },
  { sign: 'Please', confidence: 0.91, hindi: 'कृपया', spanish: 'Por favor' },
  { sign: 'Good Morning', confidence: 0.87, hindi: 'सुप्रभात', spanish: 'Buenos días' },
  { sign: 'How are you?', confidence: 0.85, hindi: 'आप कैसे हैं?', spanish: '¿Cómo estás?' },
  { sign: 'My name is', confidence: 0.82, hindi: 'मेरा नाम है', spanish: 'Mi nombre es' },
  { sign: 'Yes', confidence: 0.96, hindi: 'हाँ', spanish: 'Sí' },
  { sign: 'No', confidence: 0.95, hindi: 'नहीं', spanish: 'No' },
  { sign: 'Help', confidence: 0.88, hindi: 'मदद', spanish: 'Ayuda' },
  { sign: 'Water', confidence: 0.90, hindi: 'पानी', spanish: 'Agua' },
];

let mockIndex = 0;

function getRandomMock() {
  const mock = MOCK_SIGNS[mockIndex % MOCK_SIGNS.length];
  mockIndex++;
  return {
    prediction: mock.sign,
    confidence: mock.confidence + (Math.random() * 0.06 - 0.03),
    translations: {
      hindi: mock.hindi,
      spanish: mock.spanish,
      english: mock.sign,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Check Backend Health ──
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Predict Sign from Frame ──
export async function predictSign(imageDataUrl) {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    // Normalize backend response shape to what the frontend expects
    return {
      prediction: data.data?.sign ?? data.sign,
      confidence: data.data?.confidence ?? data.confidence ?? 0,
      translations: {
        hindi: data.data?.hindi ?? data.hindi ?? '',
        english: data.data?.sign ?? data.sign ?? '',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Backend unavailable, using mock data:', error.message);
    return getRandomMock();
  }
}

// ── Translate Text ──
export async function translateText(text, targetLang = 'hi') {
  try {
    const res = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_lang: 'en', target_lang: targetLang }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.data ?? data;
  } catch (error) {
    console.warn('Translation unavailable, returning original:', error.message);
    return { translated_text: text, source_language: 'en', target_language: targetLang };
  }
}

// ── Generate Sign Video ──
export async function generateSign(text) {
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.data?.video_base64 ?? null;
  } catch (error) {
    console.warn('Sign generation unavailable:', error.message);
    return null;
  }
}

