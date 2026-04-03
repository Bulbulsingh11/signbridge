/**
 * SignBridge – Content Script
 *
 * Injected into meet.google.com pages. Responsibilities:
 *  1. Build and inject the floating SignBridge panel into the DOM.
 *  2. Access the user's webcam and stream it to a <video> element.
 *  3. Capture video frames & send to the Flask backend for ISL prediction.
 *  4. Display translated subtitles in the panel.
 *  5. Support drag-to-reposition, minimise/close, and language switching.
 */

(() => {
  'use strict';

  // ── Guard: inject only once ──────────────────────────────────────────
  if (document.getElementById('signbridge-panel')) {
    // If a previous instance exists, clean up any lingering intervals to avoid duplicates.
    if (window.__signbridge_cleanup__) {
      window.__signbridge_cleanup__();
    }
    return;
  }

  // ── Ensure DOM is ready before proceeding ──────────────────────────────
  const initSignBridge = () => {
    // ── State ────────────────────────────────────────────────────────────
    const state = {
      backendUrl: 'http://localhost:5000',
      targetLang: 'en',
      isCapturing: false,
      stream: null,
      captureInterval: null,
      panelVisible: true,
      minimised: false,
    };

    // ── Helpers ──────────────────────────────────────────────────────────
    const qs = (sel, ctx = document) => ctx.querySelector(sel);
    const ce = (tag) => document.createElement(tag);
    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // ── SVG Icons (inline, no external deps) ─────────────────────────────
    const ICONS = {
      camera: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
      play: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
      stop: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
      minus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      waveform: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="8" x2="4" y2="16"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="16" y1="7" x2="16" y2="17"/><line x1="20" y1="10" x2="20" y2="14"/></svg>`,
      hand: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v1M14 7V4a2 2 0 0 0-4 0v6M10 5.5V3a2 2 0 0 0-4 0v9"/><path d="M6 12a2 2 0 0 0-2 2v1c0 4 3.5 7 8 7s8-3 8-7v-5a2 2 0 0 0-4 0"/></svg>`,
      clear: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    };

    // ── Build DOM ────────────────────────────────────────────────────────
    function buildPanel() {
      const panel = ce('div');
      panel.id = 'signbridge-panel';

      panel.innerHTML = `
        <!-- Header / Drag Handle -->
        <div class="sb-header" id="sb-drag-handle">
          <div class="sb-logo">
            <span class="sb-logo-dot"></span>
            SignBridge
          </div>
          <div class="sb-header-actions">
            <button id="sb-btn-min" title="Minimise">${ICONS.minus}</button>
            <button id="sb-btn-close" title="Close panel">${ICONS.x}</button>
          </div>
        </div>

        <!-- Webcam -->
        <div class="sb-webcam-wrapper" id="sb-webcam-wrapper">
          <div class="sb-webcam-placeholder" id="sb-cam-placeholder">
            ${ICONS.hand}
            <span>Click <strong>Start</strong> to begin ISL detection</span>
          </div>
          <video id="sb-webcam-video" autoplay playsinline muted style="display:none;"></video>
          <div class="sb-status-badge sb-idle" id="sb-status-badge">
            <span class="sb-status-dot"></span>
            <span id="sb-status-label">Idle</span>
          </div>
          <div class="sb-detected-sign" id="sb-detected-sign" style="display:none;"></div>
        </div>

        <!-- Controls -->
        <div class="sb-controls">
          <div style="display:flex;gap:6px;">
            <button class="sb-btn sb-btn-primary" id="sb-btn-start">${ICONS.play} Start</button>
            <button class="sb-btn sb-btn-danger" id="sb-btn-stop" style="display:none;">${ICONS.stop} Stop</button>
            <button class="sb-btn sb-btn-ghost" id="sb-btn-clear" title="Clear subtitles">${ICONS.clear}</button>
          </div>
          <select class="sb-lang-select" id="sb-lang-select">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="bn">বাংলা</option>
            <option value="mr">मराठी</option>
            <option value="gu">ગુજરાતી</option>
          </select>
        </div>

        <!-- Subtitle Box -->
        <div class="sb-subtitle-box" id="sb-subtitle-box">
          <div class="sb-empty-state" id="sb-empty-state">
            ${ICONS.waveform}
            <span>Translated signs will appear here</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="sb-footer">
          <span>SignBridge v1.0</span>
          <span id="sb-fps-counter"></span>
        </div>
      `;

      document.body.appendChild(panel);
      return panel;
    }

    const panel = buildPanel();

  // Register cleanup to avoid duplicate intervals if script runs again
  window.__signbridge_cleanup__ = () => {
    stopCapture();
    if (state.captureInterval) { clearInterval(state.captureInterval); state.captureInterval = null; }
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
  };

    // ── Element refs ─────────────────────────────────────────────────────
    const $video       = qs('#sb-webcam-video');
    const $placeholder = qs('#sb-cam-placeholder');
    const $btnStart    = qs('#sb-btn-start');
    const $btnStop     = qs('#sb-btn-stop');
    const $btnClear    = qs('#sb-btn-clear');
    const $btnMin      = qs('#sb-btn-min');
    const $btnClose    = qs('#sb-btn-close');
    const $langSelect  = qs('#sb-lang-select');
    const $statusBadge = qs('#sb-status-badge');
    const $statusLabel = qs('#sb-status-label');
    const $detectedSign = qs('#sb-detected-sign');
    const $subtitleBox = qs('#sb-subtitle-box');
    const $emptyState  = qs('#sb-empty-state');
    const $fpsCounter  = qs('#sb-fps-counter');

    // ── Drag-to-move ────────────────────────────────────────────────────
    (() => {
      const handle = qs('#sb-drag-handle');
      let dragging = false, offsetX = 0, offsetY = 0;

      handle.addEventListener('mousedown', (e) => {
        dragging = true;
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        panel.style.transition = 'none';
      });

      document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const x = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, e.clientX - offsetX));
        const y = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, e.clientY - offsetY));
        panel.style.left   = x + 'px';
        panel.style.top    = y + 'px';
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
      });

      document.addEventListener('mouseup', () => {
        if (dragging) {
          dragging = false;
          panel.style.transition = '';
        }
      });
    })();

    // ── Minimise / Close ────────────────────────────────────────────────
    $btnMin.addEventListener('click', () => {
      state.minimised = !state.minimised;
      panel.classList.toggle('sb-minimised', state.minimised);
    });

    $btnClose.addEventListener('click', () => {
      stopCapture();
      panel.classList.add('sb-hidden');
      state.panelVisible = false;
    });

    // ── Language selector ────────────────────────────────────────────────
    $langSelect.addEventListener('change', (e) => {
      state.targetLang = e.target.value;
      chrome.runtime.sendMessage({
        type: 'SET_STATE',
        payload: { targetLanguage: state.targetLang },
      });
    });

    // ── Webcam Start / Stop ──────────────────────────────────────────────
    async function startCapture() {
      try {
        state.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        $video.srcObject = state.stream;
        $video.style.display = 'block';
        $placeholder.style.display = 'none';

        $btnStart.style.display = 'none';
        $btnStop.style.display  = 'inline-flex';

        $statusBadge.className = 'sb-status-badge sb-live';
        $statusLabel.textContent = 'Live';

        state.isCapturing = true;
        beginFrameLoop();
      } catch (err) {
        console.error('[SignBridge] Camera access denied:', err);
        $statusLabel.textContent = 'Camera denied';
      }
    }

    function stopCapture() {
      state.isCapturing = false;
      if (state.captureInterval) {
        clearInterval(state.captureInterval);
        state.captureInterval = null;
      }
      if (state.stream) {
        state.stream.getTracks().forEach((t) => t.stop());
        state.stream = null;
      }
      $video.srcObject = null;
      $video.style.display = 'none';
      $placeholder.style.display = 'flex';

      $btnStart.style.display = 'inline-flex';
      $btnStop.style.display  = 'none';

      $statusBadge.className = 'sb-status-badge sb-idle';
      $statusLabel.textContent = 'Idle';
      $detectedSign.style.display = 'none';
    }

    $btnStart.addEventListener('click', startCapture);
    $btnStop.addEventListener('click', stopCapture);

    // ── Frame capture → backend ─────────────────────────────────────────
    function beginFrameLoop() {
      const canvas = ce('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      let frameCount = 0;
      let lastFpsUpdate = performance.now();

      state.captureInterval = setInterval(async () => {
        if (!state.isCapturing) return;

        ctx.drawImage($video, 0, 0, 640, 480);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // FPS counter
        frameCount++;
        const elapsed = performance.now() - lastFpsUpdate;
        if (elapsed >= 1000) {
          $fpsCounter.textContent = `${Math.round(frameCount / (elapsed / 1000))} FPS`;
          frameCount = 0;
          lastFpsUpdate = performance.now();
        }

        try {
          const res = await fetch(`${state.backendUrl}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: dataUrl,
              target_language: state.targetLang,
            }),
          });

          if (!res.ok) return;
          const data = await res.json();

          if (data.prediction && data.confidence > 0.6) {
            showDetectedSign(data.prediction);
            addSubtitle(data.translation || data.prediction, data.confidence);
          }
        } catch {
          // Backend unavailable – silent fail, keep capturing
        }
      }, 500); // ~2 predictions/sec to stay lightweight
    }

    // ── UI updates ──────────────────────────────────────────────────────
    let signTimeout;
    function showDetectedSign(sign) {
      $detectedSign.textContent = sign;
      $detectedSign.style.display = 'block';
      clearTimeout(signTimeout);
      signTimeout = setTimeout(() => {
        $detectedSign.style.display = 'none';
      }, 2500);
    }

    const subtitleHistory = [];
    function addSubtitle(text, confidence) {
      // De-bounce identical consecutive subtitles
      if (subtitleHistory.length && subtitleHistory[subtitleHistory.length - 1].text === text) return;

      subtitleHistory.push({ text, time: now() });
      if (subtitleHistory.length > 50) subtitleHistory.shift();

      $emptyState.style.display = 'none';

      const entry = ce('div');
      entry.className = 'sb-subtitle-entry';
      entry.innerHTML = `
        <div class="sb-sub-time">${now()} · ${Math.round(confidence * 100)}%</div>
        <div>${text}</div>
      `;
      $subtitleBox.appendChild(entry);
      $subtitleBox.scrollTop = $subtitleBox.scrollHeight;
    }

    $btnClear.addEventListener('click', () => {
      subtitleHistory.length = 0;
      $subtitleBox.innerHTML = '';
      const es = ce('div');
      es.className = 'sb-empty-state';
      es.id = 'sb-empty-state';
      es.innerHTML = `${ICONS.waveform}<span>Translated signs will appear here</span>`;
      $subtitleBox.appendChild(es);
    });

    // ── Message listener (from popup / background) ──────────────────────
    chrome.runtime.onMessage.addListener((msg) => {
      switch (msg.type) {
        case 'TOGGLE_PANEL':
          state.panelVisible = !state.panelVisible;
          panel.classList.toggle('sb-hidden', !state.panelVisible);
          if (state.panelVisible) {
            state.minimised = false;
            panel.classList.remove('sb-minimised');
          }
          break;

        case 'UPDATE_SETTINGS':
          if (msg.backendUrl) state.backendUrl = msg.backendUrl;
          if (msg.targetLanguage) {
            state.targetLang = msg.targetLanguage;
            $langSelect.value = state.targetLang;
          }
          break;
      }
    });

    // ── Load persisted settings ─────────────────────────────────────────
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res?.backendUrl) state.backendUrl = res.backendUrl;
      if (res?.targetLanguage) {
        state.targetLang = res.targetLanguage;
        $langSelect.value = state.targetLang;
      }
    });

    console.log('[SignBridge] Panel injected into Google Meet ✓');
  };

  if (document.body) {
    initSignBridge();
  } else {
    document.addEventListener('DOMContentLoaded', initSignBridge);
  }
})();
