/* =====================================================
   today.js — Today Tab Logic
   Requires: app.js globals (appState, CBR_DATA, getActiveData, openDayModal)
===================================================== */

// Note: CBR Card scripture memory is dynamically extracted from CBR_DATA.sessions

// ── Toggle accordion open/close ──────────────────────────────────────────────
function toggleAccord(id) {
  const body    = document.getElementById('today-accord-body-' + id);
  const chevron = document.getElementById('today-chevron-' + id);
  const header  = body ? body.previousElementSibling : null;
  if (!body || !chevron) return;

  const isOpen = body.style.display !== 'none';
  body.style.display    = isOpen ? 'none' : 'block';
  chevron.classList.toggle('open', !isOpen);
  if (header) header.setAttribute('aria-expanded', String(!isOpen));

  if (!isOpen && id === 'memory' && window.currentMemoryRef) {
    fetchAndDisplayMemoryVerse(window.currentMemoryRef, window.currentBibleVersion || 'NIV');
  }
  if (!isOpen && id === 'daily' && window.currentDailyRef) {
    fetchAndDisplayDailyVerse(window.currentDailyRef, 'NIV');
  }
}

// Legacy alias kept for backward compatibility
window.toggleStudyQuestions = function() { toggleAccord('questions'); };

// ── Scripture Memory Version Dropdown & Full Text Fetching ───────────────────
window.currentBibleVersion = 'NIV';
window.currentMemoryRef = '';

window.changeBibleVersion = function(version) {
  window.currentBibleVersion = version;
  document.querySelectorAll('#today-bible-version-capsules .version-capsule').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ver') === version);
  });
  if (window.currentMemoryRef) {
    fetchAndDisplayMemoryVerse(window.currentMemoryRef, version);
  }
};

async function fetchAndDisplayMemoryVerse(ref, version = 'NIV') {
  if (!ref || ref === 'Assigned Scripture') return;
  const vText = document.getElementById('today-verse-text');
  const vRef  = document.getElementById('today-verse-ref');

  document.querySelectorAll('#today-bible-version-capsules .version-capsule').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ver') === version);
  });

  if (!window.versionsLoaded) {
    window.versionsLoaded = true;
    try {
      const vRes = await fetch('/api/bible/versions');
      if (vRes.ok) {
        const vData = await vRes.json();
        const container = document.getElementById('today-bible-version-capsules');
        if (container && vData.versions && vData.versions.length > 0) {
          container.innerHTML = vData.versions.map(v => 
            `<button class="version-capsule ${v.code === version ? 'active' : ''}" data-ver="${v.code}" onclick="changeBibleVersion('${v.code}')">${v.code}</button>`
          ).join('');
        }
      }
    } catch (e) {}
  }

  if (vText && !vText.textContent.includes('"') && !vText.innerHTML.includes('passage-block')) {
    vText.innerHTML = `<span style="opacity:0.6; font-style:italic;">Loading ${version}...</span>`;
  }

  try {
    const res = await fetch(`/api/bible/verse?ref=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`);
    if (res.ok) {
      const data = await res.json();
      window.currentVerseData = data;
      if (vRef) vRef.textContent = `${data.reference} (${data.version})`;
      
      if (data.passages && data.passages.length > 0) {
        if (vText) {
          vText.innerHTML = `<div style="display: flex; flex-direction: column; gap: 1.4rem; margin-top: 0.4rem; width: 100%;">` +
            data.passages.map(p => {
              const formattedText = p.verses_list && p.verses_list.length > 0
                ? p.verses_list.map(v => `<span style="display: inline;"><strong style="color: var(--primary, #d4af37); font-style: normal; font-weight: 700; font-size: 0.83em; margin-right: 4px; user-select: none;">${v.num}</strong>${v.text}</span>`).join(' ')
                : `"${p.text}"`;
              return `
                <div class="passage-block" style="border-left: 3px solid var(--primary, #d4af37); padding: 0.25rem 0 0.25rem 0.95rem; text-align: left;">
                  <div style="font-weight: 800; font-size: 0.96rem; color: var(--primary, #d4af37); margin-bottom: 0.45rem; letter-spacing: 0.02em;">[${p.reference}]</div>
                  <div style="font-style: italic; font-size: 0.95rem; line-height: 1.7; color: var(--text-primary);">${formattedText}</div>
                </div>
              `;
            }).join('') + `</div>`;
        }
      } else {
        if (vText) vText.textContent = `"${data.text}"`;
      }
    } else {
      if (vRef) vRef.textContent = `${ref} (${version})`;
      if (vText && vText.innerHTML.includes('Loading')) vText.textContent = `"${ref} — Recite and pray back as part of your daily discipline."`;
    }
  } catch (e) {
    if (vRef) vRef.textContent = `${ref} (${version})`;
    if (vText && vText.innerHTML.includes('Loading')) vText.textContent = `"${ref} — Recite and pray back as part of your daily discipline."`;
  }
}

// Helper to pre-calculate wrapped lines for dynamic scaling
function getWrappedLinesList(ctx, text, maxW) {
  const paragraphs = text.split(/\n+/);
  const lines = [];
  for (const p of paragraphs) {
    if (!p.trim()) { lines.push(''); continue; }
    const words = p.trim().split(/\s+/);
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && i > 0) {
        lines.push(line.trim());
        line = words[i] + ' ';
      } else { line = test; }
    }
    if (line.trim()) lines.push(line.trim());
    lines.push(''); // spacing after paragraph
  }
  return lines;
}

