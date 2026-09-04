let seData = {};   // { sessionNumber: { diligence:{}, bonus:{}, growthPoints } }
let seInitialized = false;
let seCurrentViewSession = 1;

async function initSessionEval() {
  seBindPrintButton();
  if (seInitialized) {
    syncSessionEvalToActiveCard();
    return;
  }
  try {
    const res = await fetch('/api/session_eval');
    const json = await res.json();
    const sessions = json.sessions || {};
    // Merge fetched data into seData
    for (let i = 1; i <= 7; i++) {
      if (!seData[i]) seData[i] = { diligence: {}, bonus: {}, growthPoints: 0 };
    }
    for (const sNum in sessions) {
      seData[sNum] = sessions[sNum];
    }
    
    // Default to the user's current card session
    seCurrentViewSession = appState && appState.currentCardId ? appState.currentCardId : 1;
    
    seInitialized = true;
    seRenderSelector();
    seRenderSessionView(seCurrentViewSession);
    seBindSelector();
    seBindCheckboxes();
  } catch(e) {
    console.error('Session eval load error', e);
  }
}

function syncSessionEvalToActiveCard() {
  seCurrentViewSession = Number(appState && appState.currentCardId) || 1;
  if (!seInitialized) return;

  seRenderSelector();
  seRenderSessionView(seCurrentViewSession);
}

function seBindPrintButton() {
  const button = document.getElementById('se-print-card-btn');
  if (!button || button.dataset.bound === '1') return;
  button.dataset.bound = '1';
  button.addEventListener('click', () => printChallengerCard(getActiveData()));
}

function seGetLatestArchivedCard(sessionNum) {
  const cards = appState && Array.isArray(appState.savedCards)
    ? appState.savedCards.filter(card => Number(card.currentCardId || card.cardId) === Number(sessionNum))
    : [];

  return cards.reduce((latest, card) => {
    if (!latest) return card;
    const latestTime = Date.parse(latest.savedAt || '') || 0;
    const cardTime = Date.parse(card.savedAt || '') || 0;
    return cardTime >= latestTime ? card : latest;
  }, null);
}

function seGetSessionGrowthPoints(sessionNum) {
  const currentCard = Number(appState && appState.currentCardId) || 1;
  if (Number(sessionNum) > currentCard) return 0;
  if (Number(sessionNum) === currentCard && appState) {
    return calculateScoresForData(appState).totalScore;
  }

  const archivedCard = seGetLatestArchivedCard(sessionNum);
  if (archivedCard) {
    if (Array.isArray(archivedCard.days) && Array.isArray(archivedCard.weeks)) {
      return calculateScoresForData(archivedCard).totalScore;
    }
    if (archivedCard.totalScore !== undefined) {
      return Number(archivedCard.totalScore) || 0;
    }
  }

  const stored = seData[String(sessionNum)] || {};
  return Number(stored.growthPoints) || 0;
}

function seGetSessionScores(sessionNum) {
  const sData = seData[String(sessionNum)] || { diligence: {}, bonus: {} };
  let diligence = 0;
  let bonus = 0;

  for (let criterion = 1; criterion <= 6; criterion++) {
    if (sData.diligence && sData.diligence[String(criterion)]) diligence += 10;
  }
  if (Number(sessionNum) === 7) {
    for (let criterion = 7; criterion <= 12; criterion++) {
      if (sData.bonus && sData.bonus[String(criterion)]) bonus += 50;
    }
  }

  const growth = seGetSessionGrowthPoints(sessionNum);
  return { diligence, growth, bonus, total: diligence + growth + bonus };
}

function seRenderSelectedSessionSummary(sessionNum) {
  const currentCard = Number(appState && appState.currentCardId) || 1;
  const isFuture = Number(sessionNum) > currentCard;
  const scores = isFuture
    ? { diligence: 0, growth: 0, bonus: 0, total: 0 }
    : seGetSessionScores(sessionNum);
  const label = document.getElementById('se-selected-session-label');
  const target = document.getElementById('se-target-label');

  if (label) label.textContent = `Session ${sessionNum}`;
  if (document.getElementById('se-total-diligence')) document.getElementById('se-total-diligence').textContent = isFuture ? '—' : scores.diligence;
  if (document.getElementById('se-total-growth')) document.getElementById('se-total-growth').textContent = isFuture ? '—' : scores.growth;
  if (document.getElementById('se-total-bonus')) document.getElementById('se-total-bonus').textContent = isFuture ? '—' : scores.bonus;
  if (document.getElementById('se-total-all')) document.getElementById('se-total-all').textContent = isFuture ? '—' : scores.total;
  if (target) target.textContent = Number(sessionNum) === 7
    ? 'Diligence + growth + final bonus'
    : 'Diligence + growth';
}

function seRenderSelector() {
  const select = document.getElementById('se-session-select');
  if (!select) return;
  select.innerHTML = '';
  
  const currentCard = appState ? appState.currentCardId : 1;
  
  for (let s = 1; s <= 7; s++) {
    const option = document.createElement('option');
    option.value = s;
    if (s < currentCard) {
      option.textContent = `Session ${s} — Completed`;
    } else if (s === currentCard) {
      option.textContent = `Session ${s} — Active`;
    } else {
      option.textContent = `Session ${s} — Upcoming`;
    }
    select.appendChild(option);
  }
  
  select.value = seCurrentViewSession;
}

