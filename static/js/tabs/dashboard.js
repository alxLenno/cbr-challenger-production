// Render Header and KPI Counters
function renderHeaderAndKPIs() {
  const data = getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
  elements.kpiTargetChapters.innerText = `${card.chaptersTarget} Chs / ${card.ertTarget}`;
  
  const completedDays = data.days.filter(d => d.wakingTime || (d.morningChapters + d.laterChapters) > 0).length;
  elements.kpiCompletedDays.innerText = `${completedDays} / ${data.weeks.length * 7}`;
  
  const stats = calculateScores();
  elements.kpiTotalPoints.innerText = `${stats.totalScore} pts`;
  elements.kpiLaxityPoints.innerText = `${stats.totalLaxity} pts`;
  
  // Update chart week selector options (native select + custom dropdown)
  const sel = elements.weekSelectChart;
  const prevVal = currentWeekForChart;
  sel.innerHTML = '';
  for (let w = 1; w <= data.weeks.length; w++) {
    const opt = document.createElement('option');
    opt.value = w;
    opt.innerText = `Week ${w}`;
    if (w === prevVal) opt.selected = true;
    sel.appendChild(opt);
  }
  if (currentWeekForChart > data.weeks.length) {
    currentWeekForChart = data.weeks.length;
    sel.value = currentWeekForChart;
  }

  // Populate custom dropdown list
  if (elements.cwdList && elements.cwdLabel) {
    elements.cwdList.innerHTML = '';
    for (let w = 1; w <= data.weeks.length; w++) {
      const li = document.createElement('li');
      li.textContent = `Week ${w}`;
      li.setAttribute('role', 'option');
      if (w === currentWeekForChart) {
        li.classList.add('selected');
        elements.cwdLabel.textContent = `Week ${w}`;
      }
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        // Update selection state
        elements.cwdList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');
        currentWeekForChart = w;
        elements.cwdLabel.textContent = `Week ${w}`;
        // Sync native select
        sel.value = w;
        // Close dropdown
        elements.cwdList.classList.remove('open');
        elements.cwdTrigger.classList.remove('open');
        elements.cwdTrigger.setAttribute('aria-expanded', 'false');
        // Re-render chart
        renderChart();
      });
      elements.cwdList.appendChild(li);
    }
  }
}

