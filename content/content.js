// content.js — FormGenius v2 (Stealth + Smart Skip + Universal Mode)
// Works on Google Forms AND any exam portal.

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  //  PERSONAL FIELD KEYWORDS — Auto-skip these
  // ═══════════════════════════════════════════

  // Strict personal-info labels — these ALONE as the full question = skip
  const EXACT_PERSONAL_LABELS = [
    'name', 'full name', 'your name', 'first name', 'last name', 'surname',
    'roll no', 'roll number', 'roll no.', 'enrollment no', 'enrollment number',
    'enrolment no', 'enrolment number', 'student id', 'college id', 'university id',
    'reg no', 'reg number', 'registration no', 'registration number',
    'email', 'email id', 'email address', 'e-mail', 'mail id', 'your email',
    'phone', 'phone number', 'mobile', 'mobile number', 'contact number', 'your phone',
    'date of birth', 'dob', 'gender', 'age',
    'address', 'pincode', 'zip code', 'zip',
    'father name', "father's name", 'mother name', "mother's name",
    'parent name', "parent's name", 'guardian name',
    'signature', 'your signature',
    'section', 'division', 'batch', 'semester',
    'class', 'class & section', 'class and section',
    'department', 'dept', 'branch', 'stream', 'course name', 'program',
  ];

  // Patterns that clearly ask for YOUR personal info (prefix triggers)
  const PERSONAL_PREFIXES = [
    'enter your', 'write your', 'type your', 'provide your', 'fill your',
    'your name', 'your email', 'your phone', 'your mobile', 'your roll',
    'your student', 'your college', 'your enrollment', 'your registration',
    'your class', 'your section', 'your department', 'your branch',
    'your date of birth', 'your dob', 'your gender', 'your age',
    'your address', 'student name', 'student email', 'student roll',
  ];

  function isPersonalField(questionText) {
    const lower = questionText.toLowerCase().trim();

    // Rule 1: Very short question (≤ 50 chars) that exactly matches or closely matches a personal label
    if (lower.length <= 55) {
      const isExact = EXACT_PERSONAL_LABELS.some(label => {
        // Allow trailing punctuation like "Name:", "Roll No:"
        return lower === label || lower === label + ':' || lower === label + '*' || lower === label + ' *';
      });
      if (isExact) return true;
    }

    // Rule 2: Question STARTS WITH a personal prefix pattern
    const hasPersonalPrefix = PERSONAL_PREFIXES.some(prefix => lower.startsWith(prefix));
    if (hasPersonalPrefix) return true;

    // Rule 3: Long questions (> 60 chars) are NEVER personal fields
    // "What is the name of the river..." contains "name" but is academic
    if (lower.length > 60) return false;

    // Rule 4: Short question (≤ 60 chars) + contains a very specific personal keyword combo
    // Only for unambiguous ones that won't appear in academic questions
    const strictPersonalPatterns = [
      /\broll\s*(no|number|#)\b/i,
      /\benrollment\s*(no|number|id)?\b/i,
      /\bemail\s*(id|address)?\b/i,
      /\bmobile\s*(no|number)?\b/i,
      /\bphone\s*(no|number)?\b/i,
      /\bstudent\s*(id|name|email)\b/i,
      /\bdate\s+of\s+birth\b/i,
    ];
    return strictPersonalPatterns.some(p => p.test(lower));
  }


  function isAlreadyFilled(container) {
    // Check text inputs
    const inputs = container.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea');
    for (const inp of inputs) {
      if (inp.value && inp.value.trim().length > 0) return true;
    }
    // Check radios
    const radios = container.querySelectorAll('[role="radio"][aria-checked="true"], input[type="radio"]:checked');
    if (radios.length > 0) return true;
    // Check checkboxes
    const checks = container.querySelectorAll('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked');
    if (checks.length > 0) return true;
    // Check selects
    const selects = container.querySelectorAll('select');
    for (const sel of selects) {
      if (sel.value && sel.value !== '' && sel.selectedIndex > 0) return true;
    }
    return false;
  }

  let _s = null, _st = null;

  function showStealth(state = 'working') {
    clearTimeout(_st);
    if (!_s) { _s = document.createElement('div'); document.body.appendChild(_s); }
    const c = { working: '#6c63ff', done: '#22c55e', error: '#ef4444' }[state];
    const anim = state === 'working' ? 'animation:_fp 0.9s ease-in-out infinite;' : '';
    _s.setAttribute('style',
      'position:fixed!important;bottom:14px!important;right:14px!important;' +
      'z-index:2147483647!important;pointer-events:none!important;' +
      'opacity:1!important;transition:opacity 0.6s!important;'
    );
    _s.innerHTML = `<span style="display:block;width:8px;height:8px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c};${anim}"></span>`;
    if (!document.getElementById('_fgkf')) {
      const st = document.createElement('style');
      st.id = '_fgkf';
      st.textContent = '@keyframes _fp{0%,100%{opacity:1}50%{opacity:0.2}}';
      document.head.appendChild(st);
    }
    if (state !== 'working') {
      _st = setTimeout(() => {
        if (_s) { _s.style.opacity = '0'; setTimeout(() => { _s?.remove(); _s = null; }, 600); }
      }, 1200);
    }
  }

  // ═══════════════════════════════════════════
  //  GOOGLE FORMS PARSER
  // ═══════════════════════════════════════════

  function parseGoogleForm() {
    const questions = [];
    const containers = document.querySelectorAll('[role="listitem"]');

    containers.forEach((container, index) => {
      try {
        const titleEl = container.querySelector('.M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle, [data-item-id]');
        const questionText = (titleEl?.textContent || '').trim();
        if (!questionText) return;

        // ── SKIP: Personal fields ──
        if (isPersonalField(questionText)) {
          questions.push({ index, questionText, type: 'skip', options: [], skip: true, reason: 'personal' });
          return;
        }

        // ── SKIP: Already filled ──
        if (isAlreadyFilled(container)) {
          questions.push({ index, questionText, type: 'skip', options: [], skip: true, reason: 'filled' });
          return;
        }

        const hasRadio = container.querySelectorAll('[role="radio"]').length > 0;
        const hasCheckbox = container.querySelectorAll('[role="checkbox"]').length > 0;
        const hasInput = container.querySelector('input[type="text"],input[type="email"],input[type="number"]');
        const hasTextarea = container.querySelector('textarea');
        const hasDropdown = container.querySelector('[role="listbox"],select');

        let type = 'unknown', options = [];

        if (hasDropdown) {
          type = 'dropdown';
          container.querySelectorAll('[role="option"],select option').forEach(el => {
            const t = (el.textContent || el.value || '').trim();
            if (t && t !== 'Choose') options.push(t);
          });
        } else if (hasRadio) {
          type = 'multiple_choice';
          container.querySelectorAll('[role="radio"]').forEach(r => {
            const p = r.closest('[data-value]') || r.parentElement;
            const t = (r.getAttribute('data-value') || p?.querySelector('.aDTYNe,.vd3tt,.nWQGrd')?.textContent || '').trim();
            if (t) options.push(t);
          });
          if (!options.length) {
            container.querySelectorAll('.AB7Lab,.Od2TWd,.aDTYNe,[data-value]').forEach(l => {
              const t = l.getAttribute('data-value') || l.textContent.trim();
              if (t && !options.includes(t)) options.push(t);
            });
          }
        } else if (hasCheckbox) {
          type = 'checkbox';
          container.querySelectorAll('[role="checkbox"]').forEach(cb => {
            const p = cb.closest('[data-value]');
            const t = (cb.getAttribute('data-value') || p?.querySelector('.aDTYNe,.vd3tt')?.textContent || '').trim();
            if (t) options.push(t);
          });
        } else if (hasTextarea) {
          type = 'paragraph';
        } else if (hasInput) {
          type = 'short_answer';
        }

        questions.push({ index, questionText, type, options, skip: false });
      } catch (_) { }
    });

    return questions;
  }

  // ═══════════════════════════════════════════
  //  UNIVERSAL PARSER — Any exam portal
  //  Works on Moodle, custom portals, etc.
  // ═══════════════════════════════════════════

  function parseUniversalForm() {
    const questions = [];
    let index = 0;

    // Strategy: Find all question "blocks" by looking for:
    // Radio groups, Checkbox groups, text inputs, textareas with nearby labels

    // ── MCQ: Radio groups ──
    const radioGroups = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const name = r.name || r.getAttribute('name') || `rg_${index}`;
      if (!radioGroups[name]) radioGroups[name] = [];
      radioGroups[name].push(r);
    });

    Object.entries(radioGroups).forEach(([name, radios]) => {
      const firstRadio = radios[0];
      const container = firstRadio.closest('fieldset,tr,div[class*="question"],li,section,.q-text,.question') || firstRadio.parentElement?.parentElement;
      const questionText = findQuestionText(container, firstRadio);

      if (!questionText || isPersonalField(questionText)) return;

      // Check already answered
      const answered = radios.some(r => r.checked);
      if (answered) return;

      const options = radios.map(r => {
        const label = document.querySelector(`label[for="${r.id}"]`) || r.closest('label') || r.parentElement;
        return (label?.textContent || r.value || '').trim().replace(/^\s*[○●•]\s*/, '');
      }).filter(Boolean);

      questions.push({ index: index++, questionText, type: 'multiple_choice', options, skip: false, _radios: radios });
    });

    // ── Checkboxes ──
    const checkGroups = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const name = cb.name || `cg_${index}`;
      if (!checkGroups[name]) checkGroups[name] = [];
      checkGroups[name].push(cb);
    });

    Object.entries(checkGroups).forEach(([name, cbs]) => {
      if (cbs.length < 2) return; // Single checkbox = probably just a consent box, skip
      const container = cbs[0].closest('fieldset,div[class*="question"],li,.question') || cbs[0].parentElement?.parentElement;
      const questionText = findQuestionText(container, cbs[0]);
      if (!questionText || isPersonalField(questionText)) return;
      if (cbs.some(c => c.checked)) return; // Already answered

      const options = cbs.map(cb => {
        const label = document.querySelector(`label[for="${cb.id}"]`) || cb.closest('label') || cb.parentElement;
        return (label?.textContent || cb.value || '').trim();
      }).filter(Boolean);

      questions.push({ index: index++, questionText, type: 'checkbox', options, skip: false, _checkboxes: cbs });
    });

    // ── Selects ──
    document.querySelectorAll('select').forEach(sel => {
      const container = sel.closest('fieldset,div[class*="question"],li,.question,tr') || sel.parentElement;
      const questionText = findQuestionText(container, sel);
      if (!questionText || isPersonalField(questionText)) return;
      if (sel.value && sel.selectedIndex > 0) return; // Already filled

      const options = Array.from(sel.options)
        .filter(o => o.value && o.value !== '')
        .map(o => o.text.trim())
        .filter(Boolean);

      questions.push({ index: index++, questionText, type: 'dropdown', options, skip: false, _select: sel });
    });

    // ── Text inputs / Textareas ──
    document.querySelectorAll('input[type="text"],input[type="email"],textarea').forEach(el => {
      if (el.value && el.value.trim()) return; // Already filled
      const container = el.closest('fieldset,div[class*="question"],li,.question,tr') || el.parentElement;
      const questionText = findQuestionText(container, el);
      if (!questionText || isPersonalField(questionText)) return;

      const type = el.tagName === 'TEXTAREA' ? 'paragraph' : 'short_answer';
      questions.push({ index: index++, questionText, type, options: [], skip: false, _input: el });
    });

    return questions;
  }

  function findQuestionText(container, fallbackEl) {
    if (!container) return '';
    // Try legend (for fieldsets)
    const legend = container.querySelector('legend');
    if (legend) return legend.textContent.trim();
    // Try common question class names
    const qEl = container.querySelector(
      '.question-text,.qtext,.stem,.prompt,h3,h4,.title,[class*="question-title"],[class*="qtitle"],[class*="q-stem"]'
    );
    if (qEl) return qEl.textContent.trim();
    // Try label associated with the element
    if (fallbackEl?.id) {
      const label = document.querySelector(`label[for="${fallbackEl.id}"]`);
      if (label) return label.textContent.trim();
    }
    // Try the first text node in container that looks like a question
    const allText = container.textContent.trim().split('\n')[0].trim();
    if (allText.length > 5 && allText.length < 500) return allText;
    return '';
  }

  // ═══════════════════════════════════════════
  //  GEMINI API — gemini-2.5-flash (latest)
  // ═══════════════════════════════════════════

  async function callGeminiAPI(apiKey, questions) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Only send questions that need solving (not skipped)
    const toSolve = questions.filter(q => !q.skip);

    if (toSolve.length === 0) return [];

    const cleanQ = toSolve.map(q => ({
      index: q.index,
      questionText: q.questionText,
      type: q.type,
      options: q.options
    }));

    const prompt = `You are an expert exam and quiz solver. Solve ALL the questions below accurately.

STRICT RULES:
1. "multiple_choice" → answer must be EXACTLY one option from the list (exact text, case-sensitive).
2. "checkbox" → answer must be a JSON ARRAY of one or more correct options from the list.
3. "short_answer" → concise, accurate answer (1–2 sentences max).
4. "paragraph" → well-structured 2–4 sentence answer.
5. "dropdown" → answer must be EXACTLY one option from the list.
6. DO NOT fill personal info fields (name, roll, email, phone etc) — these are already excluded.
7. Return ONLY a valid JSON array. No markdown. No explanation outside JSON.

QUESTIONS TO SOLVE:
${JSON.stringify(cleanQ, null, 2)}

OUTPUT FORMAT (strict JSON array):
[
  {"index": 0, "type": "multiple_choice", "answer": "Exact Option Text"},
  {"index": 1, "type": "checkbox", "answer": ["Option A", "Option C"]},
  {"index": 2, "type": "short_answer", "answer": "Concise answer here"},
  {"index": 3, "type": "paragraph", "answer": "Detailed answer here."}
]

Solve all ${cleanQ.length} questions. Return ONLY the JSON array:`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, topK: 1, topP: 0.95, maxOutputTokens: 8192 }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${err?.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    let text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(text);
  }

  // ═══════════════════════════════════════════
  //  GOOGLE FORMS FILLER
  // ═══════════════════════════════════════════

  async function fillGoogleForm(answers, allQuestions) {
    const containers = Array.from(document.querySelectorAll('[role="listitem"]'));
    let filled = 0;

    for (const answer of answers) {
      // Find the original question object to get the container index
      const q = allQuestions.find(q => q.index === answer.index);
      if (!q || q.skip) continue;
      const container = containers[q.index];
      if (!container) continue;

      try {
        const { type, answer: ans } = answer;
        if (type === 'multiple_choice') filled += await fillGFMCQ(container, ans);
        else if (type === 'checkbox') filled += await fillGFCheckbox(container, ans);
        else if (type === 'short_answer') filled += fillGFText(container, ans);
        else if (type === 'paragraph') filled += fillGFTextarea(container, ans);
        else if (type === 'dropdown') filled += await fillGFDropdown(container, ans);
        await sleep(160);
      } catch (_) { }
    }
    return filled;
  }

  async function fillGFMCQ(container, answerText) {
    for (const radio of container.querySelectorAll('[role="radio"]')) {
      const parent = radio.closest('[data-value]');
      const val = radio.getAttribute('data-value') || '';
      const lbl = (parent?.querySelector('.aDTYNe,.vd3tt,.nWQGrd,.Od2TWd')?.textContent || val).trim();
      if (lbl.toLowerCase() === answerText.toLowerCase() || val.toLowerCase() === answerText.toLowerCase()) {
        radio.click(); await sleep(100); return 1;
      }
    }
    return 0;
  }

  async function fillGFCheckbox(container, answers) {
    let c = 0;
    for (const cb of container.querySelectorAll('[role="checkbox"]')) {
      const parent = cb.closest('[data-value]');
      const val = cb.getAttribute('data-value') || '';
      const lbl = (parent?.querySelector('.aDTYNe,.vd3tt,.nWQGrd')?.textContent || val).trim();
      const should = answers.some(a => a.toLowerCase() === lbl.toLowerCase() || a.toLowerCase() === val.toLowerCase());
      if (should && cb.getAttribute('aria-checked') !== 'true') {
        cb.click(); await sleep(100); c++;
      }
    }
    return c > 0 ? 1 : 0;
  }

  function fillGFText(container, text) {
    const inp = container.querySelector('input[type="text"],input[type="email"],input[type="number"],input:not([type="hidden"])');
    if (!inp) return 0;
    inp.focus(); inp.value = text; triggerEvents(inp); return 1;
  }

  function fillGFTextarea(container, text) {
    const ta = container.querySelector('textarea');
    if (!ta) return 0;
    ta.focus(); ta.value = text; triggerEvents(ta); return 1;
  }

  async function fillGFDropdown(container, answerText) {
    const sel = container.querySelector('select');
    if (sel) {
      for (const opt of sel.querySelectorAll('option')) {
        if (opt.textContent.trim().toLowerCase() === answerText.toLowerCase()) {
          sel.value = opt.value; triggerEvents(sel); return 1;
        }
      }
    }
    const trigger = container.querySelector('[role="listbox"]');
    if (trigger) {
      trigger.click(); await sleep(300);
      for (const opt of document.querySelectorAll('[role="option"]')) {
        if (opt.textContent.trim().toLowerCase() === answerText.toLowerCase()) {
          opt.click(); await sleep(100); return 1;
        }
      }
    }
    return 0;
  }

  // ═══════════════════════════════════════════
  //  UNIVERSAL FILLER — Any portal
  // ═══════════════════════════════════════════

  async function fillUniversal(answers, questions) {
    let filled = 0;
    for (const answer of answers) {
      const q = questions.find(q => q.index === answer.index);
      if (!q || q.skip) continue;
      try {
        const { type, answer: ans } = answer;
        if (type === 'multiple_choice' && q._radios) {
          for (const r of q._radios) {
            const lbl = document.querySelector(`label[for="${r.id}"]`) || r.closest('label') || r.parentElement;
            const txt = (lbl?.textContent || r.value || '').trim();
            if (txt.toLowerCase() === ans.toLowerCase() || r.value?.toLowerCase() === ans.toLowerCase()) {
              r.click(); await sleep(100); filled++; break;
            }
          }
        } else if (type === 'checkbox' && q._checkboxes) {
          for (const cb of q._checkboxes) {
            const lbl = document.querySelector(`label[for="${cb.id}"]`) || cb.closest('label') || cb.parentElement;
            const txt = (lbl?.textContent || cb.value || '').trim();
            const should = ans.some(a => a.toLowerCase() === txt.toLowerCase());
            if (should && !cb.checked) { cb.click(); await sleep(80); }
          }
          filled++;
        } else if (type === 'dropdown' && q._select) {
          for (const opt of q._select.querySelectorAll('option')) {
            if (opt.text.trim().toLowerCase() === ans.toLowerCase()) {
              q._select.value = opt.value; triggerEvents(q._select); filled++; break;
            }
          }
        } else if ((type === 'short_answer' || type === 'paragraph') && q._input) {
          q._input.focus(); q._input.value = ans; triggerEvents(q._input); filled++;
        }
        await sleep(150);
      } catch (_) { }
    }
    return filled;
  }

  // ═══════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function triggerEvents(el) {
    ['input', 'change', 'keyup', 'keydown', 'blur'].forEach(e => el.dispatchEvent(new Event(e, { bubbles: true })));
    try {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) { setter.call(el, el.value); el.dispatchEvent(new Event('input', { bubbles: true })); }
    } catch (_) { }
  }

  // ═══════════════════════════════════════════
  //  DETECT: Google Form or Other Portal?
  // ═══════════════════════════════════════════

  function isGoogleForm() {
    return window.location.hostname === 'docs.google.com' &&
      window.location.pathname.includes('/forms/');
  }

  // ═══════════════════════════════════════════
  //  MAIN SOLVER
  // ═══════════════════════════════════════════

  async function solveForm(apiKey) {
    try {
      showStealth('working');
      await sleep(200);

      let questions, answers, filled;
      const gform = isGoogleForm();

      questions = gform ? parseGoogleForm() : parseUniversalForm();

      const toSolve = questions.filter(q => !q.skip);

      if (toSolve.length === 0) {
        showStealth('done');
        return { success: false, error: 'Nothing to solve' };
      }

      showStealth('working');

      answers = await callGeminiAPI(apiKey, questions);

      showStealth('working');
      await sleep(120);

      filled = gform
        ? await fillGoogleForm(answers, questions)
        : await fillUniversal(answers, questions);

      showStealth('done');

      chrome.runtime.sendMessage({ action: 'UPDATE_STATS', questionsCount: filled });
      return { success: true, questionsAnswered: filled };

    } catch (err) {
      showStealth('error');
      return { success: false, error: err.message };
    }
  }

  // ═══════════════════════════════════════════
  //  MESSAGE LISTENER
  // ═══════════════════════════════════════════

  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === 'SOLVE_FORM') {
      if (!msg.apiKey) { sendResponse({ success: false, error: 'No API key' }); return true; }
      solveForm(msg.apiKey).then(sendResponse);
      return true;
    }
    if (msg.action === 'PING') { sendResponse({ alive: true }); return true; }
  });

})();
