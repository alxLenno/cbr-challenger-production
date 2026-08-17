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
      { disc: 'PRAYERFULNESS', desc: 'I Prayed 10min after CBR Each Day', key: 'prayer', max: 2 },
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
      { n: '', t: '<b>Follow these INSTRUCTIONS in filling your CBR, ERT and other pieces of information in this CARD to be able to analyze your Weekly CBR GROWTH POINTS.</b>' }
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
      { n: '', t: '<hr/><b>DEVELOPING CBR SUCCESSFULLY</b><br>1. Sleep early to rise on time for CBR.<br>2. Do CBR and pray daily even during exams.<br>3. Model true Christianity to all your friends by early-rising faithfully for CBR even on holidays.<br>4. Resolve <b>Consistency Barriers or CBs</b> with practical and biblical solutions to guarantee your continuity in CBR years later.<br>5. You are required to share <b>1 FID Every Week</b>.<br>6. Read and comment on at least one FID from your classmates to score <b>ACCOUNTABILITY</b> point.' },
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
      <div class="cc-title">THE CHALLENGER<sup style="font-size:7pt;">${data.currentCardId}</sup> CARD</div>
      <div class="cc-subtitle">CONSISTENCY ANALYZER &amp; RESOLVE DISPLAYER</div>
      <div class="cc-tagline">By Daily Wordfeast Foundation — P.O. Box 2131, Nyeri, KENYA</div>
    </div>
    <div class="cc-header-right">
      <div class="cbr-logo-box">C B R</div>
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

