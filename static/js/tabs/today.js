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
  const link = document.createElement('a');
  link.download = (refEl.textContent || 'verse').replace(/\s/g, '-') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
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

// ── Render Today Tab ─────────────────────────────────────────────────────────
function renderToday() {
  const data = window.getActiveData ? getActiveData() : null;
  if (!data) return;

  const card = (typeof CBR_DATA !== 'undefined' && CBR_DATA.cards)
    ? CBR_DATA.cards.find(c => c.cardId === data.currentCardId) || CBR_DATA.cards[0]
    : null;
  if (!card) return;

  // ── Day Number ──────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
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
  const startVerse = (dayNum - 1) * 7 + 1;
  const endVerse = dayNum * 7;
  const dailyRef = `${storedChapter}:${startVerse}-${endVerse}`;
  
  const dailyTitle = document.getElementById('today-daily-title');
  const dailyTarget = document.getElementById('today-daily-target');
  const dailyInput = document.getElementById('today-daily-chapter-input');
  
  window.currentDailyRef = dailyRef;
  window.currentDailyChapter = storedChapter;
  
  if (dailyTitle) dailyTitle.textContent = storedChapter;
  if (dailyTarget) dailyTarget.textContent = `Target: verses ${startVerse}-${endVerse}`;
  if (dailyInput) dailyInput.value = storedChapter;

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

    if (qHeaderTitle) {
      if (lesson && lesson.title) {
        qHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Study Questions</div><div style="font-size:0.73rem; font-weight:600; color:var(--text-muted); line-height:1.25; margin-top:0.15rem;">${lesson.title}</div>`;
      } else {
        qHeaderTitle.innerHTML = `<div style="font-size:0.96rem; font-weight:800; color:var(--text-primary); line-height:1.2;">Study Questions</div>`;
      }
    }

    if (lesson && lesson.questions && lesson.questions.length > 0) {
      qList.innerHTML = lesson.questions.map(q => `<li>${q}</li>`).join('');
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
  const todayStr = new Date().toISOString().split('T')[0];
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

function downloadJournalImage() {
  const canvas = document.getElementById('today-journal-canvas');
  const data = window.getActiveData ? getActiveData() : null;
  if (!canvas || !data) return;

  const isDark = !document.body.classList.contains('light-mode');
  const bg = isDark ? '#0b1120' : '#f8fafc';
  const panelBg = isDark ? '#1e293b' : '#ffffff';
  const textCol = isDark ? '#f0f4ff' : '#0f172a';
  const headingCol = isDark ? '#f0f4ff' : '#0f172a';
  const sectionCol = isDark ? '#38bdf8' : '#0284c7';
  const bodyCol = isDark ? '#e2e8f0' : '#1e293b';

  const todayStr = new Date().toISOString().split('T')[0];
  let dayNum = 1;
  if (data.commencingDate) {
    const diff = Math.floor((new Date(todayStr) - new Date(data.commencingDate)) / 86400000);
    if (diff >= 0 && diff < 28) dayNum = diff + 1;
    else if (diff >= 28) dayNum = 28;
  }
  const dayDataRaw = (data.days || []).find(d => d.dayNumber === dayNum) || {};
  const dayData = _normalizeDayDataJournal(dayDataRaw);
  const method = (dayData.studyMethod || 'FID').toUpperCase();

  const W = 1080;
  let lines = [];
  
  // Header section
  lines.push({ text: `CBRSM CHALLENGER · DEVOTIONAL JOURNAL`, font: 'bold 20px system-ui, sans-serif', color: '#f59e0b', height: 20, spaceAfter: 25 });
  
  const userName = data.username && data.username !== "Trainee" ? data.username : "";
  const userPeg = data.peg || "";
  const userCohort = data.cohort || "";
  let metaInfo = [userName, userPeg ? `PEG: ${userPeg}` : "", userCohort ? `Cohort: ${userCohort}` : ""].filter(Boolean).join("  •  ");
  if (metaInfo) {
    lines.push({ text: `Day ${dayNum} Reflection`, font: 'bold 42px system-ui, sans-serif', color: headingCol, height: 42, spaceAfter: 20 });
    lines.push({ text: metaInfo, font: '600 24px system-ui, sans-serif', color: isDark ? '#94a3b8' : '#64748b', height: 24, spaceAfter: 50 });
  } else {
    lines.push({ text: `Day ${dayNum} Reflection`, font: 'bold 42px system-ui, sans-serif', color: headingCol, height: 42, spaceAfter: 50 });
  }

  const addSection = (label, val) => {
    if (!val) return;
    lines.push({ text: label, font: 'bold 22px system-ui, sans-serif', color: sectionCol, isSectionLabel: true, height: 22, spaceAfter: 25 });
    lines.push({ text: val, font: '28px Georgia, serif', color: bodyCol, wrap: true, height: 28, lineHeight: 42, spaceAfter: 45 });
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

  // Calculate exact height needed using top textBaseline
  let dummyCanvas = document.createElement('canvas');
  dummyCanvas.width = W;
  let dCtx = dummyCanvas.getContext('2d');
  dCtx.textBaseline = 'top';
  
  let totalH = 80; // Top margin
  lines.forEach(l => {
    if (l.wrap) {
      dCtx.font = l.font;
      const words = l.text.split(' ');
      let curLine = '';
      let lineCount = 1;
      for (let i = 0; i < words.length; i++) {
        let test = curLine + words[i] + ' ';
        if (dCtx.measureText(test).width > W - 200 && i > 0) {
          curLine = words[i] + ' ';
          lineCount++;
        } else {
          curLine = test;
        }
      }
      totalH += (lineCount * (l.lineHeight || 42)) + l.spaceAfter;
    } else {
      totalH += l.height + l.spaceAfter;
    }
  });
  totalH += 100; // Bottom margin + footer
  const H = Math.max(500, totalH);

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';

  // Fill Page Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Draw main document container
  ctx.fillStyle = panelBg;
  roundRect(ctx, 40, 40, W - 80, H - 80, 20);
  ctx.fill();

  // Top accent bar across the top edge of the document
  ctx.fillStyle = '#f59e0b';
  roundRect(ctx, 40, 40, W - 80, 8, [20, 20, 0, 0]);
  ctx.fill();

  let currentY = 80;
  lines.forEach(l => {
    if (l.isSectionLabel) {
      ctx.font = l.font;
      const textW = ctx.measureText(l.text).width || 200;
      
      // Draw small decorative pill around the section heading (centered vertically with top baseline)
      ctx.fillStyle = isDark ? 'rgba(56,189,248,0.18)' : 'rgba(14,165,233,0.12)';
      roundRect(ctx, 76, currentY - 6, textW + 28, l.height + 14, 8);
      ctx.fill();

      ctx.fillStyle = l.color;
      ctx.fillText(l.text, 90, currentY);
      currentY += l.height + l.spaceAfter;
    } else if (l.wrap) {
      ctx.fillStyle = l.color;
      ctx.font = l.font;
      const words = l.text.split(' ');
      let curLine = '';
      for (let i = 0; i < words.length; i++) {
        let test = curLine + words[i] + ' ';
        if (ctx.measureText(test).width > W - 200 && i > 0) {
          ctx.fillText(curLine, 90, currentY);
          curLine = words[i] + ' ';
          currentY += (l.lineHeight || 42);
        } else {
          curLine = test;
        }
      }
      ctx.fillText(curLine, 90, currentY);
      currentY += l.height + l.spaceAfter;
    } else {
      ctx.fillStyle = l.color;
      ctx.font = l.font;
      ctx.fillText(l.text, 80, currentY);
      currentY += l.height + l.spaceAfter;
    }
  });

  // Footer inside bottom right of document
  ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillText(`Generated on ${new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}`, 80, H - 70);

  const link = document.createElement('a');
  link.download = `cbr-journal-day-${dayNum}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── Daily Chapter Reading Logic ──────────────────────────────────────────────
window.changeDailyChapter = function() {
  const input = document.getElementById('today-daily-chapter-input');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  
  // Save to state
  if (window.appState) {
    appState.dailyReadingChapter = val;
    if (window.saveState) saveState();
  }
  
  // Re-run updateTodayTab to recalculate the reference
  if (window.updateTodayTab) updateTodayTab();
  
  // Fetch immediately
  if (window.currentDailyRef) {
    fetchAndDisplayDailyVerse(window.currentDailyRef, 'NIV');
  }
};

async function fetchAndDisplayDailyVerse(ref, version = 'NIV') {
  if (!ref) return;
  const vText = document.getElementById('today-daily-text');
  const vRef  = document.getElementById('today-daily-ref');

  if (vRef) vRef.textContent = "Loading...";
  if (vText) vText.innerHTML = '<span class="loading-pulse">Fetching verses...</span>';

  try {
    const res = await fetch(`/api/bible/verse?ref=${encodeURIComponent(ref)}&version=${encodeURIComponent(version)}`);
    if (!res.ok) {
      if (res.status === 404) {
        if (vRef) vRef.textContent = `Completed`;
        if (vText) vText.innerHTML = `<p class="today-accord-empty">Chapter Completed for this Card! Great job. You can update your Target Chapter to start a new one.</p>`;
      } else {
        throw new Error('Fetch failed');
      }
      return;
    }
    
    const data = await res.json();
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
  } catch (e) {
    if (vRef) vRef.textContent = `${ref} (${version})`;
    if (vText) vText.innerHTML = `<p class="today-accord-empty">Unable to load verses at this time.</p>`;
  }
}

function downloadDailyCard() {
  const canvas  = document.getElementById('today-daily-canvas');
  const refEl   = document.getElementById('today-daily-ref');
  const textEl  = document.getElementById('today-daily-text');
  if (!canvas || !refEl || !textEl) return;

  const W = 1200;
  const isDark  = !document.body.classList.contains('light-mode');
  const bg      = isDark ? '#080d17' : '#f0f4f8';
  const accent  = '#f59e0b';
  const textCol = isDark ? '#f0f4ff' : '#0f172a';
  const mutedCol= isDark ? '#94a3b8' : '#475569';

  const ctx = canvas.getContext('2d');
  
  // Extract text nodes safely
  let passageTexts = [];
  const blocks = textEl.querySelectorAll('.passage-block');
  if (blocks.length > 0) {
    blocks.forEach(b => {
      const pRef = b.querySelector('div:first-child').innerText;
      const pTxt = b.querySelector('div:last-child').innerText;
      passageTexts.push({ ref: pRef, txt: pTxt });
    });
  } else {
    passageTexts.push({ ref: '', txt: textEl.innerText });
  }

  // Measure pass 1 to determine height
  ctx.font = '500 48px system-ui, sans-serif';
  let measuredH = 300; 
  const passLines = [];
  
  passageTexts.forEach(pt => {
    if (pt.ref) measuredH += 60;
    ctx.font = '500 48px system-ui, sans-serif';
    const lines = getWrappedLinesList(ctx, pt.txt, W - 160);
    passLines.push({ pt, lines });
    measuredH += (lines.length * 68) + 40;
  });

  const H = Math.max(800, measuredH + 200);
  canvas.width = W;
  canvas.height = H;

  // Draw background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  
  // Outer border
  ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Logo / Branding
  ctx.fillStyle = accent;
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.fillText('CBR CHALLENGER', 80, 90);

  // Card Type Tag
  ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(80, 140, 260, 50, 25);
  ctx.fill();
  
  ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('DAILY CHAPTER READING', 105, 173);

  // Main Reference
  ctx.fillStyle = textCol;
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText(refEl.innerText.replace(' (NIV)', ''), 80, 280);
  ctx.fillStyle = accent;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText('NIV', 80 + ctx.measureText(refEl.innerText.replace(' (NIV)', '')).width + 20, 275);

  // Draw Verses
  let currentY = 380;
  passLines.forEach((pl, idx) => {
    if (pl.pt.ref) {
      ctx.fillStyle = accent;
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText(pl.pt.ref, 80, currentY);
      currentY += 50;
    }
    
    ctx.fillStyle = textCol;
    ctx.font = '500 48px system-ui, sans-serif';
    pl.lines.forEach(line => {
      ctx.fillText(line, 80, currentY);
      currentY += 68;
    });
    currentY += 40; // spacing between passages
  });

  // Footer
  ctx.fillStyle = mutedCol;
  ctx.font = '500 24px system-ui, sans-serif';
  ctx.fillText(`Generated on ${new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}`, 80, H - 60);

  const link = document.createElement('a');
  link.download = `cbr-daily-reading.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