// Render the 28 Days Calendar Grid
function renderCalendarGrid() {
  elements.weeksGridContainer.innerHTML = '';
  const data = getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
  const targetERT = timeStringToDecimal(card.ertTarget);
  
  for (let w = 0; w < data.weeks.length; w++) {
    const weekNum = w + 1;
    const weekDiv = document.createElement('div');
    weekDiv.className = 'week-container';
    
    // Week Title and Accountability check
    const header = document.createElement('div');
    header.className = 'week-header';
    const titleSpan = document.createElement('span');
    titleSpan.innerText = `Week ${weekNum}`;
    header.appendChild(titleSpan);
    
    const accLabel = document.createElement('label');
    accLabel.className = 'check-item';
    accLabel.style.fontSize = '0.75rem';
    
    const accCheck = document.createElement('input');
    accCheck.type = 'checkbox';
    accCheck.checked = data.weeks[w].sharedFid;
    accCheck.disabled = isViewingHistory;
    
    accCheck.addEventListener('change', (e) => {
      if (isViewingHistory) return;
      appState.weeks[w].sharedFid = e.target.checked;
      saveState();
      renderAll();
    });
    
    accLabel.appendChild(accCheck);
    accLabel.appendChild(document.createTextNode(' Sharing / PE Meeting'));
    header.appendChild(accLabel);
    weekDiv.appendChild(header);
    
    // Days Grid Row
    const daysRow = document.createElement('div');
    daysRow.className = 'days-row';
    
    for (let d = 0; d < 7; d++) {
      const dayIdx = w * 7 + d;
      const dayNum = dayIdx + 1;
      const dayData = data.days[dayIdx];
      const dayDate = addDays(data.commencingDate, dayIdx);
      
      const dayBlock = document.createElement('div');
      dayBlock.className = 'day-block';
      
      const todayStr = new Date().toISOString().split('T')[0];
      if (dayDate === todayStr && !isViewingHistory) {
        dayBlock.classList.add('active');
      }
      
      dayBlock.addEventListener('click', () => openDayModal(dayNum));
      
      // Day Header
      const dHeader = document.createElement('div');
      dHeader.className = 'day-num-header';
      const numSpan = document.createElement('span');
      numSpan.innerText = `Day ${dayNum}`;
      dHeader.appendChild(numSpan);
      
      const dateSpan = document.createElement('span');
      dateSpan.className = 'day-date-label';
      dateSpan.innerText = formatDateLabel(dayDate).split(',')[0];
      dHeader.appendChild(dateSpan);
      dayBlock.appendChild(dHeader);
      
      // Waking time display
      const timeVal = dayData.wakingTime || "--:--";
      const decTime = timeStringToDecimal(dayData.wakingTime);
      const timeDiv = document.createElement('div');
      timeDiv.className = 'day-waking-time';
      
      let timeIcon = '<i data-lucide="clock" style="display:inline-block;vertical-align:middle;width:14px;height:14px;"></i>';
      if (decTime !== null) {
        if (decTime <= targetERT) {
          timeDiv.style.color = 'var(--success)';
          timeIcon = '<i data-lucide="sun" style="display:inline-block;vertical-align:middle;width:14px;height:14px;"></i>';
        } else {
          timeDiv.style.color = 'var(--danger)';
          timeIcon = '<i data-lucide="moon" style="display:inline-block;vertical-align:middle;width:14px;height:14px;"></i>';
        }
      }
      timeDiv.innerHTML = `${timeIcon} ${timeVal}`;
      dayBlock.appendChild(timeDiv);
      
      // Reading Speed (Chapters) display
      const readDiv = document.createElement('div');
      readDiv.className = 'day-reading';
      const totalChapters = dayData.morningChapters + dayData.laterChapters;
      if (totalChapters > 0) {
        readDiv.innerText = dayData.bibleBook ? `${dayData.bibleBook} ${dayData.startChapter}-${dayData.endChapter}` : `${totalChapters} Chs`;
      } else {
        readDiv.innerText = "No Reading";
        readDiv.style.color = 'var(--text-muted)';
      }
      dayBlock.appendChild(readDiv);
      
      // Reading details visual indicators
      const detailDiv = document.createElement('div');
      detailDiv.className = 'day-reading-details';
      if (dayData.morningChapters > 0) {
        const mShade = document.createElement('span');
        mShade.className = 'read-shade morning';
        mShade.title = `${dayData.morningChapters} morning chapters`;
        detailDiv.appendChild(mShade);
      }
      if (dayData.laterChapters > 0) {
        const lShade = document.createElement('span');
        lShade.className = 'read-shade later';
        lShade.title = `${dayData.laterChapters} later chapters`;
        detailDiv.appendChild(lShade);
      }
      dayBlock.appendChild(detailDiv);
      
      // Checkbox dots
      const disciplinesDiv = document.createElement('div');
      disciplinesDiv.className = 'day-disciplines';
      
      const dots = [
        { name: 'recitedMemory', title: 'Scripture Memory' },
        { name: 'fidJournaling', title: 'FID Journaling' },
        { name: 'prayer10mins', title: '10 Mins Prayer' },
        { name: 'dataValidity', title: 'Data Validity', isValidity: true }
      ];
      
      const isPastOrCurrent = (dayDate <= todayStr) || isViewingHistory;
      dots.forEach(dot => {
        const dotSpan = document.createElement('span');
        dotSpan.className = 'disc-dot';
        if (dayData[dot.name]) {
          dotSpan.classList.add(dot.isValidity ? 'valid' : 'checked');
          dotSpan.innerText = '✓';
        } else if (isPastOrCurrent) {
          dotSpan.classList.add('missed');
          dotSpan.innerText = '✕';
        }
        let notDoneText = 'Incomplete';
        if (dot.name === 'recitedMemory') notDoneText = 'Not Recited (✕)';
        else if (dot.name === 'fidJournaling') notDoneText = 'No Journal Entry (✕)';
        else if (dot.name === 'prayer10mins') notDoneText = 'Prayer Not Logged (✕)';
        else if (dot.name === 'dataValidity') notDoneText = 'Not Validated (✕)';
        
        dotSpan.title = `${dot.title}: ${dayData[dot.name] ? 'Completed' : (isPastOrCurrent ? notDoneText : 'Future')}`;
        disciplinesDiv.appendChild(dotSpan);
      });
      dayBlock.appendChild(disciplinesDiv);
      
      // Consistency Barrier Badge
      if (dayData.cbId) {
        const cbBadge = document.createElement('span');
        cbBadge.className = 'day-cb-badge';
        if (dayData.cbResolved) {
          cbBadge.classList.add('redeemed');
          cbBadge.innerText = `CB ${dayData.cbId} (✓)`;
        } else {
          cbBadge.innerText = `CB ${dayData.cbId}`;
        }
        dayBlock.appendChild(cbBadge);
      }
      daysRow.appendChild(dayBlock);
    }
    weekDiv.appendChild(daysRow);
    elements.weeksGridContainer.appendChild(weekDiv);
  }
}