// ── Download verse card as PNG (Dynamically Scaled & Separated) ──────────────
function downloadVerseCard() {
  const canvas  = document.getElementById('today-verse-canvas');
  const refEl   = document.getElementById('today-verse-ref');
  const textEl  = document.getElementById('today-verse-text');
  if (!canvas || !refEl || !textEl) return;

  const W = 1200;
  const isDark  = !document.body.classList.contains('light-mode');
  const bg      = isDark ? '#080d17' : '#f0f4f8';
  const accent  = '#f59e0b';
  const textCol = isDark ? '#f0f4ff' : '#0f172a';
  const mutedCol= isDark ? '#94a3b8' : '#475569';

  // Temporary context to measure and calculate dynamic height
  const tempCtx = canvas.getContext('2d');
  
  // Decide font size and line height based on text amount
  let fontSize = 38;
  let lineH = 52;
  const passages = (window.currentVerseData && window.currentVerseData.passages) ? window.currentVerseData.passages : null;
  
  tempCtx.font = `italic 500 ${fontSize}px Georgia, serif`;
  let totalContentLines = 0;
  
  if (passages && passages.length > 0) {
    for (const p of passages) {
      totalContentLines += 1; // passage title line
      totalContentLines += getWrappedLinesList(tempCtx, p.text, W - 200).length;
    }
  } else {
    const rawText = textEl.textContent.replace(/^"/, '').replace(/"$/, '');
    totalContentLines = getWrappedLinesList(tempCtx, rawText, W - 200).length;
  }

  // Adjust font if passage is very long
  if (totalContentLines > 16) { fontSize = 32; lineH = 44; }
  if (totalContentLines > 24) { fontSize = 28; lineH = 38; }

  // Dynamically scale height H so all text + padding + footer fit perfectly inside card box
  const calculatedHeight = 220 + (totalContentLines * lineH) + 140;
  const H = Math.max(630, calculatedHeight);

  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Amber glow blob
  const grad = ctx.createRadialGradient(W * 0.85, H * 0.15, 10, W * 0.85, H * 0.15, 350);
  grad.addColorStop(0, 'rgba(245,158,11,0.18)');
  grad.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Card panel (dynamically sized)
  ctx.fillStyle = isDark ? 'rgba(30,41,59,0.6)' : '#ffffff';
  roundRect(ctx, 60, 60, W - 120, H - 120, 28);
  ctx.fill();

  // Left amber accent bar
  ctx.fillStyle = accent;
  roundRect(ctx, 60, 60, 8, H - 120, [28, 0, 0, 28]);
  ctx.fill();

  // Main Card Header Ref text
  ctx.fillStyle = accent;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText(refEl.textContent, 110, 150);

  // Draw passages separated cleanly
  let currY = 220;
  if (passages && passages.length > 0) {
    for (const p of passages) {
      // Draw passage subheader in amber bold above the text
      ctx.fillStyle = accent;
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillText(`[${p.reference}]`, 110, currY);
      currY += lineH * 0.9;

      // Draw passage text starting below the title with gold verse numbers
      currY = wrapTextFormattedCanvas(ctx, p.text, 110, currY, W - 200, lineH, fontSize, accent, textCol);
      currY += lineH * 0.6; // space after passage before next
    }
  } else {
    const rawText = textEl.textContent.replace(/^"/, '').replace(/"$/, '');
    currY = wrapTextFormattedCanvas(ctx, rawText, 110, currY, W - 200, lineH, fontSize, accent, textCol);
  }

  // Footer inside the box at the bottom
  ctx.fillStyle = mutedCol;
  ctx.font = '500 24px system-ui, sans-serif';
  ctx.fillText('CBRSM Challenger · Daily Scripture Memory', 110, H - 90);

  // Trigger Download
  const fileName = (refEl.textContent || 'verse').replace(/\s/g, '-') + '.png';
  canvas.toBlob(blob => {
    if (!blob) {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  }, 'image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + r[0], y);
  ctx.arcTo(x + w, y,     x + w, y + h, r[1]);
  ctx.arcTo(x + w, y + h, x,     y + h, r[2]);
  ctx.arcTo(x,     y + h, x,     y,     r[3]);
  ctx.arcTo(x,     y,     x + w, y,     r[0]);
  ctx.closePath();
}

function wrapTextFormattedCanvas(ctx, text, x, y, maxW, lineH, fontSize, accentCol, textCol) {
  const paragraphs = text.split(/\n+/);
  for (const p of paragraphs) {
    if (!p.trim()) { y += lineH * 0.6; continue; }
    const words = p.trim().split(/\s+/);
    let currX = x;
    
    const normalFont = `italic 500 ${fontSize}px Georgia, serif`;
    const numberFont = `bold ${Math.round(fontSize * 0.82)}px system-ui, sans-serif`;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isNum = /^\d+[\.\-]?$/.test(word);
      
      ctx.font = isNum ? numberFont : normalFont;
      const wWidth = ctx.measureText(word + ' ').width;
      
      if (currX + wWidth > x + maxW && currX > x) {
        currX = x;
        y += lineH;
      }
      
      if (isNum) {
        ctx.fillStyle = accentCol;
        ctx.font = numberFont;
        ctx.fillText(word, currX, y - 2);
        currX += wWidth + 4;
      } else {
        ctx.fillStyle = textCol;
        ctx.font = normalFont;
        ctx.fillText(word, currX, y);
        currX += wWidth;
      }
    }
    y += lineH * 1.3;
  }
  return y;
}

// Legacy alias kept for backward compatibility
window.wrapText = wrapTextFormattedCanvas;

// Normalize raw or single-field journal text (e.g. FACT / INSIGHT / DEED or pasted WhatsApp notes) into clean fields
function _normalizeDayDataJournal(dayData) {
  if (!dayData) return dayData;
  const combined = [dayData.fidFocus, dayData.fidInsight, dayData.fidDoing, dayData.difDiscovery, dayData.difInsight, dayData.difFruit, dayData.journalNotes].filter(Boolean).join('\n');
  if (/\b(?:FACT|INSIGHT|DEED|FOCUS|DISCOVERY|DOING|FRUIT)\b/i.test(combined)) {
    const factMatch = combined.match(/(?:FACT|FOCUS|DISCOVERY|D\/F|F\/D|F[\s;:\-]|D[\s;:\-])[\s;:\-]*([\s\S]*?)(?=(?:INSIGHT|INTERPRETATION|DEED|DOING|FRUIT|APPLICATION|OBSERVATION|PRINCIPLES|EXPERIENCE|NEED|NOTE|PRAYER|$))/i);
    const insightMatch = combined.match(/(?:INSIGHT|INTERPRETATION|I[\s;:\-])[\s;:\-]*([\s\S]*?)(?=(?:DEED|DOING|FRUIT|APPLICATION|FACT|FOCUS|DISCOVERY|OBSERVATION|PRINCIPLES|EXPERIENCE|NEED|NOTE|PRAYER|$))/i);
    const deedMatch = combined.match(/(?:DEED|DOING|FRUIT|APPLICATION|ACTION|D[\s;:\-]|F[\s;:\-])[\s;:\-]*([\s\S]*?)(?=(?:INSIGHT|INTERPRETATION|FACT|FOCUS|DISCOVERY|OBSERVATION|PRINCIPLES|EXPERIENCE|NEED|NOTE|PRAYER|$))/i);
    
    if (factMatch || insightMatch || deedMatch) {
      if (factMatch && factMatch[1].trim()) { dayData.fidFocus = factMatch[1].trim(); dayData.difDiscovery = factMatch[1].trim(); }
      if (insightMatch && insightMatch[1].trim()) { dayData.fidInsight = insightMatch[1].trim(); dayData.difInsight = insightMatch[1].trim(); }
      if (deedMatch && deedMatch[1].trim()) { dayData.fidDoing = deedMatch[1].trim(); dayData.difFruit = deedMatch[1].trim(); }
      
      dayData.studyMethod = 'FID';
      dayData.openObservation = ""; dayData.openPrinciples = ""; dayData.openExperience = ""; dayData.openNeed = "";
      dayData.personsPersonal = ""; dayData.personsEnglish = ""; dayData.personsReferences = ""; dayData.personsSatan = "";
      dayData.personsObedience = ""; dayData.personsNote = ""; dayData.personsStirring = "";
      
      dayData.journalNotes = "";
    }
  }
  return dayData;
}

// Helper: Returns current local YYYY-MM-DD instead of UTC (prevents lag after midnight)
function _getLocalTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Render Today Tab ─────────────────────────────────────────────────────────
function renderToday() {
  const data = window.getActiveData ? getActiveData() : null;
  if (!data) return;

  const card = (typeof CBR_DATA !== 'undefined' && CBR_DATA.cards)
    ? CBR_DATA.cards.find(c => c.cardId === data.currentCardId) || CBR_DATA.cards[0]
    : null;
  if (!card) return;

  // ── Day Number ──────────────────────────────────────────────────────────────
  const todayStr = _getLocalTodayStr();
  let dayNum = 1;
  if (data.commencingDate) {
    const diff = Math.floor((new Date(todayStr) - new Date(data.commencingDate)) / 86400000);
    if (diff >= 0 && diff < 28) dayNum = diff + 1;
    else if (diff >= 28) dayNum = 28;
  }

  const dayDataRaw = (data.days || []).find(d => d.dayNumber === dayNum) || {};
  const dayData = _normalizeDayDataJournal(dayDataRaw);

  // ── Header ──────────────────────────────────────────────────────────────────
  const dateH = document.getElementById('today-date-heading');
  if (dateH) dateH.innerText = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  const sub = document.getElementById('today-cycle-sub');
  if (sub) sub.innerText = `Day ${dayNum} of 28 • Week ${Math.ceil(dayNum/7)} • Card #${card.cardId}`;

  // ── Targets ──────────────────────────────────────────────────────────────────
  const rt = document.getElementById('today-reading-target');
  if (rt) rt.textContent = `Target: ${card.chaptersTarget} Chapter${card.chaptersTarget > 1 ? 's' : ''}`;

  const wt = document.getElementById('today-waking-target');
  if (wt) wt.textContent = `Limit: ${card.ertTarget}`;

  const jt = document.getElementById('today-journal-method-title');
  const journalMethodName = card.cardId >= 4 ? 'Bible Study (OPEN Method)' : 'Daily Reflection (FID Method)';
  if (jt) jt.textContent = card.cardId >= 4 ? 'Bible Study (OPEN)' : 'Devotional Journal';

  const journalHeaderTitle = document.getElementById('today-journal-header-title');
  if (journalHeaderTitle) {
    journalHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Devotional Journal</div><div style="font-size:0.73rem; font-weight:600; color:var(--text-muted); line-height:1.25; margin-top:0.15rem;">${journalMethodName}</div>`;
  }

  // ── Status Badges ────────────────────────────────────────────────────────────
  const totalCh = (dayData.morningChapters || 0) + (dayData.laterChapters || 0);
  _setStatus('today-status-reading',
    totalCh >= card.chaptersTarget ? ['completed', `Done (${totalCh} ch)`] :
    totalCh > 0                    ? ['partial',   `${totalCh}/${card.chaptersTarget} ch`] :
                                     ['pending',   'Pending']);

  const hasJournal = Boolean((dayData.journalNotes && dayData.journalNotes.trim()) || 
    dayData.fidFocus || dayData.fidInsight || dayData.fidDoing || dayData.difDiscovery || dayData.difFruit ||
    dayData.openObservation || dayData.personsPersonal);
  _setStatus('today-status-journal', hasJournal ? ['completed', 'Recorded'] : ['pending', 'No Entry']);

  const journalDetails = document.getElementById('today-details-journal');
  const journalActions = document.getElementById('today-journal-actions');
  if (journalActions) {
    journalActions.style.display = hasJournal ? 'flex' : 'none';
  }

  if (journalDetails) {
    if (hasJournal) {
      let html = '';
      const method = (dayData.studyMethod || 'FID').toUpperCase();
      if (method === 'OPEN') {
        if (dayData.openObservation) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">O — Observation:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.openObservation}</span></div>`;
        if (dayData.openPrinciples) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">P — Principles:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.openPrinciples}</span></div>`;
        if (dayData.openExperience) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">E — Experience:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.openExperience}</span></div>`;
        if (dayData.openNeed) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">N — Need:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.openNeed}</span></div>`;
      } else if (method === 'PERSONS') {
        if (dayData.personsPersonal) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">P — Personal:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsPersonal}</span></div>`;
        if (dayData.personsEnglish) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">E — English:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsEnglish}</span></div>`;
        if (dayData.personsReferences) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">R — References:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsReferences}</span></div>`;
        if (dayData.personsSatan) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">S — Satan:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsSatan}</span></div>`;
        if (dayData.personsObedience) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">O — Obedience:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsObedience}</span></div>`;
        if (dayData.personsNote) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">N — Note:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsNote}</span></div>`;
        if (dayData.personsStirring) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">S — Stirring:</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dayData.personsStirring}</span></div>`;
      } else {
        const dText = dayData.difDiscovery || dayData.fidFocus;
        const iText = dayData.difInsight || dayData.fidInsight;
        const fText = dayData.difFruit || dayData.fidDoing;
        if (dText) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">FACT / FOCUS (DISCOVERY):</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${dText}</span></div>`;
        if (iText) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">INSIGHT (GOD'S TRUTH):</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${iText}</span></div>`;
        if (fText) html += `<div style="margin-bottom:0.65rem;"><strong style="color:var(--primary, #d4af37); font-size: 0.85rem; letter-spacing: 0.02em;">DEED / DOING (FRUIT):</strong><br><span style="color:var(--text-primary); line-height: 1.6; display:inline-block; margin-top:0.15rem;">${fText}</span></div>`;
      }
      journalDetails.innerHTML = html || '<p class="accord-empty">Method selected but no text written.</p>';
    } else {
      journalDetails.innerHTML = '<p class="accord-empty">No journal entry recorded for today. Click "Log Entry" to write your reflection.</p>';
    }
  }

  // ── Prayer & Fellowship (now a top card) ────────────────────────────────────
  _setStatus('today-status-pe', ['reminder', 'Reminder']);

  if (dayData.wakingTime) {
    const late = dayData.wakingTime > card.ertTarget;
    _setStatus('today-status-waking', late ? ['late', `Late (${dayData.wakingTime})`] : ['completed', `On Time (${dayData.wakingTime})`]);
  } else {
    _setStatus('today-status-waking', ['pending', 'Not Logged']);
  }

  _setStatus('today-status-barriers',
    dayData.cbId ? ['late', `CB ${dayData.cbId}`] : ['clear', 'Clear']);

  // ── Daily Chapter Reading ──────────────────────────────────────────────────
  const storedChapter = appState.dailyReadingChapter || 'Psalm 119';
  
  let readingDayIndex = dayNum;
  if (data && data.commencingDate) {
    const overrideStartStr = "2026-07-13";
    const overrideEndStr = "2026-08-02";
    if (todayStr >= overrideStartStr && todayStr <= overrideEndStr) {
      readingDayIndex = Math.floor((new Date(todayStr) - new Date(overrideStartStr)) / 86400000) + 1;
    } else if (todayStr < overrideStartStr && todayStr >= "2026-07-06") {
      readingDayIndex = 0;
    }
  }

  let dailyRef = "";
  let targetText = "";

  if (readingDayIndex <= 0) {
      dailyRef = `${storedChapter}:1-7`;
      targetText = `Target: Starts Tomorrow`;
  } else {
      const startVerse = (readingDayIndex - 1) * 7 + 1;
      const endVerse = readingDayIndex * 7;
      dailyRef = `${storedChapter}:${startVerse}-${endVerse}`;
      targetText = `Target: verses ${startVerse}-${endVerse}`;
  }
  
  const dailyTitle = document.getElementById('today-daily-title');
  const dailyTarget = document.getElementById('today-daily-target');
  const dailyInput = document.getElementById('today-daily-chapter-input');
  
  const dailyRefEl = document.getElementById('today-daily-ref');
  const dailyTextEl = document.getElementById('today-daily-text');
  
  window.currentDailyRef = readingDayIndex > 0 ? dailyRef : null;
  window.currentDailyChapter = storedChapter;
  window.readingDayIndex = readingDayIndex;
  
  if (dailyTitle) dailyTitle.textContent = storedChapter;
  if (dailyTarget) dailyTarget.textContent = targetText;
  if (dailyInput) dailyInput.value = storedChapter;
  
  if (readingDayIndex <= 0) {
      if (dailyRefEl) dailyRefEl.textContent = "Starts Tomorrow";
      if (dailyTextEl) dailyTextEl.innerHTML = `<p class="today-accord-empty">Your Daily Chapter reading will begin starting tomorrow, syncing your 7-verse increments perfectly for this month!</p>`;
  } else {
      if (dailyRefEl && dailyRefEl.textContent === 'Loading...') dailyRefEl.textContent = "Click to Load Verses";
      if (dailyTextEl && dailyTextEl.innerHTML.includes('Loading')) dailyTextEl.innerHTML = `<p class="today-accord-empty">Open this accordion to fetch your verses for today.</p>`;
  }

  // ── Accordion details: Prayer & Fellowship ────────────────────────────────────
  const detPe = document.getElementById('today-details-pe');
  if (detPe) {
    if (dayData.prayerTopic) {
      detPe.innerHTML = `<p style="font-size:0.88rem; color:var(--text-secondary); margin:0;"><strong style="color:var(--morning-read);">Prayer Topic:</strong> ${dayData.prayerTopic}</p>`;
    } else {
      detPe.innerHTML = `<p class="today-accord-empty">Share your devotional entries with your Personal Encouragers (PE) group weekly for +1 Accountability point.</p>`;
    }
  }

  // ── Scripture Memory Card (Real Data) ───────────────────────────────────────
  let memRef = "Syllabus Memory Verse";
  let memText = "Review the required verses from your Bible.";
  
  if (typeof CBR_DATA !== 'undefined' && CBR_DATA.sessions) {
    const session = CBR_DATA.sessions.find(s => s.cardIndex === (card.cardId - 1));
    if (session) {
      const memActivity = session.activities.find(a => a.text.toLowerCase().includes('memorize'));
      if (memActivity) {
        memRef = memActivity.text.replace(/Memorize\s+(and\s+[Pp]ray\s+back\s+)?/i, '').replace(/\.$/, '');
        memText = "Recite and pray back these scriptures as part of your daily discipline.";
      }
    }
  }

  const vRef  = document.getElementById('today-verse-ref');
  const vText = document.getElementById('today-verse-text');
  window.currentMemoryRef = memRef;
  if (vRef)  vRef.textContent  = memRef;
  if (vText) vText.textContent = memText;
  if (memRef && memRef !== 'Syllabus Memory Verse') {
    fetchAndDisplayMemoryVerse(memRef, window.currentBibleVersion || 'NIV');
  }

  const memHeaderTitle = document.getElementById('today-memory-header-title');
  if (memHeaderTitle) {
    if (memRef && memRef !== 'Assigned Scripture') {
      memHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Scripture Memory</div><div style="font-size:0.73rem; font-weight:600; color:var(--text-muted); line-height:1.25; margin-top:0.15rem;">${memRef}</div>`;
    } else {
      memHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Scripture Memory</div>`;
    }
  }

  const memStatus = document.getElementById('today-status-memory');
  if (memStatus) {
    if (dayData.recitedMemory) {
      memStatus.className = 'today-status completed';
      memStatus.textContent = 'Recited';
    } else {
      memStatus.className = 'today-status pending';
      memStatus.textContent = 'Recite';
    }
  }

  // ── Study Questions ───────────────────────────────────────────────────────────
  const qList = document.getElementById('today-questions-list');
  const qHeaderTitle = document.getElementById('today-questions-header-title');
  if (qList) {
    const lesson = (typeof CBR_DATA !== 'undefined' && CBR_DATA.lessons)
      ? CBR_DATA.lessons.find(l => l.lessonIndex === card.cardId)
      : null;

    // Store for download function access
    window._currentLesson = lesson;

    if (qHeaderTitle) {
      if (lesson && lesson.title) {
        qHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Study Questions</div><div style="font-size:0.73rem; font-weight:600; color:var(--text-muted); line-height:1.25; margin-top:0.15rem;">${lesson.title}</div>`;
      } else {
        qHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Study Questions</div>`;
      }
    }

    if (lesson && lesson.questions && lesson.questions.length > 0) {
      qList.innerHTML = lesson.questions.map((q, qi) => {
        const annotated = _annotateQuestionRefs(q, qi);
        return `
          <li style="list-style-type: decimal; padding: 0.1rem 0; line-height: 1.75; color: var(--text-primary); font-size: 0.9rem;">
            <div class="q-text">${annotated}</div>
            <div class="q-verse-panels" id="q-panels-${qi}"></div>
            <button class="q-download-btn" onclick="downloadStudyQuestion(${qi})" title="Download Question ${qi+1} as PNG">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Q${qi+1}
            </button>
          </li>`;
      }).join('');
    } else {
      qList.innerHTML = '<li style="list-style:none; color:var(--text-muted);">No questions available for this session.</li>';
    }
  }

  // ── Log button ────────────────────────────────────────────────────────────────
  const btn = document.getElementById('btn-today-log');
  if (btn) {
    const hasLogged = totalCh > 0 || hasJournal || dayData.wakingTime || dayData.cbId || dayData.prayerTopic;
    btn.innerHTML = hasLogged
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Edit Entry`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Log Entry`;
    // Event listener is now handled natively via the inline onclick attribute in today.html
  }
}

