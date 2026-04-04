const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ── Check Backend Health ──
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Predict Sign from Frame ──
// NEVER returns mock/demo data. Returns null prediction if backend is unavailable.
export async function predictSign(imageDataUrl) {
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    const sign = data.data?.sign ?? data.sign;
    const confidence = data.data?.confidence ?? data.confidence ?? 0;

    // If no sign was detected, return null prediction
    if (!sign || sign === 'unknown' || sign === 'null' || sign === 'None') {
      return { prediction: null, confidence: 0, translations: {} };
    }

    return {
      prediction: sign,
      confidence: confidence,
      isMock: false,
      translations: {
        hindi: data.data?.hindi ?? data.hindi ?? '',
        english: sign,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Backend request failed:', error.message);
    // Return null — do NOT fall back to mock data
    return { prediction: null, confidence: 0, translations: {}, error: error.message };
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