// Generate weekly points and laxity values
function calculateScores(cardState = null) {
  const data = cardState || getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId) || CBR_DATA.cards[0];
  const targetChapters = card.chaptersTarget;
  const targetERT = timeStringToDecimal(card.ertTarget);
  
  const weeklyStats = [];
  let totalScore = 0;
  let totalLaxity = 0;
  
  // Rule: You only redeem a CB ONCE in a CARD
  const redeemedCbIds = new Set();
  const totalWeeks = data.weeks.length;
  
  for (let w = 0; w < totalWeeks; w++) {
    const startIdx = w * 7;
    const weekDays = data.days.slice(startIdx, startIdx + 7);
    
    let perseveranceMetDaysCount = 0;
    let commitmentMetDaysCount = 0;
    let prayerfulnessMetDaysCount = 0;
    let scriptureMemoryMetDaysCount = 0;
    let meditationFidMetDaysCount = 0;
    
    weekDays.forEach(day => {
      const dailyChapters = day.morningChapters + day.laterChapters;
      const dailyERT = timeStringToDecimal(day.wakingTime);
      
      // Chapters criteria (Or redeemed by CB)
      let chapterTargetMet = (dailyChapters >= targetChapters);
      
      if (!chapterTargetMet && day.cbId && day.cbResolved) {
        if (!redeemedCbIds.has(day.cbId)) {
          chapterTargetMet = true; // REDEEMED
          redeemedCbIds.add(day.cbId);
        }
      }
      
      if (chapterTargetMet) perseveranceMetDaysCount++;
      if (dailyERT !== null && dailyERT <= targetERT) commitmentMetDaysCount++;
      if (day.prayer10mins) prayerfulnessMetDaysCount++;
      if (day.recitedMemory) scriptureMemoryMetDaysCount++;
      if (day.fidJournaling) meditationFidMetDaysCount++;
    });
    
    const perseverancePoints = (perseveranceMetDaysCount === 7) ? 3 : 0;
    const commitmentPoints = (commitmentMetDaysCount === 7) ? 2 : 0;
    const prayerfulnessPoints = (prayerfulnessMetDaysCount === 7) ? 2 : 0;
    const scriptureMemoryPoints = (scriptureMemoryMetDaysCount === 7) ? 1 : 0;
    const meditationFidPoints = (meditationFidMetDaysCount === 7) ? 1 : 0;
    
    const accountabilityPoints = data.weeks[w].sharedFid ? 1 : 0;
    
    const weekScore = perseverancePoints + commitmentPoints + prayerfulnessPoints + scriptureMemoryPoints + meditationFidPoints + accountabilityPoints;
    const weekLaxity = 10 - weekScore;
    
    weeklyStats.push({
      weekNumber: w + 1,
      perseverance: { score: perseverancePoints, met: perseveranceMetDaysCount },
      commitment: { score: commitmentPoints, met: commitmentMetDaysCount },
      prayer: { score: prayerfulnessPoints, met: prayerfulnessMetDaysCount },
      memory: { score: scriptureMemoryPoints, met: scriptureMemoryMetDaysCount },
      meditation: { score: meditationFidPoints, met: meditationFidMetDaysCount },
      accountability: { score: accountabilityPoints },
      totalScore: weekScore,
      laxity: weekLaxity
    });
    
    totalScore += weekScore;
    totalLaxity += weekLaxity;
  }
  
  return {
    weeks: weeklyStats,
    totalScore: totalScore,
    totalLaxity: totalLaxity
  };
}