function _setStatus(id, [cls, text]) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'today-status ' + cls;
  el.textContent = text;
}

// ── Devotional Journal Export Helpers ────────────────────────────────────────

function _getFormattedJournalText() {
  const data = window.getActiveData ? getActiveData() : null;
  if (!data) return "";
  const todayStr = _getLocalTodayStr();
  let dayNum = 1;
  if (data.commencingDate) {
    const diff = Math.floor((new Date(todayStr) - new Date(data.commencingDate)) / 86400000);
    if (diff >= 0 && diff < 28) dayNum = diff + 1;
    else if (diff >= 28) dayNum = 28;
  }
  const dayDataRaw = (data.days || []).find(d => d.dayNumber === dayNum) || {};
  const dayData = _normalizeDayDataJournal(dayDataRaw);
  const method = (dayData.studyMethod || 'FID').toUpperCase();
  
  let text = `*CBRSM Challenger Devotional Journal - Day ${dayNum}*\n`;
  const name = data.username && data.username !== "Trainee" ? data.username : "";
  const peg = data.peg || "";
  const cohort = data.cohort || "";
  let metaList = [];
  if (name) metaList.push(`*Name:* ${name}`);
  if (peg) metaList.push(`*PEG:* ${peg}`);
  if (cohort) metaList.push(`*Cohort:* ${cohort}`);
  if (metaList.length > 0) {
    text += `${metaList.join(' | ')}\n`;
  }
  if (method === 'OPEN') {
    if (dayData.openObservation) text += `\n*O — Observation:*\n${dayData.openObservation}\n`;
    if (dayData.openPrinciples) text += `\n*P — Principles:*\n${dayData.openPrinciples}\n`;
    if (dayData.openExperience) text += `\n*E — Experience:*\n${dayData.openExperience}\n`;
    if (dayData.openNeed) text += `\n*N — Need:*\n${dayData.openNeed}\n`;
  } else if (method === 'PERSONS') {
    if (dayData.personsPersonal) text += `\n*P — Personal:*\n${dayData.personsPersonal}\n`;
    if (dayData.personsEnglish) text += `\n*E — English:*\n${dayData.personsEnglish}\n`;
    if (dayData.personsReferences) text += `\n*R — References:*\n${dayData.personsReferences}\n`;
    if (dayData.personsSatan) text += `\n*S — Satan:*\n${dayData.personsSatan}\n`;
    if (dayData.personsObedience) text += `\n*O — Obedience:*\n${dayData.personsObedience}\n`;
    if (dayData.personsNote) text += `\n*N — Note:*\n${dayData.personsNote}\n`;
    if (dayData.personsStirring) text += `\n*S — Stirring:*\n${dayData.personsStirring}\n`;
  } else {
    const dText = dayData.difDiscovery || dayData.fidFocus;
    const iText = dayData.difInsight || dayData.fidInsight;
    const fText = dayData.difFruit || dayData.fidDoing;
    if (dText) text += `\n*FACT / FOCUS (DISCOVERY):*\n${dText}\n`;
    if (iText) text += `\n*INSIGHT (GOD'S TRUTH):*\n${iText}\n`;
    if (fText) text += `\n*DEED / DOING (FRUIT):*\n${fText}\n`;
  }
  return text.trim();
}

function copyJournalText() {
  const text = _getFormattedJournalText();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === 'function') showToast("Devotional journal copied to clipboard!", "success");
  }).catch(err => {
    console.error("Copy failed:", err);
    if (typeof showToast === 'function') showToast("Failed to copy text.", "error");
  });
}