function buildSessionEvaluationPrintHTML(evaluationData = {}, cardData = {}) {
  const sessions = [];
  const currentCardId = Number(cardData.currentCardId || cardData.cardId || 1);
  const currentGrowth = cardData.days && cardData.weeks
    ? calculateScoresForData(cardData).totalScore
    : 0;

  for (let sessionNumber = 1; sessionNumber <= 7; sessionNumber++) {
    const stored = evaluationData[String(sessionNumber)] || evaluationData[sessionNumber] || {};
    sessions.push({
      sessionNumber,
      diligence: stored.diligence || {},
      bonus: stored.bonus || {},
      growthPoints: sessionNumber === currentCardId
        ? currentGrowth
        : Number(stored.growthPoints || 0),
    });
  }

  const diligenceCriteria = [
    'I arrived for the Training Session on TIME',
    'I completed ALL the listed session activities',
    'I had at least THREE review meetings with my PEs',
    'My faithfulness in Scripture Memory & Data Validity is at least 25 days each',
    'I am ORDERLY (Mobile off & Verses written on cards or sticky notes)',
    'I promoted CBR (I spoke to 3 people about CBR or loaned out a book)',
  ];
  const bonusCriteria = [
    'I have listed over 10 people and shall bring at least 5 to the next class',
    'I have practised CBR beyond 5 am and 5 chapters',
    'I also prayed back the entire Psalm 119 successfully',
    'I have done at least 7 recitation checks on all the course Scriptures',
    'I completed writing principles for ALL the listed CBs',
    'I attended ALL the training sessions of the CBR course',
  ];

  const checkMark = checked => `<span class="cc-eval-check${checked ? ' checked' : ''}">${checked ? '✓' : ''}</span>`;
  const diligenceScore = session => diligenceCriteria.reduce((total, _, index) => (
    total + (session.diligence[String(index + 1)] ? 10 : 0)
  ), 0);
  const finalSession = sessions[6];
  const bonusScore = bonusCriteria.reduce((total, _, index) => (
    total + (finalSession.bonus[String(index + 7)] ? 50 : 0)
  ), 0);
  const selectedSession = sessions.find(session => session.sessionNumber === currentCardId) || sessions[0];
  const selectedDiligence = diligenceScore(selectedSession);
  const selectedGrowth = selectedSession.growthPoints;
  const selectedBonus = currentCardId === 7 ? bonusScore : 0;
  // The reference card's "Total Sessions Score" is for the active session:
  // that session's diligence plus that same Challenger Card's four-week growth.
  const selectedSessionScore = selectedDiligence + selectedGrowth;
  const selectedTotalPoints = selectedSessionScore + selectedBonus;

  const diligenceRows = diligenceCriteria.map((criterion, index) => `
    <tr>
      <th class="cc-eval-row-num">${index + 1}.</th>
      <td class="cc-eval-criterion">${criterion}</td>
      ${sessions.map(session => `<td>${checkMark(Boolean(session.diligence[String(index + 1)]))}</td>`).join('')}
      ${index === 0 ? `<td rowspan="${diligenceCriteria.length + 2}" class="cc-eval-course-score"><span>TOTAL SESSIONS SCORE</span><strong>${selectedSessionScore}</strong></td>` : ''}
    </tr>`).join('');

  const bonusRows = bonusCriteria.map((criterion, index) => {
    const number = index + 7;
    return `<tr>
      <th>${number}.</th>
      <td>${criterion}</td>
      <td class="cc-eval-bonus-check">${checkMark(Boolean(finalSession.bonus[String(number)]))}</td>
    </tr>`;
  }).join('');

  return `
  <section class="cc-session-evaluation-page" aria-label="CBR course session evaluation">
    <header class="cc-eval-header">
      <div>
        <div class="cc-eval-kicker">THE CHALLENGER CARD · COURSE RECORD</div>
        <h1>EVALUATION OF DILIGENCE IN CBR COURSE</h1>
        <p>Generated from the editable Session Evaluation in the CBR Challenger app.</p>
      </div>
      <div class="cc-eval-reader-meta">
        <strong>${cardData.username || 'Bible Reader'}</strong>
        <span>Active Card ${currentCardId}</span>
      </div>
    </header>

    <table class="cc-eval-main-table">
      <thead>
        <tr>
          <th colspan="2">DILIGENCE CRITERIA</th>
          ${sessions.map(session => `<th>S${session.sessionNumber}</th>`).join('')}
          <th class="cc-eval-course-heading" aria-label="Total sessions score"></th>
        </tr>
      </thead>
      <tbody>
        ${diligenceRows}
        <tr class="cc-eval-growth-row">
          <th></th>
          <td>My Total Growth Points (4 weeks) in CBR practice this session</td>
          ${sessions.map(session => `<td>${session.growthPoints}</td>`).join('')}
        </tr>
        <tr class="cc-eval-score-row">
          <th></th>
          <td>DILIGENCE POINTS (REFERENCE CARD)</td>
          ${sessions.map(session => `<td>${diligenceScore(session)}</td>`).join('')}
        </tr>
      </tbody>
    </table>

    <div class="cc-eval-lower-grid">
      <section class="cc-eval-panel cc-eval-bonus-panel">
        <h2>BONUS SCORING ASSIGNMENTS AT THE END OF THE COURSE</h2>
        <table><tbody>
          ${bonusRows}
          <tr class="cc-eval-bonus-total-row">
            <th></th>
            <td>TOTAL BONUSES</td>
            <td>${selectedBonus}</td>
          </tr>
        </tbody></table>
      </section>

      <section class="cc-eval-panel">
        <h2>EVALUATION AND SCORING</h2>
        <ol>
          <li>Areas 1 to 6 each score 10 points during the session's DILIGENCE evaluation.</li>
          <li>Areas 7 to 12 each earn 50 bonus points at the end of the course during the final evaluation.</li>
          <li>You must score at least 600 points or meet any other criteria set by the course director to be commissioned as a Consistent Bible Reader.</li>
        </ol>
      </section>

      <section class="cc-eval-panel">
        <h2>PERMITTED LAXITY (DEVIATION) PER SESSION</h2>
        <div class="cc-eval-laxity-grid">
          ${[30, 25, 20, 15, 10, 5, 0].map((value, index) => `<span>Session ${index + 1}</span><strong>${value}</strong>`).join('')}
        </div>
      </section>

      <section class="cc-eval-panel">
        <h2>FOR EMPHASIS BY CBR FACILITATORS</h2>
        <ol>
          <li>Frequency of attending PE meetings <span class="cc-eval-note-box"></span></li>
          <li>How to memorize Scriptures daily, bit by bit <span class="cc-eval-note-box"></span></li>
          <li>System of CBR progression from Card 1 to 7 <span class="cc-eval-note-box"></span></li>
          <li>How to make a Scripture recitation checklist <span class="cc-eval-note-box"></span></li>
          <li>How to change your character through CBR <span class="cc-eval-note-box"></span></li>
          <li>Recruiting and partnering in CBR ministry <span class="cc-eval-note-box"></span></li>
          <li>Redemption of CB penalties allowed only once <span class="cc-eval-note-box"></span></li>
          <li>Best disciple's award recognition <span class="cc-eval-note-box"></span></li>
        </ol>
      </section>
    </div>

    <footer class="cc-eval-totals">
      <div><span>DILIGENCE SCORES</span><strong>${selectedSessionScore}</strong></div>
      <div><span>BONUS SCORES</span><strong>${selectedBonus}</strong></div>
      <div class="grand"><span>TOTAL POINTS</span><strong>${selectedTotalPoints}</strong></div>
    </footer>
  </section>`;
}

