/**
 * SignBridge – Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 *  1. Toggle the floating panel when the extension icon is clicked.
 *  2. Relay messages between the popup and content script.
 *  3. Store panel-visible state in chrome.storage.local.
 */

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SignBridge] Extension installed.');
    chrome.storage.local.set({
      panelVisible: false,
      backendUrl: 'http://localhost:5000',
      targetLanguage: 'en',
    });
  }
});

// ── Icon click → toggle panel ────────────────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url?.startsWith('https://meet.google.com')) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
  } catch {
    console.warn('[SignBridge] Content script not ready; injecting manually…');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['panel.css'],
    });
    // Retry after injection
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
    }, 500);
  }
});

// ── Message relay ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_STATE': {
      chrome.storage.local.get(
        ['panelVisible', 'backendUrl', 'targetLanguage'],
        (data) => sendResponse(data)
      );
      return true; // keep channel open for async response
    }

    case 'SET_STATE': {
      chrome.storage.local.set(message.payload, () => {
        sendResponse({ ok: true });
      });
      return true;
    }

    case 'RELAY_TO_CONTENT': {
      // Forward from popup → active tab's content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, message.payload);
        }
      });
      break;
    }
  }
});
