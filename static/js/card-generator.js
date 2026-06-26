const LOGO_BASE64 = "data:image/png;base64,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";

/**
 * CBR Challenger Card Generator
 * Builds a faithful HTML replica of the physical Challenger Card (Version 19)
 * matching the exact layout: Speed Grid, ERT Grid, Calendar Checklist,
 * Growth Points Table, and Instructions.
 */

// Day columns per week: 1-7 for each of 4 weeks = 28 total
// Week separator on day 7 of each week

function buildChallengerCardHTML(data) {
  if (data && !data.currentCardId) data.currentCardId = data.cardId || 1;
  const cardConfig = CBR_DATA.cards.find(c => c.cardId === data.currentCardId) || CBR_DATA.cards[0];
  const stats = calculateScoresForData(data);

  // Get calendar dates for the 28 days
  function dayDate(dayIdx) {
    const d = new Date(data.commencingDate);
    d.setDate(d.getDate() + dayIdx);
    return d;
  }

  // Build the 28-column header cells (day numbers 1-7 per week, bolded 7)
  function buildDayHeaderCells(tableClass) {
    let cells = '';
    for (let w = 0; w < 4; w++) {
      for (let d = 1; d <= 7; d++) {
        const isLast = (d === 7);
        const isSep = (d === 1 && w > 0);
        const cls = isSep ? ' class="week-sep"' : '';
        cells += `<th${cls}>${isLast ? `<b>${d}</b>` : d}</th>`;
      }
    }
    return cells;
  }

  // Build week label row for the speed/ERT grid
  function buildWeekLabelRow(startWeek) {
    let cells = '<td></td>'; // row-header placeholder
    for (let w = 0; w < 4; w++) {
      const weekNum = startWeek + w;
      // First 6 days: empty, day 7 cell: week label spanning inside
      for (let d = 1; d <= 6; d++) {
        cells += '<td></td>';
      }
      cells += `<td class="wk-num-cell">WEEK <span class="week-circle">${weekNum}</span></td>`;
    }
    return `<tr class="week-label-row">${cells}</tr>`;
  }

  // ─────────────────────────────────────────────
  // SECTION 1: BIBLE-READING SPEEDS GRID
  // ─────────────────────────────────────────────
  function buildSpeedGrid() {
    // Rows: 8 down to 0
    let rows = '';

    // Header row
    rows += `<tr><th class="row-header">Chs</th>`;
    rows += buildDayHeaderCells();
    rows += `<th style="border:none; background:transparent; font-size:4.5pt; text-align:left; padding-left:6px; line-height:1.1; vertical-align:bottom;">CBR VISION<br>IN 30 YEARS</th>`;
    rows += `</tr>`;

    for (let speed = 8; speed >= 1; speed--) {
      rows += `<tr>`;
      rows += `<td class="row-header">${speed}</td>`;
      for (let w = 0; w < 4; w++) {
        for (let d = 0; d < 7; d++) {
          const dayIdx = w * 7 + d;
          const day = data.days[dayIdx];
          const total = (day.morningChapters || 0) + (day.laterChapters || 0);
          const isSep = (d === 0 && w > 0);
          let cls = isSep ? 'week-sep' : '';
          let content = '';

          if (speed <= total) {
            const morningCount = day.morningChapters || 0;
            if (speed <= morningCount) {
              cls += ' shaded-morning';
            } else {
              cls += ' shaded-dark';
            }
          }

          rows += `<td class="${cls.trim()}">${content}</td>`;
        }
      }
      
      let visionLabel = '';
      if (speed === 7) visionLabel = '60 TIMES';
      if (speed === 5) visionLabel = '45 TIMES';
      if (speed === 3) visionLabel = '30 TIMES';
      if (speed === 1) visionLabel = '10 TIMES';
      
      rows += `<td style="border:none; background:transparent; font-size:5.5pt; font-weight:900; padding-left:6px; white-space:nowrap; text-align:left; vertical-align:middle;">${visionLabel}</td>`;
      
      rows += `</tr>`;
    }

    // Week label row — determine which weeks based on card
    const startWeek = (data.currentCardId - 1) * 4 + 1;
    let weekRow = buildWeekLabelRow(startWeek);
    weekRow = weekRow.replace('</tr>', '<td style="border:none; background:transparent;"></td></tr>');
    rows += weekRow;

    return `
      <div class="cc-speed-section">
        <div class="cc-speed-wrap">
          <div class="cc-speed-label-vert">BIBLE-READING SPEEDS</div>
          <div>
            <div style="text-align:center; font-size:7pt; font-weight:900; letter-spacing:1px; padding:2px 0; border-bottom:1px solid #aaa;">
              CONSISTENT BIBLE READING (CBR)
            </div>
            <table class="cc-grid-table">${rows}</table>
          </div>
        </div>
      </div>`;
  }

  // ─────────────────────────────────────────────
  // SECTION 2: EARLY-RISER TIME GRID
  // ─────────────────────────────────────────────
  function buildERTGrid() {
    const timeSlots = [
      { label: '4:00', dec: 4.0, level: 'PERFECT', rowspan: 4 },
      { label: '', dec: 4.25 },
      { label: '4:30', dec: 4.5 },
      { label: '', dec: 4.75 },
      { label: '5:00', dec: 5.0, level: 'EXCELLENT', rowspan: 2 },
      { label: '', dec: 5.25 },
      { label: '5:30', dec: 5.5, level: 'GOOD', rowspan: 2 },
      { label: '', dec: 5.75 },
      { label: '6:00', dec: 6.0, level: 'FAIR', rowspan: 2 },
      { label: '', dec: 6.25 },
      { label: '6:30', dec: 6.5, level: 'O.O.O.', rowspan: 1 }
    ];
    const targetDec = timeStringToDecimal(cardConfig.ertTarget);

    function timeToSlotIndex(timeStr) {
      const dec = timeStringToDecimal(timeStr);
      if (dec === null) return -1;
      if (dec <= 4.0) return 0;
      if (dec <= 4.25) return 1;
      if (dec <= 4.5) return 2;
      if (dec <= 4.75) return 3;
      if (dec <= 5.0) return 4;
      if (dec <= 5.25) return 5;
      if (dec <= 5.5) return 6;
      if (dec <= 5.75) return 7;
      if (dec <= 6.0) return 8;
      if (dec <= 6.25) return 9;
      return 10; // 6:30+
    }

    let rows = '';

    // Top title row for the levels (without drawing boxes for the grid)
    rows += `<tr><th style="border:none; background:transparent;"></th><th colspan="28" style="border:none; background:transparent;"></th><th style="border:none; background:transparent; font-size:4.5pt; text-align:left; padding-left:6px; line-height:1.1; vertical-align:bottom;">LEVELS OF SACRIFICE<br>IN EARLY RISING</th></tr>`;

    timeSlots.forEach((slot, slotIdx) => {
      rows += `<tr style="height:12px;">`; // ensure enough height for blank rows
      rows += `<td class="row-header">${slot.label}</td>`;
      for (let w = 0; w < 4; w++) {
        for (let d = 0; d < 7; d++) {
          const dayIdx = w * 7 + d;
          const day = data.days[dayIdx];
          const isSep = (d === 0 && w > 0);
          const daySlotIdx = timeToSlotIndex(day.wakingTime);
          const hasX = (daySlotIdx === slotIdx);
          let cls = isSep ? 'week-sep' : '';
          if (hasX) cls += (daySlotIdx <= timeToSlotIndex(cardConfig.ertTarget) ? ' has-x on-target' : ' has-x off-target');
          rows += `<td class="${cls.trim()}" data-day="${dayIdx}">${hasX ? '<span class="x-mark">X</span>' : ''}</td>`;
        }
      }
      
      if (slot.level) {
        rows += `<td rowspan="${slot.rowspan}" style="border:none; background:transparent; font-size:5.5pt; font-weight:900; padding-left:6px; white-space:nowrap; text-align:left; vertical-align:middle;">${slot.level}</td>`;
      }
      
      rows += `</tr>`;
    });

    // Day numbers at the bottom
    rows += `<tr><th class="row-header" style="font-size:6pt;">Days</th>`;
    rows += buildDayHeaderCells();
    rows += `<th style="border:none; background:transparent;"></th></tr>`;

    const startWeek = (data.currentCardId - 1) * 4 + 1;
    let weekRow = buildWeekLabelRow(startWeek);
    weekRow = weekRow.replace('</tr>', '<td style="border:none; background:transparent;"></td></tr>');
    rows += weekRow;

    return `
      <div class="cc-ert-section">
        <div class="cc-ert-wrap">
          <div class="cc-ert-label-vert">EARLY-RISER TIMES</div>
          <div>
            <div style="text-align:center; font-size:7pt; font-weight:900; letter-spacing:1px; padding:2px 0; border-bottom:1px solid #aaa;">
              EARLY RISER TIME (ERT)
            </div>
            <table class="cc-ert-table">${rows}</table>
          </div>
        </div>
      </div>`;
  }

  // ─────────────────────────────────────────────
  // SECTION 3: CALENDAR CHECKLIST
  // ─────────────────────────────────────────────
  function buildCalendarGrid() {
    const disciplines = [
      { label: 'Scripture Recitation', key: 'recitedMemory' },
      { label: 'FID Journaling', key: 'fidJournaling' },
      { label: '10 Minutes Prayer', key: 'prayer10mins' },
      { label: 'Data Validity', key: 'dataValidity' },
    ];

    let rows = '';

    // Calendar dates row
    rows += `<tr><td class="row-label">Calendar</td>`;
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 7; d++) {
        const dayIdx = w * 7 + d;
        const isSep = (d === 0 && w > 0);
        const date = dayDate(dayIdx);
        const dayOfMonth = date.getDate();
        rows += `<td class="${isSep ? 'week-sep' : ''}" style="font-size:5pt; font-weight:${d===6?'700':'400'};">${dayOfMonth}</td>`;
      }
    }
    // Add right-side text immediately to the right of the table rows
    rows += `<td rowspan="6" style="border:none; background:transparent; font-size:4.5pt; font-weight:900; text-align:center; vertical-align:middle; line-height:1.4; padding-left:12px;">PRACTISE<br>THESE<br>IMPORTANT<br>CBR<br>SUPPORTING<br>DISCIPLINES<br>VERY<br>DILIGENTLY</td>`;
    rows += `</tr>`;

    const todayStr = new Date().toISOString().split('T')[0];
    function isPastOrCurrent(dayIdx) {
      const d = dayDate(dayIdx);
      const dStr = d.toISOString().split('T')[0];
      return dStr <= todayStr;
    }

    // Discipline rows
    disciplines.forEach(disc => {
      rows += `<tr><td class="row-label">${disc.label}</td>`;
      for (let w = 0; w < 4; w++) {
        for (let d = 0; d < 7; d++) {
          const dayIdx = w * 7 + d;
          const day = data.days[dayIdx] || {};
          const isSep = (d === 0 && w > 0);
          const done = day[disc.key];
          const past = isPastOrCurrent(dayIdx);
          const cellClass = `${isSep ? 'week-sep ' : ''}${done ? 'ticked' : (past ? 'unticked' : '')}`;
          const cellContent = done ? '✓' : (past ? '✕' : '');
          rows += `<td class="${cellClass}">${cellContent}</td>`;
        }
      }
      rows += `</tr>`;
    });

    // FID Sharing / PE Meeting row — weekly
    rows += `<tr><td class="row-label">F.I.D Sharing / PE Meeting</td>`;
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 7; d++) {
        const dayIdx = w * 7 + d;
        const isSep = (d === 0 && w > 0);
        const isLastDay = (d === 6);
        const done = isLastDay && data.weeks[w] && data.weeks[w].sharedFid;
        const past = isPastOrCurrent(dayIdx);
        const cellClass = `${isSep ? 'week-sep ' : ''}${isLastDay ? (done ? 'ticked' : (past ? 'unticked' : '')) : ''}`;
        const cellContent = isLastDay ? (done ? '✓' : (past ? '✕' : '')) : '';
        rows += `<td class="${cellClass}">${cellContent}</td>`;
      }
    }
    rows += `</tr>`;

    return `
      <div class="cc-calendar-section">
        <div class="cc-calendar-wrap">
          <div class="cc-cal-label-vert">③</div>
          <table class="cc-cal-table">
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ─────────────────────────────────────────────
  // SECTION 4: WEEKLY GROWTH POINTS TABLE
  // ─────────────────────────────────────────────
  function buildGrowthTable() {
    const startWeek = (data.currentCardId - 1) * 4 + 1;

    const rows = [
      { disc: 'PERSEVERANCE', desc: 'I Read ALL My Set Chapters Each Day', key: 'perseverance', max: 3 },
      { disc: 'COMMITMENT', desc: 'I Woke Up at My Set ER-Time Each Day', key: 'commitment', max: 2 },
      { disc: 'PRAYERFULNESS', desc: 'I Prayed 10min after CBR Each Day', key: 'prayer', max: 1 },
      { disc: 'SCRIPTURE MEMORY', desc: 'I Recited the Memory Scripture Each Day', key: 'memory', max: 1 },
      { disc: 'MEDITATION', desc: 'I Wrote FID Journal Notes Each Day', key: 'meditation', max: 1 },
      { disc: 'ACCOUNTABILITY', desc: 'I shared FID and Commented Each Week', key: 'accountability', max: 1 },
      { disc: 'CBR GROWTH POINTS', desc: 'My Total Growth Points', key: 'total', max: 10, isTotalRow: true },
      { disc: 'LAXITY (Deviation)', desc: 'Points I have Lost', key: 'laxity', max: 0, isLaxityRow: true },
    ];

    let tableRows = '';
    rows.forEach(row => {
      const rowClass = row.isTotalRow ? ' class="total-pts-row"' : row.isLaxityRow ? ' class="laxity-row"' : '';
      tableRows += `<tr${rowClass}>
        <td class="disc-name">${row.disc}</td>
        <td class="disc-desc">${row.desc}</td>
        <td class="max-pts">${row.isTotalRow ? '10' : row.isLaxityRow ? '0' : row.max}</td>`;

      for (let w = 0; w < 4; w++) {
        let val = '';
        if (row.isTotalRow) val = stats.weeks[w].totalScore || '';
        else if (row.isLaxityRow) val = stats.weeks[w].laxity !== undefined ? stats.weeks[w].laxity : '';
        else val = stats.weeks[w][row.key]?.score !== undefined ? (stats.weeks[w][row.key].score || '') : '';

        tableRows += `<td class="week-score">${val}</td>`;
      }

      // Total column
      let total = '';
      if (row.isTotalRow) total = stats.totalScore;
      else if (row.isLaxityRow) total = stats.totalLaxity;
      else total = stats.weeks.reduce((a, c) => a + (c[row.key]?.score || 0), 0) || '';

      tableRows += `<td class="week-score" style="background:#f5f5f5; font-weight:900;">${total}</td>
      </tr>`;
    });

    return `
      <div class="cc-growth-section">
        <div class="cc-growth-title">WEEKLY CBR GROWTH POINTS ANALYSIS</div>
        <table class="cc-growth-table">
          <thead>
            <tr class="header-row">
              <th class="disc-name">DISCIPLINES</th>
              <th class="disc-desc">WEEKLY PRACTISE SCORES</th>
              <th class="max-pts" style="font-size:5pt;">MAX</th>
              ${[0,1,2,3].map(w => `<th class="week-score">WEEK <span class="week-circle">${startWeek+w}</span></th>`).join('')}
              <th class="week-score" style="background:#f5f5f5;">TOTAL<br>POINTS</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`;
  }

  // ─────────────────────────────────────────────
  // SECTION 5: INSTRUCTIONS (matching the physical card)
  // ─────────────────────────────────────────────
  function buildInstructions() {
    const col1 = [
      { n: '', t: '<b>Follow these INSTRUCTIONS in Filling your CBR, ERT and other pieces of information in this CARD to be able to Analyze your Weekly CBR GROWTH POINTS.</b>' }
    ];
    const col2 = [
      { n: '1.', t: 'Circle the CARD number and write your <i>Name</i>, <i>Phone</i> number and the commencing <i>Date</i>.' },
      { n: '2.', t: 'Shade with strokes the chapters you read in the morning and dark those read later.' },
      { n: '3.', t: 'Put X where your Early-Riser Time (ERT) line meets the day\'s line then join these points with short lines.' },
      { n: '4.', t: 'Make a <b>28-day Calendar</b> and enter the practise weeks cumulatively in CARDs.' },
      { n: '5.', t: 'Put X or a tick in box when you: <b>Recite Scripture</b>, write <b>FID Journal</b>, pray at least <b>10 minutes</b>, share a FID and Comment on a FID and then <b>Validate</b> the day\'s data.' },
    ];
    const col3 = [
      { n: '6.', t: 'Use a <b>pencil</b> to record and analyze data on this CARD with absolute HONESTY.' },
      { n: '7.', t: 'Show your <b>Consistency Barriers</b> on the CARD.' },
      { n: '8.', t: 'Calculate your <b>Weekly CBR Growth Points</b> and add them up to get total for the 4 weeks.' },
      { n: '9.', t: '<b>Laxity:</b> Aim to keep your laxity at zero every week in order to improve your class ranking.' },
      { n: '', t: '<hr/><b>DEVELOPING CBR SUCCESSFULLY</b><br>1. Sleep early to rise on time for CBR.<br>2. Do CBR and pray daily even during exams.<br>3. Model true christianity to all your friends by early-rising faithfully for CBR even on holidays.<br>4. Resolve <b>Consistency Barriers or CBs</b> with practical and biblical solutions to guarantee your continuity in CBR years later.<br>5. You are required to share <b>1 FID Every Week</b>.<br>6. Read and comment on at least one FID from your classmates to score <b>ACCOUNTABILITY</b> point.' },
    ];

    const renderCol = (items) => items.map(i => `<div class="inst-item"><span class="inst-num">${i.n}</span><span>${i.t}</span></div>`).join('');

    return `
      <div class="cc-instructions">
        <div class="cc-instructions-num"><span class="circle-num">5</span></div>
        <div class="cc-instructions-col">${renderCol(col1)}</div>
        <div class="cc-instructions-col">${renderCol(col2)}</div>
        <div class="cc-instructions-col">${renderCol(col3)}</div>
      </div>`;
  }

  // ─────────────────────────────────────────────
  // ASSEMBLE FULL CARD
  // ─────────────────────────────────────────────
  const startWeek = (data.currentCardId - 1) * 4 + 1;

  return `