// Render the Weekly Growth Point Analysis Table
function renderScoringTable() {
  const stats = calculateScores();
  elements.scoringTableBody.innerHTML = '';
  
  const headerRow = document.getElementById('score-table-header-row');
  if (headerRow) {
    headerRow.innerHTML = '<th>CBRSM Discipline Description</th>';
    for (let w = 1; w <= stats.weeks.length; w++) {
      headerRow.innerHTML += `<th class="text-center" style="width: 12%;">Week ${w}</th>`;
    }
    headerRow.innerHTML += '<th class="text-right" style="width: 15%;">Total Score</th>';
  }
  
  const disciplines = [
    { name: 'Perseverance (Chapters Read)', key: 'perseverance', max: 3, desc: 'Read ALL set chapters each day' },
    { name: 'Commitment (Early Rising)', key: 'commitment', max: 2, desc: 'Woke up at set ERT each day' },
    { name: 'Prayerfulness (CBRSM Prayer)', key: 'prayer', max: 2, desc: 'Prayed 10 mins after CBRSM each day' },
    { name: 'Scripture Memory (Recitations)', key: 'memory', max: 1, desc: 'Recited the memory scripture each day' },
    { name: 'Meditation (Journal Notes)', key: 'meditation', max: 1, desc: 'Wrote method journal notes each day' },
    { name: 'Accountability (Sharing / PE Meeting)', key: 'accountability', max: 1, desc: 'Sharing & PE meeting once a week' }
  ];
  
  disciplines.forEach(disc => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.innerHTML = `<strong>${disc.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${disc.desc}</span>`;
    tr.appendChild(tdName);
    
    for (let w = 0; w < stats.weeks.length; w++) {
      const tdScore = document.createElement('td');
      tdScore.className = 'text-center';
      const wStat = stats.weeks[w][disc.key];
      
      if (disc.key === 'accountability') {
        tdScore.innerText = wStat.score;
        tdScore.style.color = wStat.score === disc.max ? 'var(--success)' : 'inherit';
      } else {
        tdScore.innerHTML = `${wStat.score} <span style="font-size:0.7rem; color:var(--text-muted);">(${wStat.met}/7d)</span>`;
        if (wStat.score === disc.max) {
          tdScore.style.color = 'var(--success)';
          tdScore.style.fontWeight = 'bold';
        }
      }
      tr.appendChild(tdScore);
    }
    
    const tdTot = document.createElement('td');
    tdTot.className = 'text-right';
    const totalDiscScore = stats.weeks.reduce((acc, curr) => acc + curr[disc.key].score, 0);
    tdTot.innerHTML = `<strong>${totalDiscScore}</strong> / ${disc.max * stats.weeks.length}`;
    tr.appendChild(tdTot);
    elements.scoringTableBody.appendChild(tr);
  });
  
  // Total Growth points
  const trTotal = document.createElement('tr');
  trTotal.className = 'total-row';
  const tdTotalLabel = document.createElement('td');
  tdTotalLabel.innerText = 'CBRSM GROWTH POINTS (Total Weekly Score)';
  trTotal.appendChild(tdTotalLabel);
  
  for (let w = 0; w < stats.weeks.length; w++) {
    const tdWScore = document.createElement('td');
    tdWScore.className = 'text-center';
    tdWScore.innerHTML = `<strong>${stats.weeks[w].totalScore}</strong> / 10`;
    trTotal.appendChild(tdWScore);
  }
  
  const tdTotVal = document.createElement('td');
  tdTotVal.className = 'text-right';
  tdTotVal.innerHTML = `<strong>${stats.totalScore}</strong> / ${stats.weeks.length * 10}`;
  trTotal.appendChild(tdTotVal);
  elements.scoringTableBody.appendChild(trTotal);
  
  // Laxity points
  const trLaxity = document.createElement('tr');
  trLaxity.className = 'laxity-row';
  const tdLaxityLabel = document.createElement('td');
  tdLaxityLabel.innerText = 'Laxity (Deviation) Points Lost';
  trLaxity.appendChild(tdLaxityLabel);
  
  for (let w = 0; w < stats.weeks.length; w++) {
    const tdWLaxity = document.createElement('td');
    tdWLaxity.className = 'text-center';
    tdWLaxity.innerText = stats.weeks[w].laxity;
    trLaxity.appendChild(tdWLaxity);
  }
  
  const tdTotLaxity = document.createElement('td');
  tdTotLaxity.className = 'text-right';
  tdTotLaxity.innerText = stats.totalLaxity;
  trLaxity.appendChild(tdTotLaxity);
  elements.scoringTableBody.appendChild(trLaxity);
}

