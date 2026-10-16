/* Paper Whisperer — browser app
 * Flow: capture (photo, pasted text or example) -> reading -> result -> ask follow-ups.
 * The AI engine is picked at start-up:
 *   "claude"  : running inside Claude, uses the page's own Claude connection
 *   "api"     : normal website, calls /api/explain and /api/ask (see /api)
 *   "offline" : no AI available, example letters still work in English
 */
(function () {
  'use strict';

  var W = window.Whisper;
  var SAMPLES = window.WHISPER_SAMPLES || [];

  function $(sel, root) { return (root || document).querySelector(sel); }

  // Small DOM builder. Everything from the AI is inserted as text, never as HTML.
  function h(tag, props) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function svg(markup) {
    var t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }

  var ICONS = {
    now: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l10 18H2L12 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M8 12.5l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shield: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 8v5M12 16v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ---------- state ----------
  var state = {
    lang: 'en',
    source: null,     // { kind: 'text' | 'image' | 'sample', text, file, sampleId }
    result: null,
    resultLang: 'en',
    turns: [],        // follow-up questions and answers
    busy: false,
    ctl: null,
    previewUrl: null,
    savedId: null     // id of this letter in the saved list, if saved
  };

  var views = {
    home: $('#view-home'), reading: $('#view-reading'),
    error: $('#view-error'), result: $('#view-result')
  };

  var els = {
    lang: $('#lang'), fileInput: $('#file-input'), pasteBtn: $('#paste-btn'),
    pastePanel: $('#paste-panel'), pasteText: $('#paste-text'),
    pasteGo: $('#paste-go'), pasteCancel: $('#paste-cancel'),
    examples: $('#examples'), photoNote: $('#photo-note'),
    engineState: $('#engine-state'), engineText: $('#engine-text'),
    readingBody: $('#reading-body'), readingSheet: $('#reading-sheet'),
    readingStatus: $('#reading-status'), readingCancel: $('#reading-cancel'),
    errorText: $('#error-text'), errorRetry: $('#error-retry'), errorBack: $('#error-back'),
    resultBody: $('#result-body'), backBtn: $('#back-btn'), toast: $('#toast'),
    brand: $('#brand'),
    saved: $('#saved'), savedList: $('#saved-list'), savedClear: $('#saved-clear')
  };

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function langName(code) { return W.languageByCode(code).name; }

  // ---------- views ----------
  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    var heading = views[name].querySelector('h1, h2');
    window.scrollTo(0, 0);
    if (heading) heading.focus({ preventScroll: true });
  }

  var toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2600);
  }

  // ---------- AI engine ----------
  var engine = { mode: 'pending', sample: null, imageOk: false, ready: null };

  function setEngineLabel() {
    var label = { pending: 'Starting', claude: 'AI ready', api: 'AI ready', offline: 'AI not available here' }[engine.mode];
    els.engineState.setAttribute('data-mode', engine.mode);
    els.engineText.textContent = label;
  }

  engine.ready = (async function () {
    if (window.claude && typeof window.claude.use === 'function') {
      try {
        engine.sample = await window.claude.use('sample');
      } catch (e) { engine.sample = null; }
      if (engine.sample) {
        engine.mode = 'claude';
        try {
          var lim = await engine.sample.limits();
          engine.imageOk = !!(lim && lim.images);
        } catch (e2) { engine.imageOk = false; }
      } else {
        engine.mode = 'offline';
      }
    } else {
      engine.mode = 'api';
      engine.imageOk = true;
    }
    setEngineLabel();
    if (engine.mode === 'offline') {
      els.photoNote.hidden = false;
      els.photoNote.textContent = 'The AI connection is not available in this view, so photos and other languages cannot be read. The example letters still work in English.';
    }
  })();

  function todayText() {
    return new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Shrink a photo before sending it to our own API.
  function downscale(file, max, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({ mediaType: 'image/jpeg', data: c.toDataURL('image/jpeg', quality).split(',')[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject({ code: 'image_rejected' }); };
      img.src = url;
    });
  }

  async function postJSON(url, body, signal) {
    var res = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: signal
    });
    if (!res.ok) throw { code: 'api_' + res.status };
    return res.json();
  }

  async function explainViaEngine(source, langCode, signal) {
    var language = langName(langCode);
    var hasImage = source.kind === 'image';
    var files = hasImage ? source.files : [];
    if (engine.mode === 'claude') {
      var prompt = W.buildExplainPrompt({ language: language, today: todayText(), hasImage: hasImage, pages: files.length, text: source.text });
      var opts = { signal: signal };
      if (hasImage) opts.images = files.length === 1 ? files[0] : files;
      return engine.sample.json(prompt, opts);
    }
    if (engine.mode === 'api') {
      // Several pages are shrunk a little more so the request stays small.
      var many = files.length > 1;
      var images = await Promise.all(files.map(function (f) { return downscale(f, many ? 1300 : 1600, many ? 0.75 : 0.82); }));
      var data = await postJSON('/api/explain', {
        language: language, today: todayText(), text: source.text || '', images: images
      }, signal);
      return data.result;
    }
    throw { code: 'offline' };
  }

  function errorCopy(e) {
    var code = e && e.code;
    var map = {
      not_granted: ['Claude is not allowed for this page.', 'Allow it when asked, then try again.'],
      sampling_disabled: ['Claude is not available on this account.', 'Try another account, or paste the text into a normal browser.'],
      rate_limited: ['Too many requests just now.', 'Wait a minute, then try again.'],
      session_expired: ['Your session ended.', 'Sign in again, then try again.'],
      image_rejected: ['That photo could not be read.', 'Use a clear JPEG or PNG under 20 MB, or paste the text instead.'],
      images_unavailable: ['Photos do not work in this view.', 'Paste the text of the letter instead.'],
      invalid_json: ['The answer came back in a shape we could not use.', 'Try again. If it keeps happening, paste the text instead.'],
      invalid_result: ['The answer came back in a shape we could not use.', 'Try again. If it keeps happening, paste the text instead.'],
      refused: ['Claude could not explain this document.', 'Check that the photo shows a letter, or paste the text instead.'],
      empty_completion: ['No answer came back.', 'Try again with a clearer photo or the pasted text.'],
      offline: ['The AI connection is not available here.', 'Open an example letter to see how it works.'],
      api_404: ['The AI service is not set up yet.', 'Add your API key and deploy the /api folder. The README shows how.'],
      api_413: ['Those photos are too large.', 'Try fewer pages at a time, or paste the text.'],
      not_for_scams: ['A reply is not offered for a message that looks like a scam.', 'Follow the safe steps above instead.'],
      api_429: ['Too many requests just now.', 'Wait a minute, then try again.']
    };
    var pair = map[code] || ['Something went wrong while reading the letter.', 'Check your connection and try again.'];
    return { title: pair[0], text: pair[1] };
  }

  // ---------- capture ----------
  function revokePreview() {
    if (state.previewUrl) { URL.revokeObjectURL(state.previewUrl); state.previewUrl = null; }
  }

  function goHome() {
    if (state.ctl) { state.ctl.abort(); state.ctl = null; }
    state.busy = false; state.source = null; state.result = null; state.turns = [];
    state.savedId = null;
    stopSpeaking(); stopPhases(); revokePreview();
    renderSaved();
    show('home');
  }

  var phaseTimer;
  function stopPhases() { clearInterval(phaseTimer); }
  function startPhases(langCode) {
    var phases = [
      'Reading the page',
      'Finding dates and amounts',
      'Checking for scam signs',
      'Writing it in ' + langName(langCode)
    ];
    var i = 0;
    els.readingStatus.textContent = phases[0] + '…';
    stopPhases();
    phaseTimer = setInterval(function () {
      if (i < phases.length - 1) i++;
      els.readingStatus.textContent = phases[i] + '…';
    }, 2600);
  }

  function showReadingPreview(source) {
    els.readingBody.textContent = '';
    revokePreview();
    var old = els.readingSheet.querySelector('.sheet-img');
    if (old) old.remove();
    if (source.kind === 'image') {
      state.previewUrl = URL.createObjectURL(source.files[0]);
      var img = h('img', { class: 'sheet-img', src: state.previewUrl, alt: source.files.length > 1 ? 'Your photos of the letter, first page shown' : 'Your photo of the letter' });
      els.readingSheet.insertBefore(img, els.readingSheet.firstChild);
    } else {
      els.readingBody.textContent = (source.text || '').slice(0, 1100);
    }
  }

  function findSample(id) {
    for (var i = 0; i < SAMPLES.length; i++) if (SAMPLES[i].id === id) return SAMPLES[i];
    return null;
  }

  async function start(source) {
    if (state.busy) return;
    state.source = source;
    state.turns = [];

    // Example letters in English show instantly; no AI call is needed.
    var sample = source.kind === 'sample' ? findSample(source.sampleId) : null;
    if (sample && state.lang === 'en') {
      showResult(W.normalizeResult(sample.result), 'en', 'Example letter. This result was prepared in advance.');
      return;
    }

    state.busy = true;
    state.ctl = new AbortController();
    var ctl = state.ctl;
    showReadingPreview(source);
    startPhases(state.lang);
    show('reading');

    try {
      await engine.ready;
      if (source.kind === 'image' && engine.mode !== 'api' && !engine.imageOk) throw { code: 'images_unavailable' };
      var raw = await explainViaEngine(source, state.lang, ctl.signal);
      var result = W.normalizeResult(raw && typeof raw === 'object' ? raw : W.extractJSON(raw));
      if (ctl.signal.aborted) return;
      showResult(result, state.lang, '');
    } catch (e) {
      if (ctl.signal.aborted || (e && e.code === 'cancelled')) return;
      var offlineLike = e && (e.code === 'offline' || e.code === 'api_404' || e.name === 'TypeError');
      if (sample && offlineLike) {
        showResult(W.normalizeResult(sample.result), 'en',
          'The AI connection is not available, so this is the English example result.');
      } else {
        showError(e && e.name === 'TypeError' ? { code: 'api_404' } : e);
      }
    } finally {
      state.busy = false;
      stopPhases();
    }
  }

  function showError(e) {
    var copy = errorCopy(e);
    $('#error-title').textContent = copy.title;
    els.errorText.textContent = copy.text;
    show('error');
  }

  // ---------- result ----------
  function stepsText(r) {
    return r.steps.map(function (s, i) { return (i + 1) + '. ' + s.text + (s.by ? ' (' + s.by + ')' : ''); }).join('\n');
  }

  function speechText(r) {
    return [r.headline, r.summary, r.steps.map(function (s) { return s.text; }).join('. ')].filter(Boolean).join('. ');
  }

  function copyText(r) {
    var parts = [r.headline, '', r.summary];
    if (r.steps.length) parts.push('', r.ui.steps + ':', stepsText(r));
    if (r.keyFacts.length) {
      parts.push('', r.ui.facts + ':');
      r.keyFacts.forEach(function (f) { parts.push(f.label + ': ' + f.value); });
    }
    if (r.bring.length) {
      parts.push('', r.ui.bring + ':');
      r.bring.forEach(function (b) { parts.push('- ' + b); });
    }
    parts.push('', 'Explained by Paper Whisperer');
    return parts.join('\n');
  }

  function copyToClipboard(text) {
    function fallback() {
      var ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;left:-999px' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  // read aloud
  var speaking = false;
  var speakBtn = null;
  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking = false;
    if (speakBtn) speakBtn.textContent = 'Listen';
  }
  function toggleSpeak() {
    if (!('speechSynthesis' in window) || !state.result) return;
    if (speaking) { stopSpeaking(); return; }
    var lang = W.languageByCode(state.resultLang);
    var u = new SpeechSynthesisUtterance(speechText(state.result));
    u.lang = lang.bcp;
    var voices = window.speechSynthesis.getVoices() || [];
    var prefix = lang.code.length === 2 ? lang.code : lang.bcp.slice(0, 3);
    var hasVoice = voices.some(function (v) { return v.lang && v.lang.toLowerCase().indexOf(prefix) === 0; });
    if (!hasVoice && lang.code !== 'en') toast('Your device may not have a ' + lang.name + ' voice. It might sound unclear.');
    u.onend = u.onerror = function () { speaking = false; if (speakBtn) speakBtn.textContent = 'Listen'; };
    speaking = true;
    speakBtn.textContent = 'Stop';
    window.speechSynthesis.speak(u);
  }

  function showResult(result, langCode, noteText, savedId) {
    state.result = result;
    state.resultLang = langCode;
    state.savedId = savedId || null;
    stopSpeaking();
    var r = result;
    var body = els.resultBody;
    body.textContent = '';

    var wrap = h('div', { class: 'result', style: 'max-width:none' });

    // head
    var meta = [r.documentType, r.sender].filter(Boolean).join(' · ');
    var urgencyText = r.urgencyLabel || { now: 'Act soon', soon: 'Plan ahead', info: 'No action needed' }[r.urgency];
    var pill = h('span', { class: 'pill', 'data-urgency': r.urgency }, svg(ICONS[r.urgency]), urgencyText);
    var head = h('header', { class: 'result-head' },
      meta ? h('p', { class: 'doc-meta', text: meta }) : null,
      h('h2', { id: 'result-title', tabindex: '-1', text: r.headline }),
      pill
    );
    wrap.appendChild(head);

    if (noteText) wrap.appendChild(h('p', { class: 'notice', text: noteText }));

    // scam check
    if (r.scamRisk !== 'low') {
      wrap.appendChild(h('section', { class: 'alert', 'data-risk': r.scamRisk, role: 'alert' },
        svg(ICONS.shield),
        h('div', null, h('h3', { text: r.ui.scam }), h('p', { text: r.scamNote }))
      ));
    }

    // summary
    wrap.appendChild(h('section', { class: 'block' },
      h('h3', { text: r.ui.summary }),
      h('p', { class: 'summary', text: r.summary })
    ));

    // steps
    if (r.steps.length) {
      var list = h('ol', { class: 'steps' });
      r.steps.forEach(function (s, i) {
        var id = 'step-' + i;
        list.appendChild(h('li', { class: 'step' },
          h('label', { for: id },
            h('input', { type: 'checkbox', id: id }),
            h('span', { class: 'tick' }, svg(ICONS.check)),
            h('span', { class: 'step-text' },
              h('span', { text: s.text }),
              s.by ? h('span', { class: 'by', text: s.by }) : null
            )
          )
        ));
      });
      wrap.appendChild(h('section', { class: 'block' }, h('h3', { text: r.ui.steps }), list));
    }

    // bring
    if (r.bring.length) {
      var bl = h('ul', { class: 'steps' });
      r.bring.forEach(function (b, i) {
        var bid = 'bring-' + i;
        bl.appendChild(h('li', { class: 'step' },
          h('label', { for: bid },
            h('input', { type: 'checkbox', id: bid }),
            h('span', { class: 'tick' }, svg(ICONS.check)),
            h('span', { class: 'step-text' }, h('span', { text: b }))
          )
        ));
      });
      wrap.appendChild(h('section', { class: 'block' }, h('h3', { text: r.ui.bring }), bl));
    }

    // facts
    if (r.keyFacts.length) {
      var dl = h('dl', { class: 'facts' });
      r.keyFacts.forEach(function (f) {
        dl.appendChild(h('div', { class: 'fact' }, h('dt', { text: f.label }), h('dd', { text: f.value })));
      });
      wrap.appendChild(h('section', { class: 'block' }, h('h3', { text: r.ui.facts }), dl));
    }

    // watch out
    if (r.watchOut.length) {
      var ul = h('ul', { class: 'bullets' });
      r.watchOut.forEach(function (w) { ul.appendChild(h('li', { text: w })); });
      wrap.appendChild(h('section', { class: 'block' }, h('h3', { text: r.ui.watchOut }), ul));
    }

    // glossary
    if (r.glossary.length) {
      var g = h('div', { class: 'gloss' });
      r.glossary.forEach(function (item) {
        g.appendChild(h('details', null, h('summary', { text: item.term }), h('p', { text: item.meaning })));
      });
      wrap.appendChild(h('section', { class: 'block' }, h('h3', { text: r.ui.glossary }), g));
    }

    // low scam risk: a quiet reassurance line
    if (r.scamRisk === 'low' && r.scamNote) {
      wrap.appendChild(h('p', { class: 'disclaimer', style: 'border-top:0;padding-top:0', text: r.scamNote }));
    }

    // tools
    var tools = h('div', { class: 'toolbar' });
    if ('speechSynthesis' in window) {
      speakBtn = h('button', { class: 'btn btn-small', type: 'button', onclick: toggleSpeak }, 'Listen');
      tools.appendChild(speakBtn);
    } else { speakBtn = null; }
    tools.appendChild(h('button', {
      class: 'btn btn-small', type: 'button',
      onclick: function () {
        copyToClipboard(copyText(r)).then(function (ok) { toast(ok ? 'Summary copied' : 'Could not copy. Select the text and copy it.'); });
      }
    }, 'Copy summary'));
    tools.appendChild(h('button', { class: 'btn btn-small', type: 'button', onclick: function () { shareSummary(r); } }, 'Share'));
    if (W.buildICS(r)) {
      tools.appendChild(h('button', {
        class: 'btn btn-small', type: 'button',
        onclick: function () {
          var ics = W.buildICS(r);
          if (!ics) { toast('All the dates in this letter have passed.'); return; }
          downloadFile('paper-whisperer-deadlines.ics', ics, 'text/calendar;charset=utf-8');
          toast('Open the file to add the dates and reminders to your calendar.');
        }
      }, 'Add dates to calendar'));
    }
    var saveBtn = h('button', { class: 'btn btn-small', type: 'button' });
    function paintSave() { saveBtn.textContent = state.savedId ? 'Saved. Tap to remove' : 'Save on this phone'; }
    saveBtn.addEventListener('click', function () { toggleSave(); paintSave(); });
    paintSave();
    tools.appendChild(saveBtn);
    // Changing language needs the original letter, which saved letters do not keep.
    if (state.source) {
      tools.appendChild(h('span', { class: 'sep' }));
      var langSel = buildLangSelect('lang-again', state.lang);
      tools.appendChild(h('label', { class: 'visually-hidden', for: 'lang-again' }, 'Language'));
      tools.appendChild(langSel);
      tools.appendChild(h('button', {
        class: 'btn btn-small', type: 'button',
        onclick: function () {
          state.lang = langSel.value; els.lang.value = state.lang; safeSet('pw-lang', state.lang);
          start(state.source);
        }
      }, 'Explain again'));
    }
    wrap.appendChild(h('section', { class: 'block' }, tools));

    // reply draft
    var draftSection = buildDraftSection(r);
    if (draftSection) wrap.appendChild(draftSection);

    // ask
    var chat = h('div', { class: 'chat', 'aria-live': 'polite' });
    var qbox = h('div', { class: 'chips qchips' });
    r.questions.forEach(function (q) {
      var chip = h('button', { class: 'chip chip-q', type: 'button' }, q);
      chip.addEventListener('click', function () { chip.remove(); ask(q, chat); });
      qbox.appendChild(chip);
    });
    var input = h('input', { class: 'input', id: 'ask-input', type: 'text', placeholder: 'Ask about this letter', autocomplete: 'off', maxlength: '300' });
    var form = h('form', { class: 'ask-form' },
      h('label', { class: 'visually-hidden', for: 'ask-input' }, 'Your question'),
      input,
      h('button', { class: 'btn btn-primary btn-small', type: 'submit' }, 'Ask')
    );
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = '';
      ask(q, chat);
    });
    wrap.appendChild(h('section', { class: 'block ask' }, h('h3', { text: 'Ask a question' }), chat, r.questions.length ? qbox : null, form));

    wrap.appendChild(h('p', { class: 'disclaimer', text: 'Paper Whisperer explains letters in plain words. It is not legal advice and it can make mistakes. For big decisions, check with the sender or an advice office.' }));

    body.appendChild(wrap);
    show('result');
    var title = $('#result-title');
    if (title) title.focus({ preventScroll: true });
  }


  // ---------- share, calendar file, saved letters ----------
  function shareSummary(r) {
    var text = copyText(r);
    if (navigator.share) { navigator.share({ text: text }).catch(function () { /* cancelled */ }); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  function downloadFile(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var SAVE_KEY = 'pw-saved', MAX_SAVED = 20;

  function loadSaved() {
    try {
      var list = JSON.parse(safeGet(SAVE_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function storeSaved(list) { return safeSet(SAVE_KEY, JSON.stringify(list.slice(0, MAX_SAVED))); }

  function toggleSave() {
    var list = loadSaved();
    if (state.savedId) {
      storeSaved(list.filter(function (e) { return e.id !== state.savedId; }));
      state.savedId = null;
      toast('Removed from this phone');
      return;
    }
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    list.unshift({ id: id, savedAt: Date.now(), lang: state.resultLang, result: state.result });
    if (storeSaved(list)) { state.savedId = id; toast('Saved on this phone. The photo and letter text are not kept.'); }
    else toast('Could not save on this device.');
  }

  function renderSaved() {
    var items = loadSaved().map(function (e) {
      try { var r = W.normalizeResult(e.result); return { e: e, r: r, due: W.nextDeadline(r) }; } catch (x) { return null; }
    }).filter(Boolean);
    // Overdue and nearest deadlines first, letters without a date last.
    items.sort(function (a, b) {
      var da = a.due ? a.due.days : 1e9, db = b.due ? b.due.days : 1e9;
      return da - db;
    });
    els.saved.hidden = !items.length;
    els.savedList.textContent = '';
    items.forEach(function (it) {
      var days = it.due ? it.due.days : null;
      var tone = days === null ? 'none' : days < 0 ? 'overdue' : days <= 7 ? 'soon' : 'ok';
      var open = h('button', { class: 'saved-open', type: 'button' },
        h('b', { text: it.r.headline }),
        h('span', { text: [it.r.sender, it.due ? 'Date: ' + it.due.date : ''].filter(Boolean).join(' · ') })
      );
      open.addEventListener('click', function () {
        state.source = null; state.turns = []; state.lang = it.e.lang || state.lang;
        showResult(it.r, it.e.lang || 'en', 'Saved on this phone.', it.e.id);
      });
      var del = h('button', { class: 'btn btn-quiet btn-small', type: 'button', 'aria-label': 'Remove saved letter: ' + it.r.headline }, 'Remove');
      del.addEventListener('click', function () {
        storeSaved(loadSaved().filter(function (x) { return x.id !== it.e.id; }));
        renderSaved();
      });
      els.savedList.appendChild(h('li', { class: 'saved-item' },
        h('span', { class: 'days', 'data-tone': tone, text: W.dueLabel(days) }), open, del));
    });
  }

  // ---------- reply draft ----------
  function splitDraft(t) {
    var m = /^\s*Subject:\s*(.*)\n+([\s\S]*)$/i.exec(t);
    return m ? { subject: m[1].trim(), body: m[2].trim() } : { subject: '', body: String(t).trim() };
  }

  async function requestDraft(goal, languageCode) {
    var language = langName(languageCode);
    var text = state.source && state.source.kind !== 'image' ? state.source.text : '';
    await engine.ready;
    try {
      if (engine.mode === 'claude') {
        var prompt = W.buildDraftPrompt({ language: language, goal: goal, result: state.result, text: text });
        var res = await engine.sample(prompt, { cache: false });
        return res.text.trim();
      }
      if (engine.mode === 'api') {
        var data = await postJSON('/api/draft', { language: language, goal: goal, result: state.result, text: text });
        return data.draft;
      }
    } catch (e) {
      if (!(e && (e.code === 'api_404' || e.name === 'TypeError'))) throw e;
    }
    // No AI available: fall back to a plain English template.
    toast('AI not available, so this is an English template.');
    return W.buildLocalDraft(state.result, goal);
  }

  function buildDraftSection(r) {
    if (r.scamRisk !== 'low') return null; // never help someone reply to a likely scam
    var goalSel = h('select', { class: 'select', id: 'draft-goal' });
    W.DRAFT_GOALS.forEach(function (g) { goalSel.appendChild(h('option', { value: g.id, text: g.label })); });
    var langSel = buildLangSelect('draft-lang', 'en');
    var ta = h('textarea', { class: 'textarea draft-text', id: 'draft-text', 'aria-label': 'Draft reply, you can edit it' });
    var out = h('div', { class: 'draft-out', hidden: true },
      ta,
      h('p', { class: 'hint', text: 'Check the words in [square brackets] before you send. Never put your ID number, PIN or password in a message.' })
    );
    var go = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Write a draft');
    go.addEventListener('click', async function () {
      go.disabled = true; go.textContent = 'Writing…';
      try {
        ta.value = await requestDraft(goalSel.value, langSel.value);
        out.hidden = false;
        ta.focus({ preventScroll: true });
      } catch (e) {
        toast(errorCopy(e).title);
      } finally {
        go.disabled = false; go.textContent = 'Write a draft';
      }
    });
    var acts = h('div', { class: 'paste-actions' },
      h('button', { class: 'btn btn-small', type: 'button', onclick: function () {
        copyToClipboard(ta.value).then(function (ok) { toast(ok ? 'Draft copied' : 'Could not copy. Select the text and copy it.'); });
      } }, 'Copy'),
      h('button', { class: 'btn btn-small', type: 'button', onclick: function () {
        window.open('https://wa.me/?text=' + encodeURIComponent(splitDraft(ta.value).body), '_blank', 'noopener');
      } }, 'WhatsApp'),
      h('button', { class: 'btn btn-small', type: 'button', onclick: function () {
        var d = splitDraft(ta.value);
        window.location.href = 'mailto:?subject=' + encodeURIComponent(d.subject) + '&body=' + encodeURIComponent(d.body);
      } }, 'Email')
    );
    out.appendChild(acts);
    return h('section', { class: 'block draft' },
      h('h3', { text: 'Reply to the sender' }),
      h('p', { class: 'hint', text: 'Pick what you want to say. We write a short message you can edit and send.' }),
      h('div', { class: 'draft-row' },
        h('label', { class: 'visually-hidden', for: 'draft-goal' }, 'What do you want to say'), goalSel,
        h('label', { class: 'visually-hidden', for: 'draft-lang' }, 'Language of the reply'), langSel,
        go),
      out
    );
  }

  async function ask(question, chat) {
    chat.appendChild(h('div', { class: 'msg msg-user', text: question }));
    var bubble = h('div', { class: 'msg msg-bot', text: 'Thinking…' });
    chat.appendChild(bubble);
    var language = langName(state.resultLang);
    var text = state.source && state.source.kind !== 'image' ? state.source.text : '';
    try {
      await engine.ready;
      var answer = '';
      if (engine.mode === 'claude') {
        var prompt = W.buildAskPrompt({ language: language, result: state.result, question: question, text: text, history: state.turns });
        var res = await engine.sample(prompt, {
          cache: false,
          onText: function (u) { bubble.textContent = u.text; }
        });
        answer = res.text;
      } else if (engine.mode === 'api') {
        var data = await postJSON('/api/ask', { language: language, result: state.result, question: question, text: text, history: state.turns });
        answer = data.answer;
      } else {
        throw { code: 'offline' };
      }
      bubble.textContent = answer;
      state.turns.push({ q: question, a: answer });
    } catch (e) {
      var copy = errorCopy(e);
      bubble.textContent = copy.title + ' ' + copy.text;
    }
  }

  // ---------- wiring ----------
  function buildLangSelect(id, value) {
    var sel = h('select', { class: 'select', id: id, name: id });
    W.LANGUAGES.forEach(function (l) {
      var o = h('option', { value: l.code, text: l.name });
      if (l.code === value) o.selected = true;
      sel.appendChild(o);
    });
    return sel;
  }

  function init() {
    var saved = safeGet('pw-lang');
    if (saved && W.LANGUAGES.some(function (l) { return l.code === saved; })) state.lang = saved;

    W.LANGUAGES.forEach(function (l) {
      var o = h('option', { value: l.code, text: l.name });
      if (l.code === state.lang) o.selected = true;
      els.lang.appendChild(o);
    });
    els.lang.addEventListener('change', function () { state.lang = els.lang.value; safeSet('pw-lang', state.lang); });

    SAMPLES.forEach(function (s) {
      els.examples.appendChild(h('button', {
        class: 'chip', type: 'button',
        onclick: function () { start({ kind: 'sample', sampleId: s.id, text: s.text }); }
      }, h('b', { text: s.title }), h('span', { text: s.hint })));
    });

    els.fileInput.addEventListener('change', function () {
      var picked = Array.prototype.slice.call(els.fileInput.files || []);
      els.fileInput.value = '';
      var files = picked.filter(function (f) { return /^image\//.test(f.type); });
      if (!files.length) { if (picked.length) toast('Choose a photo of the letter.'); return; }
      if (files.length > 4) { files = files.slice(0, 4); toast('Using the first 4 pages.'); }
      start({ kind: 'image', files: files });
    });

    els.pasteBtn.addEventListener('click', function () {
      var open = els.pastePanel.hidden;
      els.pastePanel.hidden = !open;
      els.pasteBtn.setAttribute('aria-expanded', String(open));
      if (open) els.pasteText.focus();
    });
    els.pasteCancel.addEventListener('click', function () {
      els.pastePanel.hidden = true; els.pasteBtn.setAttribute('aria-expanded', 'false');
    });
    els.pasteGo.addEventListener('click', function () {
      var t = els.pasteText.value.trim();
      if (t.length < 20) { toast('Paste a bit more of the letter first.'); els.pasteText.focus(); return; }
      start({ kind: 'text', text: t });
    });

    els.readingCancel.addEventListener('click', goHome);
    els.errorBack.addEventListener('click', goHome);
    els.errorRetry.addEventListener('click', function () { if (state.source) start(state.source); else goHome(); });
    els.backBtn.addEventListener('click', goHome);
    els.savedClear.addEventListener('click', function () {
      if (window.confirm('Remove all saved letters from this phone?')) { storeSaved([]); renderSaved(); }
    });
    els.brand.addEventListener('click', function (ev) { ev.preventDefault(); goHome(); });

    setEngineLabel();
    renderSaved();
  }

  init();
})();
