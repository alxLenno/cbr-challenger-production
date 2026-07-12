async function prefetchLeaderboard() {
  // Fire-and-forget background fetch
  try {
    leaderboardFetching = true;
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    leaderboardCache = data.leaderboard || [];
  } catch (e) {
    leaderboardCache = null; // allow retry on tab click
  } finally {
    leaderboardFetching = false;
  }
}

async function fetchLeaderboard() {
  const loader = document.getElementById('leaderboard-loader');
  const podium = document.getElementById('leaderboard-podium');
  const listWrapper = document.getElementById('leaderboard-list-wrapper');
  const tbody = document.getElementById('leaderboard-tbody');
  
  // If already cached, render instantly — no spinner
  if (leaderboardCache !== null) {
    renderLeaderboard(leaderboardCache, podium, listWrapper, tbody);
    return;
  }
  
  // Still loading or first click before prefetch finished — show spinner briefly
  loader.style.display = 'flex';
  podium.style.display = 'none';
  listWrapper.style.display = 'none';
  
  // If already fetching in background, poll until done
  if (leaderboardFetching) {
    const interval = setInterval(() => {
      if (!leaderboardFetching) {
        clearInterval(interval);
        if (leaderboardCache !== null) {
          loader.style.display = 'none';
          renderLeaderboard(leaderboardCache, podium, listWrapper, tbody);
        } else {
          loader.innerHTML = '<p style="color:var(--danger)">Error loading leaderboard. Please try again.</p>';
        }
      }
    }, 100);
    return;
  }
  
  // Fallback: fetch on demand
  try {
    leaderboardFetching = true;
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    leaderboardCache = data.leaderboard || [];
    loader.style.display = 'none';
    renderLeaderboard(leaderboardCache, podium, listWrapper, tbody);
  } catch (err) {
    loader.innerHTML = '<p style="color:var(--danger)">Error loading leaderboard.</p>';
  } finally {
    leaderboardFetching = false;
  }
}

function renderLeaderboard(leaderboardData, podium, listWrapper, tbody) {
  const loader = document.getElementById('leaderboard-loader');
  
  podium.innerHTML = '';
  tbody.innerHTML = '';
  
  if (!leaderboardData || leaderboardData.length === 0) {
    loader.style.display = 'flex';
    loader.innerHTML = '<p>No leaderboard data available yet.</p>';
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
      ? `<img src="${avatarSrc}" alt="${user.name}" class="podium-avatar">`
      : `<div class="podium-avatar podium-avatar-placeholder">${user.name.charAt(0).toUpperCase()}</div>`;
    
    const crownHtml = user._currentRank === 1
      ? `<div class="podium-crown"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2H7z"/></svg></div>`
      : '';
    
    const displayPoints = user[pointsKey] || 0;
    
    const pItem = document.createElement('div');
    pItem.className = `podium-item rank-${user._currentRank}`;
    pItem.innerHTML = `
      ${crownHtml}
      ${avatarHtml}
      <div class="podium-name" title="${user.name}">${user.name}</div>
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
        ? `<img src="${avatarSrc}" alt="${user.name}" class="user-avatar-small">`
        : `<div class="user-avatar-small user-avatar-placeholder">${user.name.charAt(0).toUpperCase()}</div>`;
        
      const displayPoints = user[pointsKey] || 0;
      const displayLaxity = user[laxityKey] || 0;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-rank">#${user._currentRank}</td>
        <td class="col-user"><div class="user-cell-content">${avatarHtml}<span>${user.name}</span></div></td>
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

