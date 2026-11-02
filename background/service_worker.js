// service_worker.js — FormGenius Background Service Worker

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'solve-form') {
    console.log('[FormGenius] Keyboard shortcut triggered: solve-form');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url || !tab.url.includes('docs.google.com/forms')) {
        console.warn('[FormGenius] Not a Google Form tab');
        return;
      }

      // Get API key from storage
      const { apiKey } = await chrome.storage.sync.get('apiKey');

      if (!apiKey) {
        console.warn('[FG] No API key set. Open popup to configure.');
        return;
      }

      // Send message to content script to start solving
      await chrome.tabs.sendMessage(tab.id, {
        action: 'SOLVE_FORM',
        apiKey: apiKey
      });

    } catch (err) {
      console.error('[FormGenius] Error in service worker:', err);
    }
  }
});

// Listen for messages from content script (e.g., stats updates)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPDATE_STATS') {
    chrome.storage.sync.get(['solvedForms', 'totalQuestions'], (data) => {
      const newForms = (data.solvedForms || 0) + 1;
      const newQuestions = (data.totalQuestions || 0) + (message.questionsCount || 0);
      chrome.storage.sync.set({ solvedForms: newForms, totalQuestions: newQuestions });
    });
  }
  // Keep message channel open for async
  return true;
});

console.log('[FormGenius] Service Worker initialized ✦');
