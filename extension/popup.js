/**
 * SignBridge – Popup Script
 *
 * Handles:
 *  • Health-check ping to backend
 *  • Saving / loading settings via chrome.storage
 *  • Toggling the in-page panel via message relay
 */

document.addEventListener('DOMContentLoaded', () => {
  const $backendUrl = document.getElementById('backend-url');
  const $langSelect = document.getElementById('lang-select');
  const $btnSave    = document.getElementById('btn-save');
  const $btnToggle  = document.getElementById('btn-toggle');
  const $statusDot  = document.getElementById('status-dot');
  const $statusText = document.getElementById('status-text');
  const $toast      = document.getElementById('toast');

  // ── Load saved settings ──────────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
    if (chrome.runtime.lastError) return;
    if (res?.backendUrl)       $backendUrl.value = res.backendUrl;
    if (res?.targetLanguage)   $langSelect.value = res.targetLanguage;
    pingBackend(res?.backendUrl || $backendUrl.value);
  });

  // ── Health check ─────────────────────────────────────────────────────
  async function pingBackend(url) {
    try {
      const res = await fetch(`${url}/api/health`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        $statusDot.className = 'status-dot connected';
        $statusText.textContent = 'Backend connected';
      } else {
        throw new Error('Non-OK response');
      }
    } catch {
      $statusDot.className = 'status-dot disconnected';
      $statusText.textContent = 'Backend unreachable';
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────
  $btnSave.addEventListener('click', () => {
    const payload = {
      backendUrl: $backendUrl.value.replace(/\/+$/, ''),
      targetLanguage: $langSelect.value,
    };

    chrome.runtime.sendMessage({ type: 'SET_STATE', payload }, () => {
      // Also relay to active content script
      chrome.runtime.sendMessage({
        type: 'RELAY_TO_CONTENT',
        payload: {
          type: 'UPDATE_SETTINGS',
          backendUrl: payload.backendUrl,
          targetLanguage: payload.targetLanguage,
        },
      });

      // Ping new URL
      pingBackend(payload.backendUrl);

      // Toast
      showToast('Settings saved ✓');
    });
  });

  // ── Toggle Panel ─────────────────────────────────────────────────────
  $btnToggle.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'RELAY_TO_CONTENT',
      payload: { type: 'TOGGLE_PANEL' },
    });
    showToast('Panel toggled');
  });

  // ── Toast helper ─────────────────────────────────────────────────────
  function showToast(text) {
    $toast.textContent = text;
    $toast.classList.add('show');
    setTimeout(() => $toast.classList.remove('show'), 1800);
  }
});
