// popup.js — FormGenius Extension Popup Logic

const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKey');
const solveBtn = document.getElementById('solveBtn');
const saveBtn = document.getElementById('saveBtn');
const statusDot = document.getElementById('statusDot');
const statusBanner = document.getElementById('statusBanner');
const statusText = document.getElementById('statusText');
const solvedCount = document.getElementById('solvedCount');
const questionsCount = document.getElementById('questionsCount');

// ── Toast Notification ──
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Load saved data ──
async function init() {
  const data = await chrome.storage.sync.get(['apiKey', 'solvedForms', 'totalQuestions']);

  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
  }

  solvedCount.textContent = data.solvedForms || 0;
  questionsCount.textContent = data.totalQuestions || 0;

  // Check if current tab is a Google Form
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('docs.google.com/forms')) {
      statusDot.className = 'status-dot active';
      statusBanner.className = 'status-banner detected';
      statusBanner.querySelector('.status-icon').textContent = '✅';
      statusText.textContent = 'Google Form detected! Ready to solve.';
      solveBtn.disabled = false;
    } else {
      statusDot.className = 'status-dot inactive';
      statusBanner.className = 'status-banner';
      statusBanner.querySelector('.status-icon').textContent = '⚠️';
      statusText.textContent = 'No Google Form active';
      solveBtn.disabled = true;
    }
  } catch (e) {
    statusText.textContent = 'Could not detect page.';
  }
}

// ── Toggle API Key visibility ──
toggleKeyBtn.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyBtn.textContent = '🙈';
  } else {
    apiKeyInput.type = 'password';
    toggleKeyBtn.textContent = '👁';
  }
});

// ── Save API Key ──
saveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showToast('❌ Please enter an API key', 'error');
    return;
  }
  if (!key.startsWith('AIza')) {
    showToast('⚠️ Key should start with AIza...', 'error');
    return;
  }
  await chrome.storage.sync.set({ apiKey: key });
  showToast('✅ API Key saved!', 'success');
});

// ── Solve Form Button ──
solveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showToast('❌ Please enter & save your API key first', 'error');
    return;
  }

  // Save key first
  await chrome.storage.sync.set({ apiKey: key });

  // Show loading state
  solveBtn.disabled = true;
  solveBtn.innerHTML = `<span class="spinner"></span><span>Solving...</span>`;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'SOLVE_FORM',
      apiKey: key
    });

    if (response && response.success) {
      const q = response.questionsAnswered || 0;
      showToast(`✅ ${q} questions answered!`, 'success');

      // Update stats
      const data = await chrome.storage.sync.get(['solvedForms', 'totalQuestions']);
      const newForms = (data.solvedForms || 0) + 1;
      const newQuestions = (data.totalQuestions || 0) + q;
      await chrome.storage.sync.set({ solvedForms: newForms, totalQuestions: newQuestions });
      solvedCount.textContent = newForms;
      questionsCount.textContent = newQuestions;
    } else {
      showToast(`❌ ${response?.error || 'Unknown error'}`, 'error');
    }
  } catch (err) {
    console.error('FormGenius Error:', err);
    showToast('❌ Could not connect to form. Reload the page.', 'error');
  } finally {
    solveBtn.disabled = false;
    solveBtn.innerHTML = `<span class="btn-icon">⚡</span><span>Solve Form Now</span>`;
  }
});

// ── Initialize ──
init();
