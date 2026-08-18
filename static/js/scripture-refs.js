// ─────────────────────────────────────────────────────────────────────────
// Shared "click-to-expand Scripture reference" system.
// Automatically detects Bible references (Book chapter:verse) in any text
// on the page and turns them into click-to-expand chips — the same chips
// Study Questions already use. There is no per-element opt-in: any text
// added or changed anywhere in the app is picked up by pattern alone, so
// nothing needs to be hand-marked as "this block has Scripture in it."
// ─────────────────────────────────────────────────────────────────────────
(function () {

  // All 66 canonical books (full names) + common abbreviations, mirroring the
  // server-side book resolver in engine/core.py (CANONICAL_BOOKS + ABBREV_INDEX).
  const BOOKS = [
    // Full canonical names
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm', 'Proverbs', 'Ecclesiastes',
    'Song of Solomon', 'Song of Songs',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation',
    // Common abbreviations
    'Gen', 'Ex', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Jos', 'Judg',
    '1 Sam', '2 Sam', '1 Kgs', '2 Kgs', '1 Chron', '2 Chron', '1 Chr', '2 Chr',
    'Ps', 'Psa', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Eze',
    'Dan', 'Hos', 'Obad', 'Jon', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
    'Matt', 'Mat', 'Mk', 'Lk', 'Jn',
    'Rom', '1 Cor', '2 Cor', 'Gal', 'Eph', 'Phil', 'Col',
    '1 Thess', '2 Thess', '1 Tim', '2 Tim', 'Tit', 'Phlm', 'Philem', 'Heb', 'Jas',
    '1 Pet', '2 Pet', '1 Jn', '2 Jn', '3 Jn', 'Rev'
  ];

  let _regex = null;
  function getBibleRefRegex() {
    if (!_regex) {
      const unique = [...new Set(BOOKS)].sort((a, b) => b.length - a.length);
      const pattern = unique.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      _regex = new RegExp(`\\b(${pattern})\\s(\\d{1,3}:\\d{1,3}(?:-\\d{1,3})?)`, 'g');
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
  const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'BUTTON', 'SVG']);

  function isExcluded(el) {
    while (el) {
      if (EXCLUDED_TAGS.has(el.tagName)) return true;
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
})();