function shareJournalWhatsApp() {
  const text = _getFormattedJournalText();
  if (!text) return;
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

async function downloadJournalImage() {
  const canvas = document.getElementById('today-journal-canvas');
  const data = window.getActiveData ? getActiveData() : null;
  if (!canvas || !data) return;

  // Ensure Patrick Hand font is fully loaded across all sizes before canvas measures or draws
  try {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load('48px "Patrick Hand"');
      await document.fonts.load('46px "Patrick Hand"');
      await document.fonts.load('44px "Patrick Hand"');
      await document.fonts.load('34px "Patrick Hand"');
      await document.fonts.load('32px "Patrick Hand"');
      await document.fonts.load('30px "Patrick Hand"');
      await document.fonts.load('26px "Patrick Hand"');
    }
  } catch (e) {
    console.warn("Could not load Patrick Hand font explicitly:", e);
  }

  const isDark = !document.body.classList.contains('light-mode');
  const todayStr = _getLocalTodayStr();
  let dayNum = 1;
  if (data.commencingDate) {
    const diff = Math.floor((new Date(todayStr) - new Date(data.commencingDate)) / 86400000);
    if (diff >= 0 && diff < 28) dayNum = diff + 1;
    else if (diff >= 28) dayNum = 28;
  }
  const dayDataRaw = (data.days || []).find(d => d.dayNumber === dayNum) || {};
  const dayData = _normalizeDayDataJournal(dayDataRaw);
  const method = (dayData.studyMethod || 'FID').toUpperCase();

  let sections = [];
  const addSection = (label, val) => {
    if (!val) return;
    sections.push({ label, text: val });
  };

  if (method === 'OPEN') {
    addSection('O — OBSERVATION', dayData.openObservation);
    addSection('P — PRINCIPLES', dayData.openPrinciples);
    addSection('E — EXPERIENCE', dayData.openExperience);
    addSection('N — NEED', dayData.openNeed);
  } else if (method === 'PERSONS') {
    addSection('P — PERSONAL', dayData.personsPersonal);
    addSection('E — ENGLISH', dayData.personsEnglish);
    addSection('R — REFERENCES', dayData.personsReferences);
    addSection('S — SATAN', dayData.personsSatan);
    addSection('O — OBEDIENCE', dayData.personsObedience);
    addSection('N — NOTE', dayData.personsNote);
    addSection('S — STIRRING', dayData.personsStirring);
  } else {
    addSection('FACT / FOCUS (DISCOVERY)', dayData.difDiscovery || dayData.fidFocus);
    addSection('INSIGHT (GOD\'S TRUTH)', dayData.difInsight || dayData.fidInsight);
    addSection('DEED / DOING (FRUIT)', dayData.difFruit || dayData.fidDoing);
  }

  // ── Dimensions & Table + Page Composition ──────────────────────────────────
  const W         = 1280;
  const SCALE     = 2;
  const TABLE_PAD = 120;
  const PAGE_X    = TABLE_PAD;
  const PAGE_Y    = TABLE_PAD;
  const PAGE_W    = W - TABLE_PAD * 2;

  const C_TABLE_BG    = isDark ? '#080d17' : '#231b15';
  const C_PAGE_BG     = isDark ? '#0b1220' : '#fdfcf8';
  const C_RULE_LINE   = isDark ? 'rgba(255, 255, 255, 0.08)' : '#c3cedd';
  const C_MARGIN_LINE = isDark ? '#e11d48' : '#d99a9a';
  const C_DOT_BG      = isDark ? '#1e293b' : '#eceadd';
  const C_DOT_BORDER  = isDark ? '#334155' : '#cfc9b8';
  const C_VERSE_NUM   = isDark ? '#fbbf24' : '#9a3b3b';
  const C_INK_MAIN    = isDark ? '#f1f5f9' : '#1e293b';
  const C_INK_TOPIC   = isDark ? '#d4af37' : '#1e293b';
  const C_INK_SUB     = isDark ? '#94a3b8' : '#4b5563';
  const C_BORDER      = isDark ? '#1e293b' : '#d9d4c4';

  const MARG_LINE_X = PAGE_X + 112;
  const VERSE_X     = MARG_LINE_X + 16;
  const DOTS_X      = PAGE_X + 44;
  const FONT_HAND   = '"Patrick Hand", cursive';
  const LINE_H      = 68;

  // Measure wrapped section text inside the page bounds
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `400 44px ${FONT_HAND}`;
  const TEXT_MAX_W = PAGE_W - (VERSE_X - PAGE_X) - 36;
  function wrapWords(c, text, maxW) {
    const words = (text || '').split(' ');
    const lines = []; let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else { line = t; }
    }
    if (line) lines.push(line);
    return lines;
  }

  const renderedSections = sections.map(s => {
    return { label: s.label, lines: wrapWords(tempCtx, s.text, TEXT_MAX_W) };
  });

  // Calculate exact body row count so that top header and bottom footer are strictly 2 lines in height (136px = 2 * LINE_H) each
  const numRows = Math.max(renderedSections.reduce((acc, s) => acc + (1 + s.lines.length + 1), 0), 4);
  const PAGE_H = (2 + numRows + 2) * LINE_H; // Exactly 2 lines top header (136px) + body grid rows + 2 lines bottom footer (136px)
  const H = PAGE_H + TABLE_PAD * 2;

  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  function rrPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
  function fillRR(x, y, w, h, r) { rrPath(x,y,w,h,r); ctx.fill(); }
  function strokeRR(x, y, w, h, r) { rrPath(x,y,w,h,r); ctx.stroke(); }

  // 1. Desk background
  ctx.fillStyle = C_TABLE_BG;
  ctx.fillRect(0, 0, W, H);

  const PLANK_H = 180;
  for (let py = 0; py < H; py += PLANK_H) {
    const pGrad = ctx.createLinearGradient(0, py, 0, py + PLANK_H);
    if (isDark) {
      pGrad.addColorStop(0, '#0f172a');
      pGrad.addColorStop(0.5, '#080d17');
      pGrad.addColorStop(1, '#050811');
    } else {
      pGrad.addColorStop(0, '#2e241c');
      pGrad.addColorStop(0.5, '#231b15');
      pGrad.addColorStop(1, '#19130e');
    }
    ctx.fillStyle = pGrad;
    ctx.fillRect(0, py, W, PLANK_H);

    if (py + PLANK_H < H) {
      ctx.fillStyle = isDark ? '#020408' : '#0e0b09';
      ctx.fillRect(0, py + PLANK_H - 3, W, 3);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(0, py + PLANK_H, W, 1);
    }
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    for (let gy = py + 22; gy < py + PLANK_H - 12; gy += 24) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
  }

  const vig = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.25, W/2, H/2, Math.max(W,H)*0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // 2. Physical Book Page Thickness Stack
  ctx.save();
  for (let pOffset = 8; pOffset >= 2; pOffset -= 2) {
    ctx.fillStyle = isDark ? '#060a12' : '#ede9dd';
    fillRR(PAGE_X + pOffset, PAGE_Y + pOffset, PAGE_W, PAGE_H, 16);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    strokeRR(PAGE_X + pOffset, PAGE_Y + pOffset, PAGE_W, PAGE_H, 16);
  }
  ctx.restore();

  ctx.save();
  ctx.shadowColor   = isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur    = 54;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle     = C_PAGE_BG;
  fillRR(PAGE_X, PAGE_Y, PAGE_W, PAGE_H, 16);
  ctx.restore();

  ctx.strokeStyle = C_BORDER; ctx.lineWidth = 1.5;
  strokeRR(PAGE_X, PAGE_Y, PAGE_W, PAGE_H, 16);

  ctx.save();
  rrPath(PAGE_X, PAGE_Y, PAGE_W, PAGE_H, 16);
  ctx.clip();

  // Continuous horizontal ruled lines across the body writing area only (exactly numRows lines!)
  // Top 2-line header space (136px) and bottom 2-line footer space (136px) are unruled
  ctx.strokeStyle = C_RULE_LINE; ctx.lineWidth = 1;
  for (let ry = PAGE_Y + 136 + LINE_H; ry <= PAGE_Y + 136 + numRows * LINE_H; ry += LINE_H) {
    ctx.beginPath(); ctx.moveTo(PAGE_X + 110, ry); ctx.lineTo(PAGE_X + PAGE_W - 24, ry); ctx.stroke();
  }

  ctx.strokeStyle = C_MARGIN_LINE; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(MARG_LINE_X, PAGE_Y); ctx.lineTo(MARG_LINE_X, PAGE_Y + PAGE_H); ctx.stroke();

  for (let dy = PAGE_Y + 40; dy < PAGE_Y + PAGE_H - 30; dy += LINE_H) {
    ctx.save();
    ctx.shadowColor   = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur    = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.strokeStyle   = isDark ? '#475569' : '#94a3b8';
    ctx.lineWidth     = 5;
    ctx.lineCap       = 'round';
    ctx.beginPath();
    ctx.moveTo(DOTS_X - 4, dy);
    ctx.bezierCurveTo(DOTS_X - 28, dy - 8, DOTS_X - 28, dy + 12, DOTS_X - 4, dy + 4);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle   = C_DOT_BG;
    ctx.strokeStyle = C_DOT_BORDER;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(DOTS_X, dy, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // ── 3. Pure Handwritten Top Header Block (Two-Line Height Unruled Space = 136px) ──
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  ctx.fillStyle = C_INK_TOPIC;
  ctx.font      = `400 32px ${FONT_HAND}`;
  ctx.textAlign = 'left';
  ctx.fillText('CBR Challenger \u00b7 devotional journal reflection', VERSE_X, PAGE_Y + 50);

  ctx.fillStyle = C_INK_SUB;
  ctx.font      = `400 26px ${FONT_HAND}`;
  ctx.textAlign = 'right';
  ctx.fillText(todayDate, PAGE_X + PAGE_W - 36, PAGE_Y + 48);

  ctx.fillStyle = C_INK_MAIN;
  ctx.font      = `400 46px ${FONT_HAND}`;
  ctx.textAlign = 'left';
  ctx.fillText(`Day ${dayNum} Reflection`, VERSE_X, PAGE_Y + 118);

  ctx.fillStyle = C_INK_SUB;
  ctx.font      = `400 26px ${FONT_HAND}`;
  ctx.textAlign = 'right';
  ctx.fillText(`Study Method: ${method}`, PAGE_X + PAGE_W - 36, PAGE_Y + 114);

  // Double red separator rule forming the top horizontal border of the first text rule right at y = 130/136
  ctx.strokeStyle = C_MARGIN_LINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(MARG_LINE_X, PAGE_Y + 130); ctx.lineTo(PAGE_X + PAGE_W - 24, PAGE_Y + 130); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MARG_LINE_X, PAGE_Y + 136); ctx.lineTo(PAGE_X + PAGE_W - 24, PAGE_Y + 136); ctx.stroke();

  // ── 4. Handwritten Body Reflection Sections (Inside writing grid below double red rule) ──
  let currY = PAGE_Y + 188;
  if (renderedSections.length === 0) {
    ctx.fillStyle = C_INK_SUB;
    ctx.font      = `400 34px ${FONT_HAND}`;
    ctx.fillText('No journal entries recorded for today.', VERSE_X, currY);
  } else {
    renderedSections.forEach(sec => {
      ctx.fillStyle = C_VERSE_NUM;
      ctx.font      = `400 32px ${FONT_HAND}`;
      ctx.textAlign = 'left';
      ctx.fillText(`\u25b6  ${sec.label}`, VERSE_X, currY);
      currY += LINE_H;

      ctx.fillStyle = C_INK_MAIN;
      ctx.font      = `400 44px ${FONT_HAND}`;
      sec.lines.forEach(lineText => {
        ctx.fillText(lineText, VERSE_X + 24, currY);
        currY += LINE_H;
      });

      currY += LINE_H;
    });
  }

  // ── 5. Handwritten Footer (Exactly Two Lines in Height Unruled Space = 136px, Vertically & Horizontally Centered) ──
  const colCenterX = MARG_LINE_X + (PAGE_X + PAGE_W - MARG_LINE_X) / 2;
  ctx.fillStyle = C_INK_MAIN;
  ctx.font      = `400 30px ${FONT_HAND}`;
  ctx.textAlign = 'center';
  ctx.fillText('Read \u00b7 meditate \u00b7 pray \u00b7 journal', colCenterX, PAGE_Y + PAGE_H - 82);

  ctx.fillStyle = C_INK_SUB;
  ctx.font      = `400 24px ${FONT_HAND}`;
  ctx.fillText('cbr-challenger.com \u00b7 Consistency Bible Reading Challenge', colCenterX, PAGE_Y + PAGE_H - 42);

  ctx.restore();

  // ── 6. Download PNG ───────────────────────────────────────────────────────
  canvas.toBlob(blob => {
    const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `cbr-journal-day-${dayNum}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); if (blob) URL.revokeObjectURL(url); }, 150);
  }, 'image/png');
}

// ── Daily Chapter Reading Logic ──────────────────────────────────────────────
window.changeDailyChapter = function() {
  const input = document.getElementById('today-daily-chapter-input');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  
  if (window.appState) {
    appState.dailyReadingChapter = val;
    if (window.saveState) saveState();
  }
  
  if (window.updateTodayTab) updateTodayTab();
  
  if (window.currentDailyRef) {
    fetchAndDisplayDailyVerse(window.currentDailyRef, 'NIV');
  }
};

async function fetchAndDisplayDailyVerse(ref, version = 'NIV') {
  if (!ref) return;
  const vText = document.getElementById('today-daily-text');
  const vRef  = document.getElementById('today-daily-ref');

  if (vRef) vRef.textContent = "Loading 2-Page Spread...";
  if (vText) vText.innerHTML = '<span class="loading-pulse">Fetching previous and current verses...</span>';

  // Calculate previous reading reference for the left page
  let prevRef = null;
  if (window.readingDayIndex && window.readingDayIndex > 1 && window.currentDailyChapter) {
    const prevStart = (window.readingDayIndex - 2) * 7 + 1;
    const prevEnd   = (window.readingDayIndex - 1) * 7;
    prevRef = `${window.currentDailyChapter}:${prevStart}-${prevEnd}`;
  } else {
    const m = ref.match(/^(.+?):(\d+)-(\d+)$/);
    if (m && parseInt(m[2]) > 7) {
      const book = m[1];
      const start = parseInt(m[2]);
      const end = parseInt(m[3]);
      prevRef = `${book}:${Math.max(1, start - 7)}-${start - 1}`;
    }
  }

  try {
    const [currentRes, prevRes] = await Promise.all([
      fetch(`/api/bible/verse?ref=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`),
      prevRef ? fetch(`/api/bible/verse?ref=${encodeURIComponent(prevRef)}&version=${encodeURIComponent(version)}`) : Promise.resolve(null)
    ]);

    if (!currentRes.ok) {
      if (currentRes.status === 404) {
        if (vRef) vRef.textContent = `Completed`;
        if (vText) vText.innerHTML = `<p class="today-accord-empty">Chapter Completed for this Card! Great job. You can update your Target Chapter to start a new one.</p>`;
      } else {
        throw new Error('Fetch failed');
      }
      return;
    }

    const currentData = await currentRes.json();
    let prevData = null;
    if (prevRes && prevRes.ok) {
      prevData = await prevRes.json();
    } else {
      prevData = {
        reference: `${window.currentDailyChapter || ref.split(':')[0]} · Chapter Start`,
        version: version,
        passages: [{
          reference: 'Divine Encounter · Step 1',
          text: `Welcome to ${window.currentDailyChapter || ref.split(':')[0]}! As you read today's passage on the right page, let this open notebook spread be your sacred meeting place with God. Meditate deeply, observe key principles, and prepare your heart for daily renewal.`
        }]
      };
    }

    window.currentDailyData = currentData;
    window.prevDailyData    = prevData;

    if (vRef) vRef.textContent = `${currentData.reference} (${currentData.version || version})`;

    function _formatPassagesHTML(data) {
      if (!data) return '<p class="today-accord-empty">No text available.</p>';
      if (data.passages && data.passages.length > 0) {
        return `<div style="display: flex; flex-direction: column; gap: 1.2rem; width: 100%;">` +
          data.passages.map(p => {
            let formattedText = '';
            if (p.verses_list && p.verses_list.length > 0) {
              formattedText = p.verses_list.map(v => `<span class="verse-item" style="display: block; margin-bottom: 0.75rem; line-height: 1.75;"><strong class="verse-num" style="color: var(--primary, #d4af37); font-weight: 800; font-size: 0.9em; margin-right: 10px; display: inline-block; min-width: 22px; user-select: none;">${v.num}</strong><span class="verse-text" style="font-size: 1.03rem;">${v.text}</span></span>`).join('');
            } else if (p.text && p.text.trim()) {
              const rawText = p.text.trim();
              const verseMatches = Array.from(rawText.matchAll(/(?:^|\s)\[?(\d{1,3})\]?\s+([^\d\[].*?(?=(?:\s\[?\d{1,3}\]?\s)|$))/gs));
              if (verseMatches.length > 0) {
                formattedText = verseMatches.map(m => `<span class="verse-item" style="display: block; margin-bottom: 0.75rem; line-height: 1.75;"><strong class="verse-num" style="color: var(--primary, #d4af37); font-weight: 800; font-size: 0.9em; margin-right: 10px; display: inline-block; min-width: 22px; user-select: none;">${m[1]}</strong><span class="verse-text" style="font-size: 1.03rem;">${m[2].trim()}</span></span>`).join('');
              } else {
                const leadMatch = rawText.match(/^\[?(\d{1,3})\]?\s+(.*)/s);
                if (leadMatch) {
                  formattedText = `<span class="verse-item" style="display: block; margin-bottom: 0.75rem; line-height: 1.75;"><strong class="verse-num" style="color: var(--primary, #d4af37); font-weight: 800; font-size: 0.9em; margin-right: 10px; display: inline-block; min-width: 22px; user-select: none;">${leadMatch[1]}</strong><span class="verse-text" style="font-size: 1.03rem;">${leadMatch[2].trim()}</span></span>`;
                } else {
                  formattedText = `"${rawText}"`;
                }
              }
            }
            return `
              <div class="passage-block" style="border-left: 3px solid var(--primary, #d4af37); padding: 0.2rem 0 0.2rem 0.85rem; text-align: left;">
                <div style="font-weight: 800; font-size: 0.94rem; color: var(--primary, #d4af37); margin-bottom: 0.4rem; letter-spacing: 0.02em;">[${p.reference}]</div>
                <div style="font-style: italic; font-size: 0.94rem; line-height: 1.7; color: var(--text-primary);">${formattedText}</div>
              </div>
            `;
          }).join('') + `</div>`;
      }
      return `"${data.text}"`;
    }

    if (vText) {
      vText.innerHTML = `
        <div class="daily-spread-dom" style="background: var(--surface, rgba(30, 41, 59, 0.45)); padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); margin-top: 0.5rem; width: 100%;">
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary, #d4af37); margin-bottom: 1rem; border-bottom: 2px solid var(--primary, #d4af37); padding-bottom: 0.5rem;">${currentData.reference}</div>
          <div class="passage-content">${_formatPassagesHTML(currentData)}</div>
        </div>
      `;
    }

    // Pre-build the exact vector SVG string asynchronously in background for instant downloading
    _prepareDownloadableSpreadSvg(prevData, currentData);
  } catch (e) {
    console.error("Error fetching daily verses:", e);
    if (vRef) vRef.textContent = `${ref} (${version})`;
    if (vText) vText.innerHTML = `<p class="today-accord-empty">Unable to load verses at this time.</p>`;
  }
}