<div class="cc-root">

  <!-- HEADER -->
  <div class="cc-header">
    <div class="cc-header-left">
      <div class="cc-title">THE CHALLENGER CARD <span style="font-size:13pt; font-weight:900; background:#000; color:#fff; padding:2px 8px; border-radius:4px; vertical-align:middle; display:inline-block; -webkit-print-color-adjust:exact; print-color-adjust:exact;">#${data.currentCardId}</span></div>
      <div class="cc-subtitle">CONSISTENCY ANALYZER &amp; RESOLVE DISPLAYER</div>
      <div class="cc-tagline">By Daily Wordfeast Foundation — P.O. Box 2131, Nyeri, KENYA</div>
    </div>
    <div class="cc-header-right">
      <img src="${LOGO_BASE64}" style="width: 46px; height: 46px; margin: 0 auto 3px auto; display: block; object-fit: contain; border-radius: 8px;">
      <div class="cbr-disciplin">D I S C I P L I N</div>
      <div style="font-size:4.5pt; line-height:1.3;">By Daily Wordfeast Foundation<br>P.O. Box 2131 - 010100 Nyeri, KENYA<br>Tel: +254720777789; +254721741471<br>E-mail: feastword@gmail.com</div>
    </div>
  </div>

  <!-- CARD ROUND NUMBERS -->
  <div class="cc-round-row">
    <span class="rr-label">CARD ROUND NUMBER</span>
    ${[0,1,2,3,4,5,6,7,8].map(n => `<span class="cc-round-num${n===data.currentCardId?' selected':''}">${n}</span>`).join('')}
    <span style="flex:1;"></span>
    <span style="font-weight:700; font-size:6.5pt;">DATE: <span style="font-style:italic;">${data.commencingDate || '____________'}</span></span>
  </div>

  <!-- NAME / TELEPHONE / CHURCH -->
  <div class="cc-date-row">
    <div class="field-group" style="flex:2;">
      <span class="field-label">NAME:</span>
      <span class="field-val">${data.username || ''}</span>
    </div>
    <div class="field-group" style="flex:1.5;">
      <span class="field-label">TELEPHONE:</span>
      <span class="field-val">${data.contact || ''}</span>
    </div>
    <div class="field-group" style="flex:1.5;">
      <span class="field-label">CHURCH:</span>
      <span class="field-val">${data.church || ''}</span>
    </div>
  </div>

  <!-- BODY: Speed, ERT, Calendar — all share section-num layout -->
  <div style="display:block; border-bottom:1.5px solid #000;">
    <!-- Section 1: Speed Grid -->
    <div style="display:grid; grid-template-columns:22px 1fr; border-bottom:1.5px solid #000;">
      <div style="border-right:1.5px solid #000; display:flex; align-items:center; justify-content:center;">
        <span class="circle-num">①</span>
      </div>
      <div>${buildSpeedGrid()}</div>
    </div>

    <!-- Section 2: ERT Grid -->
    <div style="display:grid; grid-template-columns:22px 1fr; border-bottom:1.5px solid #000;">
      <div style="border-right:1.5px solid #000; display:flex; align-items:center; justify-content:center;">
        <span class="circle-num">②</span>
      </div>
      <div>${buildERTGrid()}</div>
    </div>

    <!-- Section 3: Calendar Checklist -->
    <div style="display:grid; grid-template-columns:22px 1fr;">
      <div style="border-right:1.5px solid #000; display:flex; align-items:center; justify-content:center;">
        <span class="circle-num">③</span>
      </div>
      <div>${buildCalendarGrid()}</div>
    </div>
  </div>

  <!-- SECTION 4: Growth Points Table -->
  ${buildGrowthTable()}

  <!-- SECTION 5: Instructions -->
  ${buildInstructions()}

  <!-- FOOTER -->
  <div class="cc-footer">© By CBR Discipline Challenger CARD, 19th Edition, January 2021 — Digital Assistant by The Word Feast</div>
