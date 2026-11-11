let leaderboardContext = null;
let leaderboardRequest = null;

function escapeLeaderboardText(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function updateLeaderboardContext() {
  const title=document.getElementById('leaderboard-scope-title');
  const description=document.getElementById('leaderboard-scope-description');
  if(title) title.textContent = '| ' + (leaderboardContext?.title || 'Your rankings');
  if(description) description.textContent = leaderboardContext?.description || 'Your results are shown according to your course and PEG access.';
}

async function requestLeaderboard() {
  if (leaderboardRequest) return leaderboardRequest;
  leaderboardFetching = true;
  leaderboardRequest = (async () => {
    const res = await fetch('/api/leaderboard', {cache:'no-store'});
    if (!res.ok || res.redirected || !res.headers.get('content-type')?.includes('application/json')) throw new Error('Could not load rankings. Check your connection and sign-in session.');
    const data = await res.json();
    if (!Array.isArray(data.leaderboard)) throw new Error('Could not load rankings. Please try again.');
    leaderboardCache = data.leaderboard;
    leaderboardContext = data.context || null;
    updateLeaderboardContext();
    return leaderboardCache;
  })().finally(() => { leaderboardFetching=false; leaderboardRequest=null; });
  return leaderboardRequest;
}

async function prefetchLeaderboard() {
  try { await requestLeaderboard(); }
  catch (_) { leaderboardCache=null; }
}

function showLeaderboardEmpty(loader) {
  loader.replaceChildren();
  const title=document.createElement('h3');
  title.textContent=leaderboardContext?.emptyTitle || 'No rankings to show';
  const text=document.createElement('p');
  text.textContent=leaderboardContext?.emptyMessage || 'There are no members in your available ranking group.';
  loader.append(title,text);
  const action=leaderboardContext?.action;
  if (action==='manage'||action==='profile') {
    const button=document.createElement('button');button.type='button';button.className='btn btn-secondary';
    button.textContent=action==='manage'?'Manage courses & PEGs':'Profile & Settings';
    button.addEventListener('click',()=>{
      openAppSection(action==='manage'?'tab-admin-progress':'tab-account');
      if(action==='manage') {const manager=document.getElementById('course-manager');if(manager){manager.open=true;manager.scrollIntoView({block:'start'});}}
      else {document.querySelector('[data-subtab="tab-profile"]')?.click();document.getElementById('course-enrollment')?.scrollIntoView({block:'center'});}
    });
    loader.append(button);
  }
}

async function fetchLeaderboard() {
  const loader=document.getElementById('leaderboard-loader');
  const podium=document.getElementById('leaderboard-podium');
  const listWrapper=document.getElementById('leaderboard-list-wrapper');
  const tbody=document.getElementById('leaderboard-tbody');
  if(leaderboardCache!==null) renderLeaderboard(leaderboardCache,podium,listWrapper,tbody);
  else {loader.style.display='flex';podium.style.display='none';listWrapper.style.display='none';loader.innerHTML='<div class="spinner"></div><p>Fetching rankings…</p>';}
  try {await requestLeaderboard();renderLeaderboard(leaderboardCache,podium,listWrapper,tbody);}
  catch(error) {
    podium.style.display='none';listWrapper.style.display='none';loader.style.display='flex';loader.replaceChildren();
    const text=document.createElement('p');text.textContent=error.message;
    const retry=document.createElement('button');retry.type='button';retry.className='btn btn-secondary';retry.textContent='Retry';retry.addEventListener('click',fetchLeaderboard);
    loader.append(text,retry);
  }
}

function renderLeaderboard(leaderboardData, podium, listWrapper, tbody) {
  const loader = document.getElementById('leaderboard-loader');
  
  podium.innerHTML = '';
  tbody.innerHTML = '';
  
  if (!leaderboardData || leaderboardData.length === 0) {
    loader.style.display = 'flex';
    showLeaderboardEmpty(loader);
    return;
  }
  
  loader.style.display = 'none';
  
  // Clone the array so we can sort without mutating the cache
  let sortedData = [...leaderboardData];
  
  // Determine the key to sort by based on the active filter
  const pointsKey = `${lbCurrentFilter}_points`;
  const laxityKey = `${lbCurrentFilter}_laxity`;
  
  // Sort by points (descending), then laxity (ascending)
  sortedData.sort((a, b) => {
    const ptsDiff = (b[pointsKey] || 0) - (a[pointsKey] || 0);
    if (ptsDiff !== 0) return ptsDiff;
    return (a[laxityKey] || 0) - (b[laxityKey] || 0);
  });
  
  // Assign new ranks based on current sort
  sortedData.forEach((user, index) => {
    user._currentRank = index + 1;
  });
  
  // --- PODIUM: Top 3 ---
  const top3 = sortedData.slice(0, 3);
  // Display order: 2nd left, 1st center, 3rd right
  const podiumOrder = [top3[1] || null, top3[0] || null, top3[2] || null];
  
  podiumOrder.forEach(user => {
    if (!user) return;
    const avatarSrc = user.avatar || '';
    const avatarHtml = avatarSrc
      ? `<img src="${escapeLeaderboardText(avatarSrc)}" alt="${escapeLeaderboardText(user.name)}" class="podium-avatar">`
      : `<div class="podium-avatar podium-avatar-placeholder">${escapeLeaderboardText(String(user.name || '?').charAt(0).toUpperCase())}</div>`;
    
    const crownHtml = user._currentRank === 1
      ? `<div class="podium-crown"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2H7z"/></svg></div>`
      : '';
    
    const displayPoints = user[pointsKey] || 0;
    
    const pItem = document.createElement('div');
    pItem.className = `podium-item rank-${user._currentRank}`;
    pItem.innerHTML = `
      ${crownHtml}
      ${avatarHtml}
      <div class="podium-name" title="${escapeLeaderboardText(user.name)}">${escapeLeaderboardText(user.name)}</div>
      <div class="podium-points"><strong>${displayPoints}</strong> PTS</div>
      <div class="podium-card-label">Card ${user.cardLevel}</div>
      <div class="podium-rank-badge">${user._currentRank}</div>
    `;
    podium.appendChild(pItem);
  });
  podium.style.display = 'flex';
  
  // --- TABLE: Rank 4+ ---
  const rest = sortedData.slice(3);
  if (rest.length > 0) {
    rest.forEach(user => {
      const avatarSrc = user.avatar || '';
      const avatarHtml = avatarSrc
        ? `<img src="${escapeLeaderboardText(avatarSrc)}" alt="${escapeLeaderboardText(user.name)}" class="user-avatar-small">`
        : `<div class="user-avatar-small user-avatar-placeholder">${escapeLeaderboardText(String(user.name || '?').charAt(0).toUpperCase())}</div>`;
        
      const displayPoints = user[pointsKey] || 0;
      const displayLaxity = user[laxityKey] || 0;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-rank">#${user._currentRank}</td>
        <td class="col-user"><div class="user-cell-content">${avatarHtml}<span>${escapeLeaderboardText(user.name)}</span></div></td>
        <td class="col-card"><span class="card-badge">Card ${user.cardLevel}</span></td>
        <td class="col-points text-right">${displayPoints}</td>
        <td class="col-laxity text-center">${displayLaxity}</td>
      `;
      tbody.appendChild(tr);
    });
    listWrapper.style.display = 'block';
  } else {
    listWrapper.style.display = 'none';
  }
}