async function _prepareDownloadableSpreadSvg(prevData, currentData) {
  try {
    let svgTemplate = window.cachedDiaryNoMugSvg;
    if (!svgTemplate) {
      const res = await fetch('/realistic_diary_no_mug.svg');
      if (res.ok) {
        svgTemplate = await res.text();
        window.cachedDiaryNoMugSvg = svgTemplate;
      } else {
        return;
      }
    }

    function extractVerseItems(dataObj) {
      let items = [];
      if (dataObj && dataObj.passages && dataObj.passages.length > 0) {
        dataObj.passages.forEach(p => {
          if (p.verses_list && p.verses_list.length > 0) {
            p.verses_list.forEach(vi => {
              const num = String(vi.num || '').trim();
              const txt = String(vi.text || '').trim();
              if (txt) items.push({ num, text: txt });
            });
          } else if (p.text && p.text.trim()) {
            // If the API didn't provide a verses_list, the numbers might be embedded in the text.
            // Let's try to extract them by splitting the text by verse numbers.
            const rawText = p.text.trim();
            const verseMatches = Array.from(rawText.matchAll(/(?:^|\s)\[?(\d{1,3})\]?\s+([^\d\[].*?(?=(?:\s\[?\d{1,3}\]?\s)|$))/gs));
            
            if (verseMatches.length > 0) {
              verseMatches.forEach(m => {
                items.push({ num: m[1], text: m[2].trim() });
              });
            } else {
              // Fallback: Just look for a leading number
              const leadMatch = rawText.match(/^\[?(\d{1,3})\]?\s+(.*)/s);
              if (leadMatch) {
                items.push({ num: leadMatch[1], text: leadMatch[2].trim() });
              } else {
                items.push({ num: '', text: rawText });
              }
            }
          }
        });
      } else if (dataObj && dataObj.text && dataObj.text.trim()) {
        const rawText = dataObj.text.trim();
        const leadMatch = rawText.match(/^\[?(\d{1,3})\]?\s+(.*)/s);
        if (leadMatch) {
          items.push({ num: leadMatch[1], text: leadMatch[2].trim() });
        } else {
          items.push({ num: '', text: rawText });
        }
      }
      return items;
    }

    const leftItems  = extractVerseItems(prevData);
    const rightItems = extractVerseItems(currentData);

    function escapeXml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    // Pixel-width aware text wrapping for Patrick Hand font.
    // Widths calibrated at 16px for Patrick Hand — a narrow handwriting font.
    // All values measured to fill lines to the SVG rule end before breaking.
    const CHAR_WIDTHS_16 = {
      ' ':4.0, 'f':4.5, 'i':3.5, 'j':3.5, 'l':3.8, 'r':4.5, 't':4.5,
      '1':5.0, '!':3.5, ',':3.5, '.':3.5, ':':3.5, ';':3.5, "'":2.8, '"':4.5,
      'm':10.5,'w':10.0,'M':11.0,'W':11.0,
      'A':8.5, 'B':8.0, 'C':8.0, 'D':8.5, 'E':7.0, 'F':6.5, 'G':8.5,
      'H':8.5, 'I':3.8, 'J':5.0, 'K':8.0, 'L':7.0, 'N':8.5, 'O':8.5,
      'P':7.5, 'Q':8.5, 'R':8.0, 'S':7.0, 'T':7.0, 'U':8.0, 'V':8.0,
      'X':7.5, 'Y':7.5, 'Z':7.5,
      'a':6.5, 'b':7.0, 'c':6.0, 'd':7.0, 'e':6.0, 'g':7.0, 'h':7.0,
      'k':6.5, 'n':7.0, 'o':7.0, 'p':7.0, 'q':7.0, 's':5.8, 'u':7.0,
      'v':7.0, 'x':6.5, 'y':7.0, 'z':6.0
    };
    function charWidth(ch, fontSize) {
      const base = CHAR_WIDTHS_16[ch] ?? 6.5;
      return base * (fontSize / 16);
    }
    function measureWord(word, fontSize) {
      let w = 0;
      for (const ch of word) w += charWidth(ch, fontSize);
      return w;
    }
    function wrapTextPixels(text, maxPx, fontSize) {
      const spaceW = charWidth(' ', fontSize);
      const words = text.split(' ');
      const lines = [];
      let line = '';
      let lineW = 0;
      for (const word of words) {
        const wW = measureWord(word, fontSize);
        if (line && lineW + spaceW + wW > maxPx) {
          lines.push(line);
          line = word;
          lineW = wW;
        } else {
          if (line) {
            lineW += spaceW + wW;
            line += ' ' + word;
          } else {
            lineW = wW;
            line = word;
          }
        }
      }
      if (line) lines.push(line);
      return lines;
    }
    // Full ruled line lengths from the SVG:
    // Left:  rule x1=210 x2=668, text starts at x=222 → usable = 668-222 = 446px
    // Right: rule x1=752 x2=1190, text starts at x=762 → usable = 1190-762 = 428px
    const LEFT_PX  = 446;
    const RIGHT_PX = 428;



    const FONT_STACK = "'Patrick Hand', 'Chalkboard SE', 'Comic Sans MS', 'Bradley Hand', cursive, sans-serif";
    let svgTextXml = `\n<!-- DYNAMIC 2-PAGE SCRIPTURE SPREAD -->\n<g id="dynamic-notebook-content">\n`;

    const dayNum  = window.readingDayIndex || window.currentDayIndex || 11;
    const prevDay = dayNum > 1 ? dayNum - 1 : 1;
    const weekNum = Math.ceil(dayNum / 7) || 2;
    const prevWeekNum = Math.ceil(prevDay / 7) || 2;
    const cardId  = (window.currentActiveCard && window.currentActiveCard.cardId) ? window.currentActiveCard.cardId : (window.currentCardId || 3);

    const prevProgressStr    = `Day ${prevDay} · Week ${prevWeekNum} · Card #${cardId}`;
    const currentProgressStr = `Day ${dayNum} · Week ${weekNum} · Card #${cardId}`;
    const fullDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const leftVersion = prevData.version || window.currentBibleVersion || 'NIV';
    const leftRef = prevData.reference || 'Previous Reading';
    const leftTitleLength = prevData.reference ? leftRef.length + leftVersion.length + 1 : leftRef.length;
    const leftFontSize = leftTitleLength > 22 ? 20 : (leftTitleLength > 16 ? 23 : 26);
    const leftVersionSvg = prevData.reference ? `<tspan font-size="${Math.round(leftFontSize * 0.7)}" fill="#666666" font-weight="normal" dx="8">${escapeXml(leftVersion)}</tspan>` : '';
    
    svgTextXml += `
  <text x="218" y="133" font-size="11" font-family="${FONT_STACK}" fill="#1a1a1a" letter-spacing="0.5" font-weight="bold">CBR Challenger · daily chapter reading</text>
  <text x="654" y="133" font-size="11" font-family="${FONT_STACK}" fill="#666666" text-anchor="end">Previous Reading</text>
  <text x="222" y="178" font-size="${leftFontSize}" font-family="${FONT_STACK}" font-weight="bold" fill="#cc0000">${escapeXml(leftRef)}${leftVersionSvg}</text>
  <text x="654" y="175" font-size="12" font-family="${FONT_STACK}" fill="#666666" text-anchor="end">${escapeXml(prevProgressStr)}</text>
`;

    // Pre-wrap left lines and calculate scaling
    const leftWrapped = [];
    let leftTotalLines = 0;
    leftItems.forEach(v => {
      // Use 16px as initial estimate; recalc after we know spacing
      const lines = wrapTextPixels(v.text, LEFT_PX, 16);
      leftTotalLines += lines.length;
      leftWrapped.push({ num: v.num, lines });
    });

    // Pre-wrap right lines and calculate scaling
    const rightWrapped = [];
    let rightTotalLines = 0;
    rightItems.forEach(v => {
      const lines = wrapTextPixels(v.text, RIGHT_PX, 16);
      rightTotalLines += lines.length;
      rightWrapped.push({ num: v.num, lines });
    });

    const maxTotalLines = Math.max(leftTotalLines, rightTotalLines);
    const maxLinesNeededHeight = maxTotalLines * 21;
    const extraHeight = maxLinesNeededHeight > 415 ? (maxLinesNeededHeight - 415 + 60) : 0;

    // Standard reading zone ~415px. Scale font/spacing if too many lines.
    const leftLineSpacing = leftTotalLines <= 13 ? 30 : Math.max(21, Math.floor(415 / leftTotalLines));
    const leftVerseFontSize = leftTotalLines <= 13 ? 16 : Math.min(16, Math.max(13.5, leftLineSpacing * 0.72));
    const leftNumFontSize = leftTotalLines <= 13 ? 13 : Math.min(13, Math.max(11, leftLineSpacing * 0.6));

    const rightLineSpacing = rightTotalLines <= 13 ? 30 : Math.max(21, Math.floor(415 / rightTotalLines));
    const rightVerseFontSize = rightTotalLines <= 13 ? 16 : Math.min(16, Math.max(13.5, rightLineSpacing * 0.72));
    const rightNumFontSize = rightTotalLines <= 13 ? 13 : Math.min(13, Math.max(11, rightLineSpacing * 0.6));

    // Re-wrap with accurate font size now that we know it
    if (leftVerseFontSize < 16) {
      leftWrapped.length = 0;
      leftTotalLines = 0;
      leftItems.forEach(v => {
        const lines = wrapTextPixels(v.text, LEFT_PX, leftVerseFontSize);
        leftTotalLines += lines.length;
        leftWrapped.push({ num: v.num, lines });
      });
    }
    if (rightVerseFontSize < 16) {
      rightWrapped.length = 0;
      rightTotalLines = 0;
      rightItems.forEach(v => {
        const lines = wrapTextPixels(v.text, RIGHT_PX, rightVerseFontSize);
        rightTotalLines += lines.length;
        rightWrapped.push({ num: v.num, lines });
      });
    }

    let yL = 254;
    leftWrapped.forEach(item => {
      item.lines.forEach((lText, li) => {
        svgTextXml += `  <line x1="210" y1="${yL}" x2="668" y2="${yL}" stroke="#e2dace" stroke-width="1"/>\n`;
        if (li === 0 && item.num) {
          svgTextXml += `  <text x="202" y="${yL}" font-size="${leftNumFontSize}" font-family="${FONT_STACK}" fill="#cc0000" font-weight="bold" text-anchor="end">${escapeXml(item.num)}</text>\n`;
        }
        svgTextXml += `  <text x="222" y="${yL}" font-size="${leftVerseFontSize}" font-family="${FONT_STACK}" fill="#0a3d91">${escapeXml(lText)}</text>\n`;
        yL += leftLineSpacing;
      });
    });
    while (yL <= 644 + extraHeight) {
      svgTextXml += `  <line x1="210" y1="${yL}" x2="668" y2="${yL}" stroke="#e2dace" stroke-width="1"/>\n`;
      yL += leftLineSpacing;
    }

    const rightVersion = currentData.version || window.currentBibleVersion || 'NIV';
    const rightRef = currentData.reference || 'Current Reading';
    const rightTitleLength = currentData.reference ? rightRef.length + rightVersion.length + 1 : rightRef.length;
    const rightFontSize = rightTitleLength > 22 ? 20 : (rightTitleLength > 16 ? 23 : 26);
    const rightVersionSvg = currentData.reference ? `<tspan font-size="${Math.round(rightFontSize * 0.7)}" fill="#666666" font-weight="normal" dx="8">${escapeXml(rightVersion)}</tspan>` : '';

    svgTextXml += `
  <text x="758" y="133" font-size="11" font-family="${FONT_STACK}" fill="#1a1a1a" letter-spacing="0.5" font-weight="bold">CBR Challenger · daily chapter reading</text>
  <text x="1176" y="133" font-size="11" font-family="${FONT_STACK}" fill="#666666" text-anchor="end">${escapeXml(fullDateStr)}</text>
  <text x="762" y="178" font-size="${rightFontSize}" font-family="${FONT_STACK}" font-weight="bold" fill="#cc0000">${escapeXml(rightRef)}${rightVersionSvg}</text>
  <text x="1176" y="175" font-size="12" font-family="${FONT_STACK}" fill="#666666" text-anchor="end">${escapeXml(currentProgressStr)}</text>
`;

    let yR = 254;
    rightWrapped.forEach(item => {
      item.lines.forEach((lText, li) => {
        // Rule drawn AT the text baseline so handwriting sits directly on the line
        svgTextXml += `  <line x1="752" y1="${yR}" x2="1190" y2="${yR}" stroke="#e2dace" stroke-width="1"/>\n`;
        if (li === 0 && item.num) {
          svgTextXml += `  <text x="748" y="${yR}" font-size="${rightNumFontSize}" font-family="${FONT_STACK}" fill="#cc0000" font-weight="bold" text-anchor="end">${escapeXml(item.num)}</text>\n`;
        }
        svgTextXml += `  <text x="762" y="${yR}" font-size="${rightVerseFontSize}" font-family="${FONT_STACK}" fill="#0a3d91">${escapeXml(lText)}</text>\n`;
        yR += rightLineSpacing;
      });
    });
    while (yR <= 644 + extraHeight) {
      svgTextXml += `  <line x1="752" y1="${yR}" x2="1190" y2="${yR}" stroke="#e2dace" stroke-width="1"/>\n`;
      yR += rightLineSpacing;
    }

    const footerY1 = 706 + extraHeight;
    const footerY2 = 732 + extraHeight;

    svgTextXml += `
  <text x="432" y="${footerY1}" font-size="15" font-family="${FONT_STACK}" fill="#1a1a1a" text-anchor="middle">Read  ·  Meditate  ·  Pray</text>
  <text x="432" y="${footerY2}" font-size="13" font-family="${FONT_STACK}" fill="#666666" text-anchor="middle">Previous Daily Scripture Reading</text>
  <text x="960" y="${footerY1}" font-size="15" font-family="${FONT_STACK}" fill="#1a1a1a" text-anchor="middle">Read  ·  Meditate  ·  Pray</text>
  <text x="960" y="${footerY2}" font-size="13" font-family="${FONT_STACK}" fill="#666666" text-anchor="middle">Current Daily Scripture Reading</text>
</g>
`;

    const markerStart = '<!-- 8. HEADER TEXT — Left Page (Scripture Reading) -->';
    const markerEnd   = '<!-- 11. TWIN-WIRE O-RING BINDING — Pill holes -->';
    const idxStart = svgTemplate.indexOf(markerStart);
    const idxEnd   = svgTemplate.indexOf(markerEnd);

    let finalSvg = svgTemplate;
    if (idxStart !== -1 && idxEnd !== -1) {
      finalSvg = svgTemplate.substring(0, idxStart) + svgTextXml + svgTemplate.substring(idxEnd);
    } else {
      finalSvg = svgTemplate.replace('</svg>', svgTextXml + '\n</svg>');
    }

    // Strip static fixed rules from the template so only our dynamically aligned rules remain
    finalSvg = finalSvg.replace(/<line[^>]+stroke="#e2dace"[^>]*>/gi, m => {
      const matchY = m.match(/y1="([0-9]+)"/i);
      if (matchY && parseInt(matchY[1], 10) >= 240) {
        return '';
      }
      return m;
    });

    if (extraHeight > 0) {
      const newHeight = 900 + extraHeight;
      finalSvg = finalSvg.replace(/<svg[^>]*viewBox="[^"]*"[^>]*>/i, m => {
        return m.replace(/height="[0-9]+"/i, `height="${newHeight}"`)
                .replace(/viewBox="0 0 1400 [0-9]+"/i, `viewBox="0 0 1400 ${newHeight}"`);
      });

      finalSvg = finalSvg.replace(/<rect([^>]+)height="6[78][0-9]"([^>]*)>/gi, (m, p1, p2) => {
        const matchH = m.match(/height="([0-9]+)"/i);
        if (matchH) {
          const oldH = parseInt(matchH[1], 10);
          return `<rect${p1}height="${oldH + extraHeight}"${p2}>`;
        }
        return m;
      });

      finalSvg = finalSvg.replace(/<rect([^>]+)y="7[78][0-9]"([^>]*)>/gi, (m, p1, p2) => {
        const matchY = m.match(/y="([0-9]+)"/i);
        if (matchY) {
          const oldY = parseInt(matchY[1], 10);
          return `<rect${p1}y="${oldY + extraHeight}"${p2}>`;
        }
        return m;
      });

      finalSvg = finalSvg.replace(/<line([^>]+)y2="([67][0-9]{2})"([^>]*)>/gi, (m, p1, oldY2, p3) => {
        const y2Val = parseInt(oldY2, 10);
        if (y2Val >= 650 && y2Val <= 780) {
          return `<line${p1}y2="${y2Val + extraHeight}"${p3}>`;
        }
        return m;
      });

      let extraRingsXml = '\n<!-- Dynamically expanded spiral rings -->\n';
      for (let yRing = 756; yRing < 756 + extraHeight - 10; yRing += 34) {
        extraRingsXml += `
        <rect x="673" y="${yRing}" width="8" height="18" rx="4" fill="#1a1210" opacity="0.8"/>
        <rect x="719" y="${yRing}" width="8" height="18" rx="4" fill="#1a1210" opacity="0.8"/>
        <path d="M 677,${yRing+4} C 690,${yRing-8} 710,${yRing-8} 723,${yRing+4}" fill="none" stroke="url(#ring_metal)" stroke-width="5" stroke-linecap="round"/>
        <path d="M 677,${yRing+12} C 690,${yRing} 710,${yRing} 723,${yRing+12}" fill="none" stroke="url(#ring_metal)" stroke-width="5" stroke-linecap="round"/>
        `;
      }

      finalSvg = finalSvg.replace('<!-- 11. TWIN-WIRE O-RING BINDING — Pill holes -->', '<!-- 11. TWIN-WIRE O-RING BINDING — Pill holes -->');
      if (finalSvg.includes('</svg>')) {
        finalSvg = finalSvg.replace('</svg>', extraRingsXml + '\n</svg>');
      }
    }

    // Embed base64 font right inside <style> so the SVG renders Patrick Hand natively inside Canvas Blob and web DOM without falling back to Georgia
    const fontFaceCss = window.PATRICK_HAND_BASE64 ? `
      @font-face {
        font-family: 'Patrick Hand';
        font-style: normal;
        font-weight: 400;
        src: url(data:font/woff2;base64,${window.PATRICK_HAND_BASE64}) format('woff2');
      }
    ` : '';

    const customStyleTag = `
      <style>
        ${fontFaceCss}
        text { font-family: 'Patrick Hand', 'Chalkboard SE', 'Comic Sans MS', cursive, sans-serif !important; }
      </style>
    `;

    if (finalSvg.includes('<style')) {
      finalSvg = finalSvg.replace(/<style[^>]*>/i, m => m + '\n' + fontFaceCss + '\ntext { font-family: "Patrick Hand", "Chalkboard SE", cursive, sans-serif !important; }\n');
    } else {
      finalSvg = finalSvg.replace(/<defs[^>]*>/i, m => m + customStyleTag);
      if (!finalSvg.includes(customStyleTag)) {
        finalSvg = finalSvg.replace(/<svg([^>]+)>/i, m => m + customStyleTag);
      }
    }

    // Shift right page red margin vertical rule and double horizontal separator slightly right (734 -> 752) to give the verse numbers clean breathing room past the spiral
    finalSvg = finalSvg.replace(/<line x1="734" y1="96" x2="734" y2="776"/g, '<line x1="752" y1="96" x2="752" y2="776"');
    finalSvg = finalSvg.replace(/<line x1="734"/g, '<line x1="752"');

    const finalH = 900 + (extraHeight || 0);
    finalSvg = finalSvg.replace(/<svg([^>]+)>/i, (m, attrs) => {
      let cleaned = attrs.replace(/\b(width|height|viewBox|style)="[^"]*"/gi, '');
      return `<svg ${cleaned} width="1400" height="${finalH}" viewBox="0 0 1400 ${finalH}" style="display:block;">`;
    });

    window.currentDailySpreadSvg = finalSvg;
  } catch (e) {
    console.error("Could not prepare downloadable spread SVG:", e);
  }
}