// Render SVG Early Riser Line Chart
function renderChart() {
  elements.chartContainer.innerHTML = '';
  const data = getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
  const targetERT = timeStringToDecimal(card.ertTarget);
  
  const weekStartIdx = (currentWeekForChart - 1) * 7;
  const weekDays = data.days.slice(weekStartIdx, weekStartIdx + 7);
  
  const width = 600;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 20;
  
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'chart-svg');
  
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'chart-gradient');
  gradient.setAttribute('x1', '0');
  gradient.setAttribute('y1', '0');
  gradient.setAttribute('x2', '0');
  gradient.setAttribute('y2', '1');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', 'var(--primary)');
  stop1.setAttribute('stop-opacity', '0.25');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', 'var(--primary)');
  stop2.setAttribute('stop-opacity', '0');
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);
  
  const minTime = 4.0;
  const maxTime = 7.0;
  
  function getX(index) {
    return paddingLeft + (index / 6) * plotWidth;
  }
  
  function getY(timeDec) {
    if (timeDec === null) return paddingTop + plotHeight;
    const clamped = Math.max(minTime, Math.min(maxTime, timeDec));
    return paddingTop + ((clamped - minTime) / (maxTime - minTime)) * plotHeight;
  }
  
  const ticks = [
    { val: 4.0, label: "4:00 AM" },
    { val: 4.5, label: "4:30 AM" },
    { val: 5.0, label: "5:00 AM" },
    { val: 5.5, label: "5:30 AM" },
    { val: 6.0, label: "6:00 AM" },
    { val: 6.5, label: "6:30 AM" },
    { val: 7.0, label: "6:30+" }
  ];
  
  ticks.forEach(tick => {
    const y = getY(tick.val);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', paddingLeft);
    line.setAttribute('y1', y);
    line.setAttribute('x2', width - paddingRight);
    line.setAttribute('y2', y);
    line.setAttribute('class', 'chart-grid-line');
    svg.appendChild(line);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', paddingLeft - 8);
    text.setAttribute('y', y + 3);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('class', 'chart-axis-text');
    text.textContent = tick.label;
    svg.appendChild(text);
  });
  
  const targetY = getY(targetERT);
  const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  targetLine.setAttribute('x1', paddingLeft);
  targetLine.setAttribute('y1', targetY);
  targetLine.setAttribute('x2', width - paddingRight);
  targetLine.setAttribute('y2', targetY);
  targetLine.setAttribute('class', 'chart-target-line');
  svg.appendChild(targetLine);
  
  const validPoints = [];
  const points = [];
  
  weekDays.forEach((day, index) => {
    const timeDec = timeStringToDecimal(day.wakingTime);
    const x = getX(index);
    
    if (timeDec !== null) {
      const y = getY(timeDec);
      validPoints.push({ x, y, val: day.wakingTime, index, dec: timeDec });
      points.push({ x, y, val: day.wakingTime, index, dec: timeDec });
    } else {
      points.push({ x, y: null, val: null, index, dec: null });
    }
  });
  
  if (validPoints.length > 0) {
    let pathD = '';
    let areaD = `M ${validPoints[0].x} ${paddingTop + plotHeight} `;
    
    validPoints.forEach((pt, i) => {
      if (i === 0) {
        pathD += `M ${pt.x} ${pt.y} `;
      } else {
        pathD += `L ${pt.x} ${pt.y} `;
      }
      areaD += `L ${pt.x} ${pt.y} `;
    });
    
    areaD += `L ${validPoints[validPoints.length - 1].x} ${paddingTop + plotHeight} Z`;
    
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('class', 'chart-area');
    svg.appendChild(areaPath);
    
    const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    strokePath.setAttribute('d', pathD);
    strokePath.setAttribute('class', 'chart-line');
    svg.appendChild(strokePath);
  }
  
  points.forEach(pt => {
    // X-axis day text (always draw)
    const dayText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dayText.setAttribute('x', pt.x);
    dayText.setAttribute('y', height - 5);
    dayText.setAttribute('text-anchor', 'middle');
    dayText.setAttribute('class', 'chart-axis-text');
    dayText.textContent = `D${weekStartIdx + pt.index + 1}`;
    svg.appendChild(dayText);

    // Point and Tooltip (only if filled)
    if (pt.dec !== null) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', '5');
      circle.setAttribute('class', 'chart-dot');
      
      let isOffTarget = pt.dec > targetERT;
      if (isOffTarget) {
        circle.classList.add('off-target');
      }
      
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      const dayLabel = weekStartIdx + pt.index + 1;
      tooltip.textContent = `Day ${dayLabel}: Woke up at ${pt.val} (Target: ${card.ertTarget})`;
      circle.appendChild(tooltip);
      circle.addEventListener('click', () => openDayModal(weekStartIdx + pt.index + 1));
      svg.appendChild(circle);
    }
  });
  
  elements.chartContainer.appendChild(svg);
}

