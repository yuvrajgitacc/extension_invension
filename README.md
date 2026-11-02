# FormGenius ✦ — AI Google Form Solver

> **Solve any Google Form instantly using AI. Just press `Alt+Shift+S`.**

A Chrome Extension that uses Google Gemini AI to automatically read, understand, and fill Google Forms for you — MCQs, short answers, checkboxes, and more.

---

## 🚀 Installation (Developer Mode)

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer Mode** (toggle top-right)
3. Click **"Load unpacked"**
4. Select the `formgenius-extension/` folder
5. Done! The ✦ icon appears in your toolbar.

---

## ⚙️ Setup

1. Click the **FormGenius** extension icon
2. Paste your **Gemini API Key** (`AIza...`)
   - Get a free key at: https://aistudio.google.com/app/apikey
3. Click **Save Key**

---

## 📖 How to Use

1. Open any **Google Form** (`docs.google.com/forms/...`)
2. Press **`Alt+Shift+S`** OR click **"Solve Form Now"** in the popup
3. Watch AI fill in all the answers automatically! ✨

---

## 🎯 Supported Question Types

| Type | Status |
|------|--------|
| Multiple Choice (MCQ) | ✅ Full support |
| Checkboxes (multi-select) | ✅ Full support |
| Short Answer | ✅ Full support |
| Paragraph/Long Answer | ✅ Full support |
| Dropdown | ✅ Basic support |
| Linear Scale | 🔄 V2 |
| Date/Time | 🔄 V2 |

---

## 🏗️ File Structure

```
formgenius-extension/
├── manifest.json              ← Extension config (MV3)
├── popup/
│   ├── popup.html             ← Extension popup UI
│   ├── popup.css              ← Premium dark theme styles
│   └── popup.js               ← Popup logic & API key management
├── content/
│   ├── content.js             ← Form parser + AI caller + auto-filler (Stealth)
│   └── content.css            ← Minimal stealth stylesheet
├── background/
│   └── service_worker.js      ← Keyboard shortcut handler
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔑 Privacy & Security
- Your API key is stored **locally** in Chrome's sync storage
- **No data is sent to any server** — only directly to Google's Gemini API
- The extension runs locally and silently

---

## 🛣️ Roadmap

### V1 (Current)
- [x] MCQ auto-fill
- [x] Checkbox multi-select
- [x] Short answer & paragraph fill
- [x] Keyboard shortcut (`Alt+Shift+S`)
- [x] Stealth mode indicator
- [x] Smart personal field skipping
- [x] Usage stats

### V2 (Planned)
- [ ] Dropdown question support (improved)
- [ ] Image-in-question support (Gemini Vision)
- [ ] Linear scale / rating questions
- [ ] Date & time question filling
- [ ] Auto-submit option
- [ ] Confidence score display per answer
- [ ] Question history log

---

## 🧑‍💻 Built With
- **Chrome Extension Manifest V3**
- **Google Gemini 2.5 Flash API**
- **Vanilla JS + CSS** (no frameworks needed)

---

*Made with ✦ by FormGenius*