async function downloadDailyCard() {
  const canvas = document.getElementById('today-daily-canvas');
  if (!window.currentDailySpreadSvg) {
    if (window.prevDailyData && window.currentDailyData) {
      await _prepareDownloadableSpreadSvg(window.prevDailyData, window.currentDailyData);
    } else {
      await fetchAndDisplayDailyVerse(window.currentDailyRef || document.getElementById('today-daily-ref').innerText, 'NIV');
    }
  }

  const svgStr = window.currentDailySpreadSvg;
  if (!svgStr) {
    alert("Still preparing your vector notebook card, please try again in a second.");
    return;
  }

  const safeRef = (window.currentDailyData && window.currentDailyData.reference
    ? window.currentDailyData.reference
    : 'daily-spread').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();

  const fullXmlSvg = svgStr.includes('<?xml')
    ? svgStr
    : `<?xml version="1.0" encoding="UTF-8"?>\n` + svgStr;

  const blob = new Blob([fullXmlSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();

  img.onload = () => {
    if (canvas) {
      canvas.width  = 2800;
      canvas.height = 1800;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 2800, 1800);

      canvas.toBlob(pngBlob => {
        const pngUrl = pngBlob ? URL.createObjectURL(pngBlob) : canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `cbr-daily-spread-${safeRef}.png`;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          if (pngBlob) URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
        }, 150);
      }, 'image/png');
    } else {
      const link = document.createElement('a');
      link.download = `cbr-daily-spread-${safeRef}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 150);
    }
  };

  img.onerror = () => {
    // Fallback: directly download the vector .svg file if browser blocks canvas draw
    const link = document.createElement('a');
    link.download = `cbr-daily-spread-${safeRef}.svg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  };

  img.src = url;
}
// ── Study Questions: Bible Reference Chips ───────────────────────────────────

