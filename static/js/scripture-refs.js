// ─────────────────────────────────────────────────────────────────────────
// Shared "click-to-expand Scripture reference" system.
// Automatically detects Bible references (Book chapter:verse) in any text
// on the page and turns them into click-to-expand chips — the same chips
// Study Questions already use. There is no per-element opt-in: any text
// added or changed anywhere in the app is picked up by pattern alone, so
// nothing needs to be hand-marked as "this block has Scripture in it."
// ─────────────────────────────────────────────────────────────────────────
(function () {

  let _regex = null;
  function getBibleRefRegex() {
    if (!_regex) {
      _regex = new RegExp(window.scriptureReferencePattern, 'gi');
    }
    _regex.lastIndex = 0;
    return _regex;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  let _chipCounter = 0;

  function makeChip(ref) {
    const n = _chipCounter++;
    const chipId = `sref-chip-${n}`;
    const panelId = `sref-panel-${n}`;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'q-ref-chip';
    chip.id = chipId;
    chip.title = `Click to read ${ref}`;
    chip.innerHTML = `${escapeHtml(ref)} <span style="font-size:0.7em; opacity:0.7;">▼</span>`;
    chip.addEventListener('click', () => window.toggleVersePanel(ref, panelId, chipId));

    const panel = document.createElement('div');
    panel.className = 'q-verse-panel';
    panel.id = panelId;
    panel.style.display = 'none';

    return [chip, panel];
  }

  // Tags/areas that must never be auto-linkified: form controls (would corrupt
  // typed values), script/style/svg internals, and chips/panels this system
  // already created (prevents re-wrapping its own output on repeat scans).
  const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'BUTTON', 'SVG', 'A']);

  function isExcluded(el) {
    while (el) {
      // SVG tagName is lowercase; HTML controls cannot be inserted into SVG text.
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') return true;
      if (EXCLUDED_TAGS.has(el.tagName)) return true;
      // Grid readings summarize logged passages; inline verse panels stretch the whole week.
      if (el.matches('.day-reading, .challenger-card-replica, .cc-session-evaluation-page')) return true;
      if (el.isContentEditable) return true;
      if (el.classList && (el.classList.contains('q-ref-chip') || el.classList.contains('q-verse-panel'))) return true;
      el = el.parentElement;
    }
    return false;
  }

  // Scans `root` for text nodes containing Bible references and replaces the
  // matched text in-place with click-to-expand chips. Safe to call repeatedly
  // (already-converted text has moved into chip buttons, which are excluded
  // from re-scanning) and requires no markup changes anywhere else.
  function linkifyScriptureRefsIn(root) {
    root = root || document.body;
    const regex = getBibleRefRegex();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (isExcluded(node.parentElement)) return NodeFilter.FILTER_REJECT;
        regex.lastIndex = 0;
        return regex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const targets = [];
    let n;
    while ((n = walker.nextNode())) targets.push(n);

    targets.forEach(textNode => {
      const text = textNode.nodeValue;
      regex.lastIndex = 0;
      // Wrap the whole run in one inline <span> rather than splicing loose
      // sibling nodes into the parent — some containers (e.g. flex rows)
      // lay out each direct child as its own item, which would otherwise
      // stretch/distort the chip. A single wrapper keeps the child count
      // (and therefore the parent's layout) exactly as it was before.
      const wrapper = document.createElement('span');
      let lastIndex = 0;
      let m;
      while ((m = regex.exec(text)) !== null) {
        const ref = `${m[1]} ${m[2]}`;
        if (m.index > lastIndex) wrapper.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        const [chip, panel] = makeChip(ref);
        wrapper.appendChild(chip);
        wrapper.appendChild(panel);
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) wrapper.appendChild(document.createTextNode(text.slice(lastIndex)));
      textNode.parentNode.replaceChild(wrapper, textNode);
    });
  }

  // Toggles a verse panel open/closed, fetching verse text from the Bible API.
  window.toggleVersePanel = async function (ref, panelId, chipId) {
    const panel = document.getElementById(panelId);
    const chip = document.getElementById(chipId);
    if (!panel) return;

    if (panel.style.display !== 'none') {
      panel.style.display = 'none';
      panel.innerHTML = '';
      if (chip) chip.classList.remove('active');
      return;
    }

    panel.style.display = 'block';
    panel.innerHTML = `<div class="q-verse-loading">Loading ${ref}...</div>`;
    if (chip) chip.classList.add('active');

    try {
      const version = window.currentBibleVersion || 'NIV';
      const res = await fetch(`/api/bible/verse?ref=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`);

      if (!res.ok) {
        panel.innerHTML = `<div class="q-verse-error">Could not load <strong>${ref}</strong>. Try another translation.</div>`;
        return;
      }

      const data = await res.json();
      const versesHtml = (data.passages && data.passages.length > 0)
        ? data.passages.map(p => {
            const verses = p.verses_list && p.verses_list.length > 0
              ? p.verses_list.map(v => `<span class="q-verse-num">${v.num}</span>${v.text} `).join('')
              : p.text;
            return `<div class="q-verse-ref-label">${p.reference}</div><div class="q-verse-body">${verses}</div>`;
          }).join('')
        : `<div class="q-verse-body">${data.text || 'No text found.'}</div>`;

      panel.innerHTML = `
        <div class="q-verse-card">
          <div class="q-verse-translation">${data.version || version}</div>
          ${versesHtml}
        </div>`;
    } catch (e) {
      panel.innerHTML = `<div class="q-verse-error">Error loading verse. Please try again.</div>`;
    }
  };

  window.getBibleRefRegex = getBibleRefRegex;
  window.linkifyScriptureRefsIn = linkifyScriptureRefsIn;

  function observeReferences() {
    linkifyScriptureRefsIn(document.body);
    const observer = new MutationObserver(records => {
      const roots = new Set();
      records.forEach(record => {
        if (record.type === 'characterData') roots.add(record.target.parentElement);
        record.addedNodes.forEach(node => {
          roots.add(node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
        });
      });
      roots.forEach(root => {
        if (root && root.isConnected && !isExcluded(root)) linkifyScriptureRefsIn(root);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeReferences);
  } else {
    observeReferences();
  }
})();
