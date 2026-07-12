function renderLibraryList() {
  elements.libraryTableBody.innerHTML = '';
  
  const emptyMsg = document.getElementById('history-empty-msg');
  const progressContainer = document.getElementById('history-progress-bar-container');
  
  renderSavedCardsCarousel();
  
  if (!appState.savedCards || appState.savedCards.length === 0) {
    elements.libraryTableBody.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (progressContainer) progressContainer.innerHTML = '';
    return;
  }
  
  if (emptyMsg) emptyMsg.style.display = 'none';

  // Build progress summary bars at the top
  if (progressContainer) {
    progressContainer.innerHTML = '';
    const heading = document.createElement('p');
    heading.style.cssText = 'font-size:0.72rem; color:var(--text-muted); margin-bottom:0.5rem; font-weight:600;';
    heading.innerText = `Overall Progress — ${appState.savedCards.length} card(s) completed`;
    progressContainer.appendChild(heading);
    
    appState.savedCards.forEach(card => {
      const totalWeeks = card.weeks ? card.weeks.length : 4;
      const maxScore = totalWeeks * 10;
      const pct = Math.round((card.totalScore / maxScore) * 100);
      const bar = document.createElement('div');
      bar.style.cssText = 'margin-bottom:0.4rem;';
      bar.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);margin-bottom:2px;">
          <span>Card ${card.cardId} · ${card.commencingDate}</span>
          <span>${card.totalScore}/${maxScore} pts (${pct}%)</span>
        </div>
        <div style="background:rgba(var(--primary-rgb),0.12);border-radius:99px;height:6px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:var(--primary);border-radius:99px;transition:width 0.5s ease;"></div>
        </div>`;
      progressContainer.appendChild(bar);
    });
  }
  
  // Sort newest first
  const sorted = [...appState.savedCards].reverse();
  
  sorted.forEach(card => {
    const tr = document.createElement('tr');
    
    // Card round
    const tdCard = document.createElement('td');
    tdCard.innerHTML = `<strong>Card ${card.cardId}</strong><br><span style="font-size:0.68rem;color:var(--text-muted);">${card.username}</span>`;
    tr.appendChild(tdCard);
    
    // Dates
    const totalWeeks = card.weeks ? card.weeks.length : 4;
    const endDate = (() => {
      if (!card.commencingDate) return '—';
      const d = new Date(card.commencingDate);
      d.setDate(d.getDate() + (totalWeeks * 7) - 1);
      return toLocalISOString(d);
    })();
    const tdDates = document.createElement('td');
    tdDates.style.fontSize = '0.7rem';
    tdDates.innerHTML = `${card.commencingDate}<br>→ ${endDate}`;
    tr.appendChild(tdDates);
    
    // Weeks
    const tdWeeks = document.createElement('td');
    tdWeeks.style.cssText = 'text-align:center; font-size:0.75rem;';
    tdWeeks.innerText = `${totalWeeks}w`;
    tr.appendChild(tdWeeks);
    
    // Score
    const maxScore = totalWeeks * 10;
    const pct = Math.round((card.totalScore / maxScore) * 100);
    const scoreColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning, #f59e0b)' : 'var(--danger)';
    const tdScore = document.createElement('td');
    tdScore.className = 'text-center';
    tdScore.innerHTML = `<span style="color:${scoreColor};font-weight:700;">${card.totalScore}</span><br><span style="font-size:0.65rem;color:var(--text-muted);">/${maxScore} (${pct}%)</span>`;
    tr.appendChild(tdScore);
    
    // Laxity
    const tdLaxity = document.createElement('td');
    tdLaxity.className = 'text-center';
    tdLaxity.innerHTML = `<span style="color:var(--danger);font-weight:700;">${card.totalLaxity}</span>`;
    tr.appendChild(tdLaxity);
    
    // Actions
    const tdActions = document.createElement('td');
    tdActions.className = 'library-actions';
    
    const btnView = document.createElement('button');
    btnView.className = 'btn btn-secondary btn-small';
    btnView.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    btnView.title = 'View this card';
    btnView.addEventListener('click', () => loadHistoricalView(card.instanceId));
    tdActions.appendChild(btnView);
    
    const btnPrint = document.createElement('button');
    btnPrint.className = 'btn btn-secondary btn-small';
    btnPrint.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>';
    btnPrint.title = 'Print this card';
    btnPrint.addEventListener('click', () => {
      historicalCardData = card;
      isViewingHistory = true;
      printChallengerCard(card);
      isViewingHistory = false;
      historicalCardData = null;
    });
    tdActions.appendChild(btnPrint);
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-secondary btn-small';
    btnDel.style.cssText = 'border-color:rgba(var(--danger-rgb),0.3);color:var(--danger);';
    btnDel.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    btnDel.title = 'Delete this archive';
    btnDel.addEventListener('click', () => deleteArchivedCard(card.instanceId));
    tdActions.appendChild(btnDel);
    
    tr.appendChild(tdActions);
    elements.libraryTableBody.appendChild(tr);
  });
}


async function restoreArchivedToActive(instanceId) {
  const targetCard = appState.savedCards.find(c => c.instanceId === instanceId);
  if (!targetCard) return;

  const cardId = targetCard.cardId || targetCard.currentCardId || 1;

  if (cardId === appState.currentCardId && !isViewingHistory) {
    showToast(`Card ${cardId} is already your currently active card!`, "warning");
    return;
  }

  const confirmed = await showModal({
    title: `Restore Card ${cardId}?`,
    subtitle: targetCard.commencingDate || '',
    message: `Would you like to restore Card ${cardId} (${targetCard.commencingDate || ''}) as your ACTIVE card? Any unarchived progress on your current board will be safely saved to history first.`,
    type: "info",
    confirmText: "Restore as Active",
    cancelText: "Cancel"
  });

  if (confirmed) {
    if (isViewingHistory) {
      isViewingHistory = false;
      historicalCardData = null;
      if (elements.historicalBanner) elements.historicalBanner.style.display = 'none';
      if (elements.usernameInput) elements.usernameInput.disabled = false;
      if (elements.contactInput) elements.contactInput.disabled = false;
      if (elements.churchInput) elements.churchInput.disabled = false;
      if (elements.cardSelector) elements.cardSelector.disabled = false;
      if (elements.commencingDateInput) elements.commencingDateInput.disabled = false;
    } else {
      autoArchiveIfNeeded();
    }

    appState.currentCardId = cardId;
    appState.activeInstanceId = targetCard.instanceId;
    appState.commencingDate = targetCard.commencingDate;
    appState.days = JSON.parse(JSON.stringify(targetCard.days || []));
    appState.weeks = JSON.parse(JSON.stringify(targetCard.weeks || []));
    if (targetCard.weaknesses) {
      appState.weaknesses = JSON.parse(JSON.stringify(targetCard.weaknesses));
    }

    if (elements.cardSelector) elements.cardSelector.value = appState.currentCardId;
    if (elements.commencingDateInput) elements.commencingDateInput.value = appState.commencingDate;

    syncAllTimelinesToFirstWeek();
    saveState();
    initUI();
    renderAll();

    const todayTabBtn = document.querySelector('.tab-btn[data-tab="tab-today"]');
    if (todayTabBtn) todayTabBtn.click();
    
    showToast(`Card ${cardId} restored and active!`, "success");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


function loadHistoricalView(instanceId) {
  const targetCard = appState.savedCards.find(c => c.instanceId === instanceId);
  if (!targetCard) return;
  
  historicalCardData = targetCard;
  isViewingHistory = true;
  
  // Show historical notification bar
  elements.historicalBanner.style.display = 'flex';
  
  // Load UI with historical card values
  initUI();
  renderAll();
  
  // Disable user profile setups temporarily
  elements.usernameInput.disabled = true;
  elements.contactInput.disabled = true;
  elements.churchInput.disabled = true;
  elements.cardSelector.disabled = true;
  elements.commencingDateInput.disabled = true;
  elements.weakness1Name.disabled = true;
  elements.weakness1Action.disabled = true;
  elements.weakness2Name.disabled = true;
  elements.weakness2Action.disabled = true;
  elements.weakness3Name.disabled = true;
  elements.weakness3Action.disabled = true;
  
  const todayTabBtn = document.querySelector('.tab-btn[data-tab="tab-today"]');
  if (todayTabBtn) todayTabBtn.click();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Exit historical viewing mode and return to active card logs
function exitHistoricalView() {
  isViewingHistory = false;
  historicalCardData = null;
  
  elements.historicalBanner.style.display = 'none';
  
  // Re-enable profile controls
  elements.usernameInput.disabled = false;
  elements.contactInput.disabled = false;
  elements.churchInput.disabled = false;
  elements.cardSelector.disabled = false;
  elements.commencingDateInput.disabled = false;
  elements.weakness1Name.disabled = false;
  elements.weakness1Action.disabled = false;
  elements.weakness2Name.disabled = false;
  elements.weakness2Action.disabled = false;
  elements.weakness3Name.disabled = false;
  elements.weakness3Action.disabled = false;
  
  initUI();
  renderAll();
  
  const historyTabBtn = document.querySelector('.tab-btn[data-tab="tab-history"]');
  if (historyTabBtn) historyTabBtn.click();
}

// Delete completed card snapshot from database
let pendingDeleteInstanceId = null;

function deleteArchivedCard(instanceId) {
  pendingDeleteInstanceId = instanceId;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.add('open');
}

function closeDeleteConfirmModal() {
  pendingDeleteInstanceId = null;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.remove('open');
}

function confirmDeleteArchivedCard() {
  if (!pendingDeleteInstanceId) return;
  const instanceId = pendingDeleteInstanceId;
  appState.savedCards = appState.savedCards.filter(c => c.instanceId !== instanceId);
  fetch(`/api/archive/${instanceId}`, { method: 'DELETE' })
    .catch(e => console.error("Failed to delete archive", e));
  saveState();
  renderLibraryList();
  closeDeleteConfirmModal();
}

// Trigger print process for the current active or loaded history card