// Helper: returns strict regex matching only known Bible books + chapter:verse
function _getBibleRefRegex() {
  const BOOKS = [
    '1 Chronicles','2 Chronicles','1 Corinthians','2 Corinthians',
    '1 Kings','2 Kings','1 Peter','2 Peter','1 Samuel','2 Samuel',
    '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy',
    '1 John','2 John','3 John','1 Jn','2 Jn','3 Jn',
    'Song of Solomon','Song of Songs',
    'Acts','Amos','Col','Colossians','Daniel','Dan',
    'Deut','Deuteronomy','Eccl','Ecclesiastes','Ephesians','Eph',
    'Esther','Exodus','Exod','Ezekiel','Ezra','Galatians','Gal',
    'Genesis','Gen','Habakkuk','Hag','Haggai','Hebrews','Heb',
    'Hosea','Isaiah','Isa','James','Jer','Jeremiah','Job',
    'Joel','John','Jn','Jonah','Jos','Joshua','Jude',
    'Judges','Lamentations','Lam','Leviticus','Lev','Luke','Lk',
    'Malachi','Mark','Mk','Mat','Matt','Matthew','Mic','Micah',
    'Nahum','Nehemiah','Neh','Num','Numbers','Obadiah',
    'Philemon','Philippians','Phil','Phlm','Proverbs','Prov',
    'Psalms','Psalm','Psa','Ps','Revelation','Rev',
    'Romans','Rom','Ruth','Titus','Zechariah','Zech','Zeph','Zephaniah',
    '1 Chron','2 Chron','1 Cor','2 Cor','1 Tim','2 Tim','1 Pet','2 Pet',
    '1 Sam','2 Sam','1 Kgs','2 Kgs','1 Thess','2 Thess',
  ].sort((a, b) => b.length - a.length);

  const booksPattern = BOOKS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`\\b(${booksPattern})\\s(\\d{1,3}:\\d{1,3}(?:-\\d{1,3})?)`, 'g');
}