async function getSessionEvaluationsForPrint() {
  let sessions = {};
  try {
    const response = await fetch('/api/session_eval');
    if (response.ok) {
      const payload = await response.json();
      sessions = payload.sessions || {};
    }
  } catch (error) {
    console.warn('Could not load saved session evaluations for print.', error);
  }

  // Prefer the in-memory values when the Session Evaluation tab has edits that
  // are still inside its short auto-save window.
  if (typeof seData !== 'undefined' && seData) {
    Object.keys(seData).forEach(key => {
      sessions[key] = seData[key];
    });
  }

  // Each session gets the growth points from its corresponding Challenger
  // Card; Reference Card diligence is added separately in the print table.
  if (typeof seGetSessionGrowthPoints === 'function') {
    for (let sessionNumber = 1; sessionNumber <= 7; sessionNumber++) {
      const key = String(sessionNumber);
      sessions[key] = {
        ...(sessions[key] || {}),
        growthPoints: seGetSessionGrowthPoints(sessionNumber),
      };
    }
  }
  return sessions;
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
    const prPts = pr === 7 ? 2 : 0;
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

// Main print trigger: generate the card and its editable-data evaluation page.
async function printChallengerCard(data) {
  const wrapper = document.getElementById('card-print-wrapper');
  if (!wrapper) return;

  if (typeof showToast === 'function') {
    showToast('Preparing Challenger Card and Session Evaluation…', 'info', 1800);
  }

  const evaluationData = await getSessionEvaluationsForPrint();
  wrapper.innerHTML = buildChallengerCardHTML(data) + buildSessionEvaluationPrintHTML(evaluationData, data);

  // Temporarily show to calculate SVG coordinates correctly
  const originalDisplay = wrapper.style.display;
  wrapper.style.display = 'block';
  wrapper.style.visibility = 'hidden'; // Avoid flicker if possible

  // Browsers suggest document.title as the "Save as PDF" filename, so give it
  // per-card details instead of the static page title — otherwise every card
  // download looks identical regardless of which card or trainee it came from.
  const cardId = data.currentCardId || data.cardId || 1;
  const namePart = (data.username || 'Challenger').trim().replace(/[<>:"/\\|?*\s]+/g, '-');
  const datePart = data.commencingDate || '';
  const originalTitle = document.title;
  document.title = `CBR-Card${cardId}-${namePart}${datePart ? `-${datePart}` : ''}`;

  const restoreTitle = () => {
    document.title = originalTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };
  window.addEventListener('afterprint', restoreTitle);
  setTimeout(restoreTitle, 60000); // fallback if afterprint never fires

  setTimeout(() => {
    drawERTGraph('card-print-wrapper');
    wrapper.style.display = originalDisplay;
    wrapper.style.visibility = '';
    window.print();
  }, 80);
}
