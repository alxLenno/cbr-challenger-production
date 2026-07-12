let seData = {};   // { sessionNumber: { diligence:{}, bonus:{}, growthPoints } }
let seInitialized = false;
let seCurrentViewSession = 1;

async function initSessionEval() {
  if (seInitialized) {
    seRenderSelector();
    seRenderSessionView(seCurrentViewSession);
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
    
    // Also pull growth points from saved cards in appState
    if (appState && appState.savedCards) {
      appState.savedCards.forEach(card => {
        const cardId = card.currentCardId || card.cardId;
        if (cardId && card.totalScore !== undefined) {
          const sKey = String(cardId);
          if (!seData[sKey]) seData[sKey] = { diligence: {}, bonus: {}, growthPoints: 0 };
          seData[sKey].growthPoints = card.totalScore;
        }
      });
    }
    
    // Default to the user's current card session
    seCurrentViewSession = appState && appState.currentCardId ? appState.currentCardId : 1;
    
    seInitialized = true;
    seRenderSelector();
    seRenderSessionView(seCurrentViewSession);
    seBindSelector();
    seBindCheckboxes();
    seRecalcGrandTotals();
  } catch(e) {
    console.error('Session eval load error', e);
  }
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
  let currentDiligenceScore = 0;
  document.querySelectorAll('.diligence-cb').forEach(cb => {
    const num = cb.dataset.num;
    const isChecked = sData.diligence[num] || false;
    
    cb.classList.toggle('checked', isChecked);
    cb.classList.toggle('locked', !isEditable);
    
    if (isChecked) currentDiligenceScore += 10;
  });
  
  const scoreEl = document.getElementById('se-current-diligence-score');
  if (scoreEl) scoreEl.textContent = `${currentDiligenceScore} / 60`;
  
  // Growth Points
  const gpEl = document.getElementById('se-current-growth-points');
  if (gpEl) {
    let gp = sData.growthPoints || 0;
    if (isCurrent && appState) {
      const stats = calculateScores();
      gp = stats.totalScore;
    }
    gpEl.textContent = isFuture ? '—' : gp;
  }
  
  // Bonus (Only show on Session 7)
  const bonusSection = document.getElementById('se-bonus-section');
  if (bonusSection) {
    bonusSection.style.display = (sessionNum === 7) ? 'block' : 'none';
  }
  
  let currentBonusScore = 0;
  if (sessionNum === 7) {
    document.querySelectorAll('.bonus-cb').forEach(cb => {
      const num = cb.dataset.num;
      const isChecked = sData.bonus[num] || false;
      
      cb.classList.toggle('checked', isChecked);
      cb.classList.toggle('locked', !isEditable);
      
      if (isChecked) currentBonusScore += 50;
    });
    
    const bonusScoreEl = document.getElementById('se-current-bonus-score');
    if (bonusScoreEl) bonusScoreEl.textContent = `${currentBonusScore} / 300`;
  }
  
  // Total preview
  const gpPreview = isFuture ? 0 : (isCurrent ? calculateScores().totalScore : (sData.growthPoints || 0));
  const sessionTotal = currentDiligenceScore + gpPreview + currentBonusScore;
  const previewEl = document.getElementById('se-session-total-preview');
  if (previewEl) {
    previewEl.innerHTML = `Session Total: <strong>${sessionTotal} pts</strong>`;
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
      seRecalcGrandTotals();
      debounceSeAutoSave(sessionNum);
    });
  });
}

function seRecalcGrandTotals() {
  const currentCard = appState ? appState.currentCardId : 1;
  let totalDiligence = 0;
  let totalGrowth = 0;
  let totalBonus = 0;

  for (let s = 1; s <= 7; s++) {
    const sData = seData[String(s)] || { diligence: {}, bonus: {}, growthPoints: 0 };
    
    // Only count accessible sessions (past + current)
    if (s <= currentCard) {
      // Diligence
      for (let d = 1; d <= 6; d++) {
        if (sData.diligence[String(d)]) totalDiligence += 10;
      }
      
      // Growth
      let gp = sData.growthPoints || 0;
      if (s === currentCard && appState) {
        gp = calculateScores().totalScore;
      }
      totalGrowth += gp;
      
      // Bonus (assumes bonus is saved in session 7)
      if (s === 7) {
        for (let b = 7; b <= 12; b++) {
          if (sData.bonus[String(b)]) totalBonus += 50;
        }
      }
    }
  }
  
  const grandTotal = totalDiligence + totalGrowth + totalBonus;
  
  // Update DOM
  const elD = document.getElementById('se-total-diligence');
  const elG = document.getElementById('se-total-growth');
  const elB = document.getElementById('se-total-bonus');
  const elA = document.getElementById('se-total-all');
  
  if (elD) elD.textContent = totalDiligence;
  if (elG) elG.textContent = totalGrowth;
  if (elB) elB.textContent = totalBonus;
  if (elA) {
    elA.textContent = grandTotal;
    elA.style.color = grandTotal >= 600 ? 'var(--success)' : 'var(--primary)';
  }
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
  
  let growthPoints = sData.growthPoints || 0;
  if (sessionNum === (appState && appState.currentCardId)) {
    growthPoints = calculateScores().totalScore;
  }
  
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