// ======================================================================
// HELPER: Generate Activity Colors based on Score
// ======================================================================
function getActivityColor(score) {
  if (score === 0) return '#e2e8f0'; // empty
  if (score < 5) return '#d1fae5';   // light green
  if (score < 8) return '#34d399';   // med green
  return '#059669';                  // dark green
}

function getScoreForDay(dayIndex) {
  const data = window.getActiveData ? window.getActiveData() : null;
  if (!data) return 0;
  const day = data.days.find(d => d.dayNumber === dayIndex);
  if (!day) return 0;
  
  let score = 0;
  const cardId = data.currentCardId || 1;
  const card = (window.CBR_DATA && CBR_DATA.cards) 
               ? CBR_DATA.cards.find(c => c.cardId === cardId) : null;
  if (!card) return 0;
  
  const chCount = (day.morningChapters || 0) + (day.laterChapters || 0);
  if (chCount >= card.chaptersTarget) score += 4;
  else if (chCount > 0) score += 2;
  
  if (day.ertTime && day.ertTime <= card.ertTarget) score += 2;
  
  const hasJournal = day.fidFocus || day.fidInsight || day.fidDoing || day.journalNotes;
  if (hasJournal) score += 2;
  
  if (day.barriersCleared) score += 1;
  return score;
}