// Detects Bible references in question text and wraps them in clickable chips.
function _annotateQuestionRefs(text, qi) {
  const bibleRefRegex = _getBibleRefRegex();

  // Escape for safe HTML insertion then replace refs
  let safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  let refIndex = 0;
  safeText = safeText.replace(bibleRefRegex, (match, book, chapter) => {
    const ref = `${book} ${chapter}`;
    const chipId = `q-chip-${qi}-${refIndex}`;
    const panelId = `q-panel-${qi}-${refIndex}`;
    refIndex++;
    return `<button 
      class="q-ref-chip" 
      id="${chipId}" 
      onclick="toggleVersePanel('${ref}', '${panelId}', '${chipId}')"
      title="Click to read ${ref}"
    >${ref} <span style="font-size:0.7em; opacity:0.7;">▼</span></button><div class="q-verse-panel" id="${panelId}" style="display:none;"></div>`;
  });

  return safeText;
}

// Toggles a verse panel open/close and fetches verse text from the API.
window.toggleVersePanel = async function(ref, panelId, chipId) {
  const panel = document.getElementById(panelId);
  const chip  = document.getElementById(chipId);
  if (!panel) return;

  // If already open, close it
  if (panel.style.display !== 'none') {
    panel.style.display = 'none';
    panel.innerHTML = '';
    if (chip) chip.classList.remove('active');
    return;
  }

  // Show loading state
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

// ── Study Question PNG Download ───────────────────────────────────────────────
window.downloadStudyQuestion = async function(qi) {
  const lesson = window._currentLesson;
  if (!lesson || !lesson.questions || !lesson.questions[qi]) return;

  const questionText = lesson.questions[qi];
  const lessonTitle  = lesson.title || 'Study Questions';
  const version      = window.currentBibleVersion || 'NIV';
  const qNum         = qi + 1;

  // Show a subtle loading state on the button
  const btn = document.querySelector(`button[onclick="downloadStudyQuestion(${qi})"]`);
  const origHTML = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Generating...`;

  // Extract all Bible references from the question text
  const bibleRefRegex = _getBibleRefRegex();
  const refs = [];
  let m;
  while ((m = bibleRefRegex.exec(questionText)) !== null) {
    refs.push(`${m[1]} ${m[2]}`);
  }

  // Fetch all refs in parallel
  const fetchedVerses = {};
  await Promise.all(refs.map(async ref => {
    try {
      const res = await fetch(`/api/bible/verse?ref=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`);
      if (res.ok) {
        const data = await res.json();
        fetchedVerses[ref] = data;
      }
    } catch (_) {}
  }));

  if (btn) btn.innerHTML = origHTML;

  // ── Canvas Rendering (Professional Layout) ──
  const W       = 1600;
  const isDark  = !document.body.classList.contains('light-mode');
  const bg      = isDark ? '#0b1329' : '#f8fafc';
  const accent  = '#d4af37';
  const textCol = isDark ? '#f1f5f9' : '#0f172a';
  const mutedCol= isDark ? '#94a3b8' : '#64748b';
  const cardBg  = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)';
  const borderCol = isDark ? 'rgba(212, 175, 55, 0.28)' : 'rgba(212, 175, 55, 0.35)';

  // Use an offscreen canvas for measurement
  const offscreen = document.createElement('canvas');
  offscreen.width = W;
  offscreen.height = 100;
  const mctx = offscreen.getContext('2d');

  const MARGIN = 100;
  const CONTENT_W = W - MARGIN * 2; // 1400px

  // Helper: word-wrap text and return array of lines
  function wrapText(ctx, text, maxW, font) {
    ctx.font = font;
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const word of words) {
      if (!word) continue;
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // Typography Tokens
  const QFONT   = '700 46px system-ui, -apple-system, sans-serif';
  const VFONT   = 'italic 40px system-ui, -apple-system, sans-serif';
  const RFONT   = '800 34px system-ui, -apple-system, sans-serif';

  // Wrap question text
  const cleanQuestion = questionText.replace(/\n/g, ' ');
  const qLines = wrapText(mctx, cleanQuestion, CONTENT_W, QFONT);

  // Build verse blocks cleanly with structured lines
  const verseBlocks = refs.map(ref => {
    const data = fetchedVerses[ref];
    if (!data) return { ref, lines: [{ text: '[Verse text unavailable]', isFirst: true }] };
    
    const verseLines = [];
    if (data.passages && data.passages.length > 0) {
      data.passages.forEach(p => {
        if (p.verses_list && p.verses_list.length > 0) {
          p.verses_list.forEach((v, vi) => {
            const rawText = `[${v.num}] ${v.text}`;
            const wrapped = wrapText(mctx, rawText, CONTENT_W - 80, VFONT);
            wrapped.forEach((l, i) => {
              verseLines.push({ text: l, isFirst: (vi === 0 && i === 0) });
            });
          });
        } else {
          const wrapped = wrapText(mctx, p.text || '', CONTENT_W - 80, VFONT);
          wrapped.forEach((l, i) => verseLines.push({ text: l, isFirst: i === 0 }));
        }
      });
    } else {
      const wrapped = wrapText(mctx, data.text || '', CONTENT_W - 80, VFONT);
      wrapped.forEach((l, i) => verseLines.push({ text: l, isFirst: i === 0 }));
    }
    return { ref, lines: verseLines };
  });

  // Measure exact total height needed
  let totalH = 360; // Header & Spacing
  totalH += qLines.length * 64 + 50; // Question section
  verseBlocks.forEach(b => {
    totalH += 90; // Ref header inside card
    totalH += b.lines.length * 56 + 40; // Verse text + card padding
  });
  totalH += 140; // Footer & bottom padding

  const H = Math.max(900, totalH);
  const canvas = document.getElementById('today-daily-canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Base Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Grid Pattern
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.022)' : 'rgba(15, 23, 42, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // 3. Top Accent Bar with Gradient
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#d4af37');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#d4af37');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 8);

  // 4. Header Section: Brand Title
  ctx.fillStyle = accent;
  ctx.font = '800 28px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('CBR CHALLENGER · DAILY BIBLE STUDY', MARGIN, 85);
  ctx.letterSpacing = '0px';

  // Lesson Title Pill Badge
  ctx.fillStyle = cardBg;
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.5;
  const pillW = Math.min(ctx.measureText(lessonTitle).width + 60, CONTENT_W);
  ctx.beginPath();
  ctx.roundRect(MARGIN, 115, pillW, 54, 27);
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = textCol;
  ctx.font = '700 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(lessonTitle, MARGIN + 30, 151);

  // 5. Question Number Badge
  let currentY = 240;
  ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.beginPath();
  ctx.roundRect(MARGIN, currentY, 180, 48, 12);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = '800 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`QUESTION ${qNum}`, MARGIN + 22, currentY + 32);

  currentY += 86;

  // 6. Question Text
  ctx.fillStyle = textCol;
  ctx.font = QFONT;
  qLines.forEach(line => {
    ctx.fillText(line, MARGIN, currentY);
    currentY += 64;
  });

  currentY += 30;

  // 7. Scripture Cards
  verseBlocks.forEach(block => {
    const cardH = block.lines.length * 56 + 110;
    
    // Card Container
    ctx.fillStyle = cardBg;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(MARGIN, currentY, CONTENT_W, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Gold Left Accent Stripe
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(MARGIN, currentY, 8, cardH, [20, 0, 0, 20]);
    ctx.fill();

    // Scripture Header inside card
    ctx.fillStyle = accent;
    ctx.font = RFONT;
    ctx.fillText(block.ref.toUpperCase(), MARGIN + 36, currentY + 54);

    // Translation Pill
    ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.beginPath();
    ctx.roundRect(MARGIN + CONTENT_W - 130, currentY + 24, 100, 40, 8);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = '800 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(version.toUpperCase(), MARGIN + CONTENT_W - 106, currentY + 51);

    // Divider line inside card
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 36, currentY + 76);
    ctx.lineTo(MARGIN + CONTENT_W - 36, currentY + 76);
    ctx.stroke();

    // Verse Lines
    let verseY = currentY + 124;
    block.lines.forEach(({ text }) => {
      // Highlight verse numbers [1], [2] in gold, rest in normal italic
      const numMatch = text.match(/^(\[\d+\])\s*(.*)/);
      if (numMatch) {
        const [, numPart, restPart] = numMatch;
        ctx.fillStyle = accent;
        ctx.font = '800 32px system-ui, -apple-system, sans-serif';
        ctx.fillText(numPart.replace('[','').replace(']',''), MARGIN + 36, verseY);
        
        const numW = ctx.measureText(numPart.replace('[','').replace(']','') + '  ').width;
        ctx.fillStyle = textCol;
        ctx.font = VFONT;
        ctx.fillText(restPart, MARGIN + 36 + numW, verseY);
      } else {
        ctx.fillStyle = textCol;
        ctx.font = VFONT;
        ctx.fillText(text, MARGIN + 36, verseY);
      }
      verseY += 56;
    });

    currentY += cardH + 36;
  });

  // 8. Footer
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, H - 90);
  ctx.lineTo(W - MARGIN, H - 90);
  ctx.stroke();

  ctx.fillStyle = mutedCol;
  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('CBR Challenger · Community Bible Reading Study Guide', MARGIN, H - 42);
  
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, W - MARGIN - dateW, H - 42);

  // ── Reliable Binary PNG Download (Prevents PDF/Preview issues in Safari & Mobile) ──
  canvas.toBlob(blob => {
    if (!blob) {
      // Fallback
      const link = document.createElement('a');
      link.download = `cbr-study-q${qNum}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `cbr-study-q${qNum}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  }, 'image/png');
};