</div>`;
}

// Helper: calculate scores using a given data object (handles both active & historical cards)
function calculateScoresForData(data) {
  if (data && !data.currentCardId) data.currentCardId = data.cardId || 1;
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId) || CBR_DATA.cards[0];
  const targetChapters = card.chaptersTarget;
  const targetERT = timeStringToDecimal(card.ertTarget);

  const weeklyStats = [];
  let totalScore = 0;
  let totalLaxity = 0;
  const redeemedCbIds = new Set();

  for (let w = 0; w < 4; w++) {
    const weekDays = data.days.slice(w * 7, w * 7 + 7);

    let p = 0, c = 0, pr = 0, sm = 0, m = 0;
    weekDays.forEach(day => {
      const total = (day.morningChapters || 0) + (day.laterChapters || 0);
      const dec = timeStringToDecimal(day.wakingTime);
      let chapsMet = total >= targetChapters;
      if (!chapsMet && day.cbId && day.cbResolved && !redeemedCbIds.has(day.cbId)) {
        chapsMet = true;
        redeemedCbIds.add(day.cbId);
      }
      if (chapsMet) p++;
      if (dec !== null && dec <= targetERT) c++;
      if (day.prayer10mins) pr++;
      if (day.recitedMemory) sm++;
      if (day.fidJournaling) m++;
    });

    const pPts = p === 7 ? 3 : 0;
    const cPts = c === 7 ? 2 : 0;
    const prPts = pr === 7 ? 1 : 0;
    const smPts = sm === 7 ? 1 : 0;
    const mPts = m === 7 ? 1 : 0;
    const aPts = data.weeks[w].sharedFid ? 1 : 0;
    const weekScore = pPts + cPts + prPts + smPts + mPts + aPts;

    weeklyStats.push({
      weekNumber: w + 1,
      perseverance: { score: pPts, met: p },
      commitment: { score: cPts, met: c },
      prayer: { score: prPts, met: pr },
      memory: { score: smPts, met: sm },
      meditation: { score: mPts, met: m },
      accountability: { score: aPts },
      totalScore: weekScore,
      laxity: 10 - weekScore
    });

    totalScore += weekScore;
    totalLaxity += 10 - weekScore;
  }

  return { weeks: weeklyStats, totalScore, totalLaxity };
}

function drawERTGraph(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const ertTable = container.querySelector('.cc-ert-table');
  if (!ertTable) return;

  const wrapper = ertTable.parentElement;
  if (!wrapper) return;
  
  wrapper.style.position = 'relative';

  const cells = Array.from(ertTable.querySelectorAll('td.has-x'));
  cells.sort((a, b) => parseInt(a.getAttribute('data-day')) - parseInt(b.getAttribute('data-day')));

  if (cells.length < 2) return;

  const oldSvg = wrapper.querySelector('svg.ert-graph');
  if (oldSvg) oldSvg.remove();

  const wrapRect = wrapper.getBoundingClientRect();

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add('ert-graph');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  let points = '';
  cells.forEach(cell => {
    const xMark = cell.querySelector('.x-mark');
    const targetRect = xMark ? xMark.getBoundingClientRect() : cell.getBoundingClientRect();
    
    const cx = targetRect.left - wrapRect.left + targetRect.width / 2;
    const cy = targetRect.top - wrapRect.top + targetRect.height / 2;
    
    const px = (cx / wrapRect.width) * 100;
    const py = (cy / wrapRect.height) * 100;
    
    points += `${px},${py} `;
  });

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", points.trim());
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "red");
  polyline.setAttribute("stroke-width", "1.5");
  polyline.setAttribute("vector-effect", "non-scaling-stroke");

  svg.appendChild(polyline);
  wrapper.appendChild(svg);
}

// Mount the card into a DOM container
function renderChallengerCardInto(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = buildChallengerCardHTML(data);
  setTimeout(() => drawERTGraph(containerId), 50);
}

// Main print trigger: generate card then call window.print()
function printChallengerCard(data) {
  const wrapper = document.getElementById('card-print-wrapper');
  wrapper.innerHTML = buildChallengerCardHTML(data);
  const origTitle = document.title;
  document.title = `CBR_Challenger_Card_${data.currentCardId || 1}`;
  
  // Temporarily show to calculate SVG coordinates correctly
  const originalDisplay = wrapper.style.display;
  wrapper.style.display = 'block';
  wrapper.style.visibility = 'hidden'; // Avoid flicker if possible

  setTimeout(() => {
    drawERTGraph('card-print-wrapper');
    wrapper.style.display = originalDisplay;
    wrapper.style.visibility = '';
    window.print();
    setTimeout(() => { document.title = origTitle; }, 1000);
  }, 50);
}