function seBindSelector() {
  const select = document.getElementById('se-session-select');
  if (select) {
    select.addEventListener('change', (e) => {
      seCurrentViewSession = parseInt(e.target.value);
      seRenderSessionView(seCurrentViewSession);
    });
  }
}

function seRenderSessionView(sessionNum) {
  const currentCard = appState ? appState.currentCardId : 1;
  const sData = seData[String(sessionNum)] || { diligence: {}, bonus: {}, growthPoints: 0 };
  
  const isPast = sessionNum < currentCard;
  const isCurrent = sessionNum === currentCard;
  const isFuture = sessionNum > currentCard;
  const isEditable = isCurrent; // Only the current session is editable
  const sessionScores = isFuture
    ? { diligence: 0, growth: 0, bonus: 0, total: 0 }
    : seGetSessionScores(sessionNum);
  
  // Update badge
  const badge = document.getElementById('se-status-badge');
  if (badge) {
    badge.className = 'se-status-badge';
    if (isPast) {
      badge.classList.add('se-badge-completed');
      badge.innerHTML = '<i data-lucide="check-circle" style="width:14px;height:14px;"></i> Completed (Read Only)';
    } else if (isCurrent) {
      badge.classList.add('se-badge-active');
      badge.innerHTML = '<i data-lucide="edit-2" style="width:14px;height:14px;"></i> Active (Editable)';
    } else {
      badge.classList.add('se-badge-locked');
      badge.innerHTML = '<i data-lucide="lock" style="width:14px;height:14px;"></i> Locked (Not Reached)';
    }
  }
  if (window.lucide) lucide.createIcons();

  // Diligence Checkboxes
  document.querySelectorAll('.diligence-cb').forEach(cb => {
    const num = cb.dataset.num;
    const isChecked = sData.diligence[num] || false;
    
    cb.classList.toggle('checked', isChecked);
    cb.classList.toggle('locked', !isEditable);
    
  });
  
  const scoreEl = document.getElementById('se-current-diligence-score');
  if (scoreEl) scoreEl.textContent = `${sessionScores.diligence} / 60`;
  
  // Growth Points
  const gpEl = document.getElementById('se-current-growth-points');
  if (gpEl) {
    gpEl.textContent = isFuture ? '—' : sessionScores.growth;
  }
  
  // Bonus (Only show on Session 7)
  const bonusSection = document.getElementById('se-bonus-section');
  if (bonusSection) {
    bonusSection.style.display = (sessionNum === 7) ? 'block' : 'none';
  }
  
  if (sessionNum === 7) {
    document.querySelectorAll('.bonus-cb').forEach(cb => {
      const num = cb.dataset.num;
      const isChecked = sData.bonus[num] || false;
      
      cb.classList.toggle('checked', isChecked);
      cb.classList.toggle('locked', !isEditable);
      
    });
    
    const bonusScoreEl = document.getElementById('se-current-bonus-score');
    if (bonusScoreEl) bonusScoreEl.textContent = `${sessionScores.bonus} / 300`;
  }
  
  seRenderSelectedSessionSummary(sessionNum);

  // Per-session total: Reference Card diligence + this session's Challenger Card growth.
  const previewEl = document.getElementById('se-session-total-preview');
  if (previewEl) {
    previewEl.innerHTML = isFuture
      ? 'Session Total: <strong>—</strong>'
      : `Session ${sessionNum} Total: <strong>${sessionScores.total} pts</strong>`;
  }
}

function seBindCheckboxes() {
  document.querySelectorAll('.se-checkbox').forEach(cb => {
    cb.addEventListener('click', () => {
      if (cb.classList.contains('locked')) return;
      
      const num = cb.dataset.num;
      const isBonus = cb.classList.contains('bonus-cb');
      const sessionNum = seCurrentViewSession;
      
      if (!seData[sessionNum]) seData[sessionNum] = { diligence: {}, bonus: {}, growthPoints: 0 };
      
      if (isBonus) {
        if (!seData[sessionNum].bonus) seData[sessionNum].bonus = {};
        seData[sessionNum].bonus[num] = !seData[sessionNum].bonus[num];
      } else {
        if (!seData[sessionNum].diligence) seData[sessionNum].diligence = {};
        seData[sessionNum].diligence[num] = !seData[sessionNum].diligence[num];
      }
      
      seRenderSessionView(sessionNum);
      debounceSeAutoSave(sessionNum);
    });
  });
}

let seSaveTimers = {};
function debounceSeAutoSave(sessionNum) {
  const statusEl = document.getElementById('se-save-status-text');
  if (statusEl) statusEl.innerHTML = '⏳ Saving...';
  
  clearTimeout(seSaveTimers[sessionNum]);
  seSaveTimers[sessionNum] = setTimeout(async () => {
    await saveSessionEval(sessionNum);
    if (statusEl) statusEl.innerHTML = '✅ Changes auto-saved';
  }, 800);
}

async function saveSessionEval(sessionNum) {
  const sData = seData[String(sessionNum)] || { diligence: {}, bonus: {}, growthPoints: 0 };
  
  const growthPoints = seGetSessionGrowthPoints(sessionNum);
  sData.growthPoints = growthPoints;
  
  try {
    await fetch('/api/session_eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionNumber: sessionNum,
        diligence: sData.diligence || {},
        bonus: sData.bonus || {},
        growthPoints
      })
    });
  } catch(e) {
    console.error('Session eval save error', e);
  }
}
