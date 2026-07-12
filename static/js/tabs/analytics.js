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
