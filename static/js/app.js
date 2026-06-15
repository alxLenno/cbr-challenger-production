// CBR Challenger Card Digital Assistant - Application Script

// Global state variable
let appState = null;
let currentEditingDayNum = null;
let currentWeekForChart = 1;

// Read-only historical viewing mode states
let isViewingHistory = false;
let historicalCardData = null; // Holds copy of archived card when viewing

// Document Elements
const elements = {
  usernameInput: document.getElementById('username'),
  contactInput: document.getElementById('contact'),
  churchInput: document.getElementById('church'),
  cardSelector: document.getElementById('card-selector'),
  commencingDateInput: document.getElementById('commencing-date'),
  
  // Weaknesses Inputs
  weakness1Name: document.getElementById('weakness-1-name'),
  weakness1Action: document.getElementById('weakness-1-action'),
  weakness2Name: document.getElementById('weakness-2-name'),
  weakness2Action: document.getElementById('weakness-2-action'),
  weakness3Name: document.getElementById('weakness-3-name'),
  weakness3Action: document.getElementById('weakness-3-action'),
  
  // KPI Stats
  kpiTotalPoints: document.getElementById('kpi-total-points'),
  kpiLaxityPoints: document.getElementById('kpi-laxity-points'),
  kpiCompletedDays: document.getElementById('kpi-completed-days'),
  kpiTargetChapters: document.getElementById('kpi-target-chapters'),
  
  // Grid and Scoring Table
  weeksGridContainer: document.getElementById('weeks-grid-container'),
  scoringTableBody: document.getElementById('scoring-table-body'),
  
  // Chart Elements
  weekSelectChart: document.getElementById('week-select-chart'),
  chartContainer: document.getElementById('chart-container'),
  
  // Modals & Forms
  dayModal: document.getElementById('day-modal'),
  modalClose: document.getElementById('modal-close'),
  dayModalTitle: document.getElementById('day-modal-title'),
  dayModalSub: document.getElementById('day-modal-sub'),
  dayForm: document.getElementById('day-form'),
  
  // Form Inputs
  inputWakingTime: document.getElementById('waking-time'),
  inputBibleBook: document.getElementById('bible-book'),
  inputStartChapter: document.getElementById('start-chapter'),
  inputEndChapter: document.getElementById('end-chapter'),
  inputMorningChapters: document.getElementById('morning-chapters'),
  inputLaterChapters: document.getElementById('later-chapters'),
  inputRecitedMemory: document.getElementById('recited-memory'),
  inputFidJournaling: document.getElementById('fid-journaling'),
  inputPrayer10mins: document.getElementById('prayer-10mins'),
  inputPeMeeting: document.getElementById('pe-meeting'),
  inputDataValidity: document.getElementById('data-validity'),
  
  // Devotional Inputs
  inputFidFocus: document.getElementById('fid-focus'),
  inputFidInsight: document.getElementById('fid-insight'),
  inputFidDoing: document.getElementById('fid-doing'),
  inputScriptureMemorized: document.getElementById('scripture-memorized'),
  inputPrayerTopic: document.getElementById('prayer-topic'),
  
  // CB Panel in Form
  cbTriggerBox: document.getElementById('cb-trigger-box'),
  inputCbId: document.getElementById('cb-id'),
  inputCbSolution: document.getElementById('cb-solution'),
  inputCbScripture: document.getElementById('cb-scripture'),
  inputCbResolved: document.getElementById('cb-resolved'),
  
  // Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Sidebar Panel lists
  syllabusList: document.getElementById('syllabus-list'),
  barriersList: document.getElementById('barriers-list'),
  questionsList: document.getElementById('questions-list'),
  
  // Library Table
  libraryTableBody: document.getElementById('library-table-body'),
  
  // Banner
  historicalBanner: document.getElementById('historical-banner'),
  btnExitHistory: document.getElementById('btn-exit-history'),
  
  // Print container elements
  printName: document.getElementById('print-name'),
  printContact: document.getElementById('print-contact'),
  printChurch: document.getElementById('print-church'),
  printCardRound: document.getElementById('print-card-round'),
  printCommence: document.getElementById('print-commence'),
  printEvalScore: document.getElementById('print-eval-score'),
  printWeaknessesTbody: document.getElementById('print-weaknesses-tbody'),
  printSpeedTable: document.getElementById('print-speed-table'),
  printChartContainer: document.getElementById('print-chart-container'),
  printDisciplinesTable: document.getElementById('print-disciplines-table'),
  printScoreTbody: document.getElementById('print-score-tbody'),
  
  // Actions
  btnSaveDay: document.getElementById('btn-save-day'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import-file'),
  btnReset: document.getElementById('btn-reset'),
  btnPrintCard: document.getElementById('btn-print-card'),
  btnArchiveCard: document.getElementById('btn-archive-card'),
  themeToggle: document.getElementById('theme-toggle'),
  
  // Mobile UI Elements
  hamburgerBtn: document.getElementById('hamburger-btn'),
  sidebarSection: document.getElementById('sidebar-section'),
  mobileSidebarOverlay: document.getElementById('mobile-sidebar-overlay')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  checkAndArchiveCompletedCard();
  initUI();
  setupEventListeners();
  renderAll();
});

function checkAndArchiveCompletedCard() {
  if (!appState || !appState.days || appState.days.length === 0) return;
  const today = new Date().toISOString().split('T')[0];
  const timeline = calculateCardTimeline(appState.commencingDate);
  
  if (today > timeline.endStr) {
    if (hasAnyDataLogged()) {
      archiveActiveCard(true); // silent archive
      const newCardId = appState.currentCardId < 7 ? appState.currentCardId + 1 : 1;
      resetActiveBoardForNewCard(newCardId);
      
      const newTimeline = calculateCardTimeline(today);
      resizeStateForNewTimeline(newTimeline.startStr);
      saveState();
      setTimeout(() => alert("Your previous card timeframe ended and was automatically archived. Welcome to your new card!"), 500);
    } else {
      const newTimeline = calculateCardTimeline(today);
      resizeStateForNewTimeline(newTimeline.startStr);
      saveState();
    }
  }
}

// Date logic helpers for dynamic card timelines
function getSecondSunday(year, monthIndex) {
  let date = new Date(year, monthIndex, 1);
  let dayOfWeek = date.getDay();
  let daysToFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  date.setDate(1 + daysToFirstSunday);
  date.setDate(date.getDate() + 7); // Second Sunday
  return date;
}

function toLocalISOString(date) {
  const pad = n => n < 10 ? '0' + n : n;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function calculateCardTimeline(baseDateStr) {
  const d = new Date(baseDateStr);
  let year = d.getFullYear();
  let month = d.getMonth();

  let currentMonth2ndSunday = getSecondSunday(year, month);
  let startOfCurrentMonthCard = new Date(currentMonth2ndSunday);
  startOfCurrentMonthCard.setDate(startOfCurrentMonthCard.getDate() + 1);

  let startMonth, startYear;
  if (d < startOfCurrentMonthCard) {
    if (month === 0) { startMonth = 11; startYear = year - 1; }
    else { startMonth = month - 1; startYear = year; }
  } else {
    startMonth = month; startYear = year;
  }

  const startCard2ndSunday = getSecondSunday(startYear, startMonth);
  const cardStart = new Date(startCard2ndSunday);
  cardStart.setDate(cardStart.getDate() + 1);

  let endMonth = startMonth === 11 ? 0 : startMonth + 1;
  let endYear = startMonth === 11 ? startYear + 1 : startYear;
  const cardEnd = getSecondSunday(endYear, endMonth);

  const diffTime = Math.abs(cardEnd - cardStart);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return {
    startStr: toLocalISOString(cardStart),
    endStr: toLocalISOString(cardEnd),
    totalDays: diffDays,
    totalWeeks: diffDays / 7
  };
}

// Load state from Backend
async function loadState() {
  try {
    const response = await fetch('/api/state');
    if (response.redirected) {
      window.location.href = response.url;
      return;
    }
    if (response.status === 401) {
      window.location.href = '/login_page';
      return;
    }
    if (response.status === 404) {
      initDefaultState();
      return;
    }
    
    appState = await response.json();
    
    // Migration checks
    if (!appState.days || (appState.days.length !== 28 && appState.days.length !== 35)) {
      initDefaultState();
    } else {
      if (!appState.savedCards) appState.savedCards = [];
      if (!appState.weaknesses || appState.weaknesses.length !== 3) {
        appState.weaknesses = [
          { name: "", action: "" },
          { name: "", action: "" },
          { name: "", action: "" }
        ];
      }
      appState.days.forEach(d => {
        if (d.fidFocus === undefined) d.fidFocus = "";
        if (d.fidInsight === undefined) d.fidInsight = "";
        if (d.fidDoing === undefined) d.fidDoing = "";
        if (d.scriptureMemorized === undefined) d.scriptureMemorized = "";
        if (d.prayerTopic === undefined) d.prayerTopic = "";
      });
    }
  } catch (e) {
    console.error("Error loading state, resetting.", e);
    initDefaultState();
  }
}

// Save state to Backend
function saveState() {
  if (isViewingHistory) return;
  fetch('/api/save_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appState)
  }).catch(e => console.error("Failed to save state", e));
}

function resizeStateForNewTimeline(newStartDateStr) {
  const timeline = calculateCardTimeline(newStartDateStr);
  appState.commencingDate = timeline.startStr;
  
  // Resize weeks
  while(appState.weeks.length < timeline.totalWeeks) {
    appState.weeks.push({ weekNumber: appState.weeks.length + 1, sharedFid: false });
  }
  if (appState.weeks.length > timeline.totalWeeks) {
    appState.weeks.length = timeline.totalWeeks;
  }
  
  // Resize days
  while(appState.days.length < timeline.totalDays) {
    appState.days.push({
      dayNumber: appState.days.length + 1,
      wakingTime: "", morningChapters: 0, laterChapters: 0, bibleBook: "",
      startChapter: 0, endChapter: 0, recitedMemory: false, fidJournaling: false,
      prayer10mins: false, dataValidity: false, fidFocus: "", fidInsight: "",
      fidDoing: "", scriptureMemorized: "", prayerTopic: "", cbId: "", cbSolution: "",
      cbScripture: "", cbResolved: false, logTimestamp: null
    });
  }
  if (appState.days.length > timeline.totalDays) {
    appState.days.length = timeline.totalDays;
  }
}

// Create a blank default state
function initDefaultState() {
  const today = new Date().toISOString().split('T')[0];
  const timeline = calculateCardTimeline(today);

  appState = {
    username: "Bible Reader",
    contact: "",
    church: "",
    weaknesses: [
      { name: "", action: "" },
      { name: "", action: "" },
      { name: "", action: "" }
    ],
    currentCardId: 1,
    commencingDate: timeline.startStr,
    days: [],
    weeks: [],
    savedCards: [],
    theme: 'dark'
  };

  // Generate dynamic weeks and days
  resizeStateForNewTimeline(timeline.startStr);

  saveState();
}

// Get active data (switches dynamically if viewing historical records)
function getActiveData() {
  return isViewingHistory ? historicalCardData : appState;
}

// Initialize static UI components like Bible Books drop-downs, sidebar data, etc.
function initUI() {
  const data = getActiveData();

  // Theme setup
  if (appState.theme === 'light') {
    document.body.classList.add('light-mode');
    elements.themeToggle.innerText = '🌙';
  } else {
    document.body.classList.remove('light-mode');
    elements.themeToggle.innerText = '☀️';
  }

  // Populate profile inputs from state
  elements.usernameInput.value = data.username;
  elements.contactInput.value = data.contact || "";
  elements.churchInput.value = data.church || "";
  elements.cardSelector.value = data.currentCardId;
  elements.commencingDateInput.value = data.commencingDate;

  // Populate weaknesses setup fields
  elements.weakness1Name.value = data.weaknesses[0].name || "";
  elements.weakness1Action.value = data.weaknesses[0].action || "";
  elements.weakness2Name.value = data.weaknesses[1].name || "";
  elements.weakness2Action.value = data.weaknesses[1].action || "";
  elements.weakness3Name.value = data.weaknesses[2].name || "";
  elements.weakness3Action.value = data.weaknesses[2].action || "";

  // Populate Bible book selectors
  elements.inputBibleBook.innerHTML = '<option value="">-- Select Book --</option>';
  CBR_DATA.bibleBooks.forEach(book => {
    const opt = document.createElement('option');
    opt.value = book.name;
    opt.innerText = book.name;
    elements.inputBibleBook.appendChild(opt);
  });

  // Populate Consistency Barriers selector in form
  elements.inputCbId.innerHTML = '<option value="">-- Select Consistency Barrier --</option>';
  const personalOptGroup = document.createElement('optgroup');
  personalOptGroup.label = "Personal Factors";
  const externalOptGroup = document.createElement('optgroup');
  externalOptGroup.label = "External Factors";

  CBR_DATA.barriers.forEach(cb => {
    const opt = document.createElement('option');
    opt.value = cb.id;
    opt.innerText = `CB ${cb.id}: ${cb.text}`;
    if (cb.type === 'Personal') {
      personalOptGroup.appendChild(opt);
    } else {
      externalOptGroup.appendChild(opt);
    }
  });
  elements.inputCbId.appendChild(personalOptGroup);
  elements.inputCbId.appendChild(externalOptGroup);

  // Populate Reference Sidebar - Syllabus
  elements.syllabusList.innerHTML = '';
  CBR_DATA.sessions.forEach(sess => {
    const div = document.createElement('div');
    div.className = 'session-item';
    const h5 = document.createElement('h5');
    h5.className = 'session-title-inline';
    h5.innerText = sess.title;
    div.appendChild(h5);
    
    const ul = document.createElement('ul');
    ul.className = 'activity-list';
    sess.activities.forEach(act => {
      const li = document.createElement('li');
      li.innerText = `${act.id}. ${act.text}`;
      ul.appendChild(li);
    });
    div.appendChild(ul);
    elements.syllabusList.appendChild(div);
  });

  // Populate Reference Sidebar - Barriers list
  elements.barriersList.innerHTML = `
    <div style="font-size:0.8rem; line-height: 1.4; color:var(--text-secondary); margin-bottom:1rem; padding:0.75rem; background:rgba(var(--primary-rgb),0.05); border-radius:10px; border:1px solid var(--panel-border);">
      <strong>How to form a good principle:</strong><br>
      1. Identify the CB and mark its number on your card.<br>
      2. Common Sense: Think of a practical solution.<br>
      3. Find a Scripture that supports your solution.<br>
      4. Pray back its truth.<br>
      5. Share resolve with PEs.
    </div>
  `;
  CBR_DATA.barriers.forEach(cb => {
    const div = document.createElement('div');
    div.className = 'cb-list-item';
    const badge = document.createElement('span');
    badge.className = 'cb-id-badge';
    badge.innerText = cb.id;
    div.appendChild(badge);
    
    const text = document.createElement('span');
    text.innerText = cb.text;
    div.appendChild(text);
    
    const cat = document.createElement('span');
    cat.className = `cb-category ${cb.type.toLowerCase()}`;
    cat.innerText = cb.type;
    div.appendChild(cat);
    
    elements.barriersList.appendChild(div);
  });

  // Populate Reference Sidebar - Study Questions
  elements.questionsList.innerHTML = '';
  CBR_DATA.lessons.forEach(les => {
    const div = document.createElement('div');
    div.className = 'lesson-card';
    const h4 = document.createElement('h4');
    h4.innerText = les.title;
    div.appendChild(h4);
    
    const ol = document.createElement('ol');
    ol.className = 'question-list';
    les.questions.forEach(q => {
      const li = document.createElement('li');
      li.innerText = q;
      ol.appendChild(li);
    });
    div.appendChild(ol);
    elements.questionsList.appendChild(div);
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Profile / Settings Change Handlers
  const profileInputs = [elements.usernameInput, elements.contactInput, elements.churchInput];
  profileInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (isViewingHistory) return;
      appState.username = elements.usernameInput.value;
      appState.contact = elements.contactInput.value;
      appState.church = elements.churchInput.value;
      saveState();
    });
  });

  // Bind Weaknesses inputs
  const weaknessInputs = [
    { el: elements.weakness1Name, idx: 0, field: 'name' },
    { el: elements.weakness1Action, idx: 0, field: 'action' },
    { el: elements.weakness2Name, idx: 1, field: 'name' },
    { el: elements.weakness2Action, idx: 1, field: 'action' },
    { el: elements.weakness3Name, idx: 2, field: 'name' },
    { el: elements.weakness3Action, idx: 2, field: 'action' }
  ];
  weaknessInputs.forEach(wi => {
    wi.el.addEventListener('change', () => {
      if (isViewingHistory) return;
      appState.weaknesses[wi.idx][wi.field] = wi.el.value;
      saveState();
    });
  });

  elements.cardSelector.addEventListener('change', () => {
    if (isViewingHistory) return;
    
    if (autoArchiveIfNeeded()) {
      const newCardId = parseInt(elements.cardSelector.value, 10);
      resetActiveBoardForNewCard(newCardId);
    } else {
      appState.currentCardId = parseInt(elements.cardSelector.value, 10);
      saveState();
    }
    
    renderAll();
  });
  
  elements.commencingDateInput.addEventListener('change', () => {
    if (isViewingHistory) return;
    resizeStateForNewTimeline(elements.commencingDateInput.value);
    elements.commencingDateInput.value = appState.commencingDate;
    saveState();
    renderAll();
  });

  // Theme Toggle
  elements.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    appState.theme = isLight ? 'light' : 'dark';
    elements.themeToggle.innerText = isLight ? '🌙' : '☀️';
    saveState();
  });

  // Tabs Handler
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      elements.tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      elements.tabContents.forEach(c => {
        if (c.id === target) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
      
      // On mobile, automatically close sidebar after making a selection
      if (window.innerWidth <= 900 && elements.sidebarSection && elements.sidebarSection.classList.contains('open')) {
        elements.sidebarSection.classList.remove('open');
        if (elements.mobileSidebarOverlay) elements.mobileSidebarOverlay.classList.remove('open');
      }
    });
  });

  // Mobile Sidebar Toggle
  if (elements.hamburgerBtn && elements.sidebarSection && elements.mobileSidebarOverlay) {
    elements.hamburgerBtn.addEventListener('click', () => {
      elements.sidebarSection.classList.add('open');
      elements.mobileSidebarOverlay.classList.add('open');
    });
    
    elements.mobileSidebarOverlay.addEventListener('click', () => {
      elements.sidebarSection.classList.remove('open');
      elements.mobileSidebarOverlay.classList.remove('open');
    });
  }

  // Modal Close
  elements.modalClose.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => {
    if (e.target === elements.dayModal) {
      closeModal();
    }
  });

  // Log Form Dynamic Chapters
  elements.inputBibleBook.addEventListener('change', () => {
    updateChapterDropdowns();
  });
  elements.inputStartChapter.addEventListener('change', () => {
    if (!elements.inputEndChapter.value || parseInt(elements.inputEndChapter.value, 10) < parseInt(elements.inputStartChapter.value, 10)) {
      elements.inputEndChapter.value = elements.inputStartChapter.value;
    }
    calculateReadingSpeeds();
  });
  elements.inputEndChapter.addEventListener('change', () => {
    calculateReadingSpeeds();
  });

  // Check form inputs to show CB block and adjust morning/later speed columns
  elements.inputWakingTime.addEventListener('input', () => {
    adjustChaptersBasedOnWakingTime();
    checkTargetsAndToggleCbPanel();
  });
  elements.inputMorningChapters.addEventListener('input', checkTargetsAndToggleCbPanel);
  elements.inputLaterChapters.addEventListener('input', checkTargetsAndToggleCbPanel);

  // Form Submission
  elements.dayForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isViewingHistory) {
      closeModal();
      return;
    }
    saveDayLog();
  });

  // Chart Week selector
  elements.weekSelectChart.addEventListener('change', () => {
    currentWeekForChart = parseInt(elements.weekSelectChart.value, 10);
    renderChart();
  });

  // Master Actions
  elements.btnExport.addEventListener('click', exportData);
  elements.btnImport.addEventListener('change', importData);
  elements.btnReset.addEventListener('click', resetCurrentCard);
  elements.btnArchiveCard.addEventListener('click', archiveActiveCard);
  elements.btnExitHistory.addEventListener('click', exitHistoricalView);
  elements.btnPrintCard.addEventListener('click', handlePrintTrigger);
}

// Convert Waking Time string "HH:MM" to decimal hours for math
function timeStringToDecimal(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
}

// Add days to date utility
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Format date nicely
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
}

// Update Start and End chapter dropdown elements
function updateChapterDropdowns(selectedStart = 0, selectedEnd = 0) {
  const bookName = elements.inputBibleBook.value;
  elements.inputStartChapter.innerHTML = '<option value="0">-- Start --</option>';
  elements.inputEndChapter.innerHTML = '<option value="0">-- End --</option>';
  
  if (!bookName) return;
  const book = CBR_DATA.bibleBooks.find(b => b.name === bookName);
  if (!book) return;
  
  for (let i = 1; i <= book.chapters; i++) {
    const optStart = document.createElement('option');
    optStart.value = i;
    optStart.innerText = `Ch ${i}`;
    if (i === selectedStart) optStart.selected = true;
    elements.inputStartChapter.appendChild(optStart);
    
    const optEnd = document.createElement('option');
    optEnd.value = i;
    optEnd.innerText = `Ch ${i}`;
    if (i === selectedEnd) optEnd.selected = true;
    elements.inputEndChapter.appendChild(optEnd);
  }
}

// Adjust chapters distribution based on current waking time relative to ERT target
function adjustChaptersBasedOnWakingTime() {
  const data = getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
  const targetERT = timeStringToDecimal(card.ertTarget);
  const wakingTimeStr = elements.inputWakingTime.value;
  
  if (!wakingTimeStr) return;
  const currentERT = timeStringToDecimal(wakingTimeStr);
  if (currentERT === null) return;

  const start = parseInt(elements.inputStartChapter.value, 10);
  const end = parseInt(elements.inputEndChapter.value, 10);

  let totalChapters = 0;
  if (start > 0 && end >= start) {
    totalChapters = end - start + 1;
  } else {
    // Default to card's target number of chapters if no range is selected
    totalChapters = card.chaptersTarget;
  }

  if (currentERT <= targetERT) {
    // Woke up on time (preferred time) -> Morning Chapters (strokes)
    elements.inputMorningChapters.value = totalChapters;
    elements.inputLaterChapters.value = 0;
  } else {
    // Woke up late -> Later Chapters (dark solid)
    elements.inputMorningChapters.value = 0;
    elements.inputLaterChapters.value = totalChapters;
  }
}

// Auto-calculate reading speed values based on chapters selected and waking time
function calculateReadingSpeeds() {
  const start = parseInt(elements.inputStartChapter.value, 10);
  const end = parseInt(elements.inputEndChapter.value, 10);
  
  if (start > 0 && end >= start) {
    const totalChapters = end - start + 1;
    const data = getActiveData();
    const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
    const targetERT = timeStringToDecimal(card.ertTarget);
    
    const wakingTimeStr = elements.inputWakingTime.value;
    if (wakingTimeStr) {
      const currentERT = timeStringToDecimal(wakingTimeStr);
      if (currentERT !== null && currentERT <= targetERT) {
        elements.inputMorningChapters.value = totalChapters;
        elements.inputLaterChapters.value = 0;
      } else {
        elements.inputMorningChapters.value = 0;
        elements.inputLaterChapters.value = totalChapters;
      }
    } else {
      // Fallback to time of logging if waking time is blank
      const currentHour = new Date().getHours();
      if (currentHour < 12) {
        elements.inputMorningChapters.value = totalChapters;
        elements.inputLaterChapters.value = 0;
      } else {
        elements.inputMorningChapters.value = 0;
        elements.inputLaterChapters.value = totalChapters;
      }
    }
  } else {
    elements.inputMorningChapters.value = 0;
    elements.inputLaterChapters.value = 0;
  }
  checkTargetsAndToggleCbPanel();
}

// Logic: Did they miss their waking target or chapters target? If so, display the CB editor.
function checkTargetsAndToggleCbPanel() {
  const data = getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
  const targetERT = timeStringToDecimal(card.ertTarget);
  
  const currentERT = timeStringToDecimal(elements.inputWakingTime.value);
  
  let missedWaking = (currentERT !== null && currentERT > targetERT);
  const hasLoggedTime = (elements.inputWakingTime.value !== "");
  
  if (hasLoggedTime && missedWaking) {
    elements.cbTriggerBox.classList.add('visible');
  } else {
    elements.cbTriggerBox.classList.remove('visible');
    if (!elements.cbTriggerBox.classList.contains('visible') && !elements.inputCbResolved.checked) {
      elements.inputCbId.value = "";
      elements.inputCbSolution.value = "";
      elements.inputCbScripture.value = "";
      elements.inputCbResolved.checked = false;
    }
  }
}

// Show/Open modal to log data for a specific day
function openDayModal(dayNum) {
  currentEditingDayNum = dayNum;
  const data = getActiveData();
  const dayData = data.days.find(d => d.dayNumber === dayNum);
  const dateStr = addDays(data.commencingDate, dayNum - 1);
  const dateLabel = formatDateLabel(dateStr);
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
  
  elements.dayModalTitle.innerText = isViewingHistory ? `View Progress: Day ${dayNum} (Read-Only)` : `Log Progress: Day ${dayNum}`;
  elements.dayModalSub.innerText = `${dateLabel} (Card Target: ${card.chaptersTarget} ch / Waking: ${card.ertTarget})`;
  
  // Detect if logging today. Auto-detect time of logging.
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = (dateStr === todayStr);

  let wakingTimeVal = dayData.wakingTime || "";
  let morningChaptersVal = dayData.morningChapters || 0;
  let laterChaptersVal = dayData.laterChapters || 0;

  if (isToday && !isViewingHistory && !wakingTimeVal && morningChaptersVal === 0 && laterChaptersVal === 0) {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    wakingTimeVal = `${hrs}:${mins}`;

    const targetERT = timeStringToDecimal(card.ertTarget);
    const currentERT = now.getHours() + now.getMinutes() / 60;

    if (currentERT <= targetERT) {
      // Woke up on target time (preferred time) -> Morning chapters (strokes)
      morningChaptersVal = card.chaptersTarget;
      laterChaptersVal = 0;
    } else {
      // Woke up late -> Later chapters (dark solid)
      morningChaptersVal = 0;
      laterChaptersVal = card.chaptersTarget;
    }
  }

  // Load values
  elements.inputWakingTime.value = wakingTimeVal;
  elements.inputBibleBook.value = dayData.bibleBook || "";
  updateChapterDropdowns(dayData.startChapter, dayData.endChapter);
  elements.inputMorningChapters.value = morningChaptersVal;
  elements.inputLaterChapters.value = laterChaptersVal;
  elements.inputRecitedMemory.checked = dayData.recitedMemory || false;
  elements.inputFidJournaling.checked = dayData.fidJournaling || false;
  elements.inputPrayer10mins.checked = dayData.prayer10mins || false;
  elements.inputDataValidity.checked = dayData.dataValidity || false;
  
  // Devotion inputs
  elements.inputFidFocus.value = dayData.fidFocus || "";
  elements.inputFidInsight.value = dayData.fidInsight || "";
  elements.inputFidDoing.value = dayData.fidDoing || "";
  elements.inputScriptureMemorized.value = dayData.scriptureMemorized || "";
  elements.inputPrayerTopic.value = dayData.prayerTopic || "";
  
  // Load CB values
  elements.inputCbId.value = dayData.cbId || "";
  elements.inputCbSolution.value = dayData.cbSolution || "";
  elements.inputCbScripture.value = dayData.cbScripture || "";
  elements.inputCbResolved.checked = dayData.cbResolved || false;
  
  checkTargetsAndToggleCbPanel();

  // If in read-only mode, disable form interactive submit actions and inputs
  if (isViewingHistory) {
    elements.btnSaveDay.style.display = 'none';
    setFormDisabledState(true);
  } else {
    elements.btnSaveDay.style.display = 'inline-flex';
    setFormDisabledState(false);
  }
  
  // Dynamic labels for Devotional Method based on card
  let method = "FID";
  if (card.cardId === 2 || card.cardId === 3) method = "OPEN";
  if (card.cardId >= 4) method = "PERSONS";

  const lblCheckbox = document.getElementById('label-fid-checkbox');
  const lblHeader = document.getElementById('label-devotion-header');
  const lblP1 = document.getElementById('label-method-part1');
  const lblP2 = document.getElementById('label-method-part2');
  const lblP3 = document.getElementById('label-method-part3');

  if (method === "FID") {
    if (lblCheckbox) lblCheckbox.innerText = "Wrote FID Journal Notes (Focus, Insight, Doing Meditation)";
    if (lblHeader) lblHeader.innerText = "Daily Devotion & FID Journal Notes";
    if (lblP1) lblP1.innerText = "F - Focus (Key Verse / Subject Reference)";
    if (lblP2) lblP2.innerText = "I - Insights (Observations & Spiritual Lessons)";
    if (lblP3) lblP3.innerText = "D - Doing (Obedience Conviction / Application)";
  } else if (method === "OPEN") {
    if (lblCheckbox) lblCheckbox.innerText = "Wrote OPEN Journal Notes";
    if (lblHeader) lblHeader.innerText = "Daily Devotion & OPEN Journal Notes";
    if (lblP1) lblP1.innerText = "O - Observation / Focus";
    if (lblP2) lblP2.innerText = "P - Prayer / Insights";
    if (lblP3) lblP3.innerText = "E, N - Evaluation & Notes / Application";
  } else if (method === "PERSONS") {
    if (lblCheckbox) lblCheckbox.innerText = "Wrote PERSONS Journal Notes";
    if (lblHeader) lblHeader.innerText = "Daily Devotion & PERSONS Journal Notes";
    if (lblP1) lblP1.innerText = "P, E, R - Personal, English, References";
    if (lblP2) lblP2.innerText = "S, O - Satan's Opposing, Obedience";
    if (lblP3) lblP3.innerText = "N, S - Note, Stirring Others";
  }

  // Load PE Meeting Checkbox for this week
  const weekIndexForDay = Math.floor((dayNum - 1) / 7);
  if (elements.inputPeMeeting) {
    elements.inputPeMeeting.checked = data.weeks[weekIndexForDay].sharedFid || false;
  }

  elements.dayModal.classList.add('open');
}

function setFormDisabledState(disabled) {
  const selectors = '#day-form input, #day-form select, #day-form textarea';
  document.querySelectorAll(selectors).forEach(el => {
    if (el.id !== 'data-validity') {
      el.disabled = disabled;
    }
  });
}

function closeModal() {
  elements.dayModal.classList.remove('open');
  currentEditingDayNum = null;
  elements.dayForm.reset();
}

// Save logged data to state and localStorage
function saveDayLog() {
  if (currentEditingDayNum === null || isViewingHistory) return;
  
  const dayData = appState.days.find(d => d.dayNumber === currentEditingDayNum);
  const dayDate = addDays(appState.commencingDate, currentEditingDayNum - 1);
  const todayStr = new Date().toISOString().split('T')[0];
  
  dayData.wakingTime = elements.inputWakingTime.value;
  dayData.bibleBook = elements.inputBibleBook.value;
  dayData.startChapter = parseInt(elements.inputStartChapter.value, 10) || 0;
  dayData.endChapter = parseInt(elements.inputEndChapter.value, 10) || 0;
  dayData.morningChapters = parseInt(elements.inputMorningChapters.value, 10) || 0;
  dayData.laterChapters = parseInt(elements.inputLaterChapters.value, 10) || 0;
  dayData.recitedMemory = elements.inputRecitedMemory.checked;
  dayData.fidJournaling = elements.inputFidJournaling.checked;
  dayData.prayer10mins = elements.inputPrayer10mins.checked;
  
  // Data Validity Calculation
  dayData.dataValidity = (todayStr === dayDate);
  
  // Devotion fields
  dayData.fidFocus = elements.inputFidFocus.value;
  dayData.fidInsight = elements.inputFidInsight.value;
  dayData.fidDoing = elements.inputFidDoing.value;
  dayData.scriptureMemorized = elements.inputScriptureMemorized.value;
  dayData.prayerTopic = elements.inputPrayerTopic.value;
  
  // Load CB details
  const isCbVisible = elements.cbTriggerBox.classList.contains('visible');
  if (isCbVisible) {
    dayData.cbId = elements.inputCbId.value ? parseInt(elements.inputCbId.value, 10) : "";
    dayData.cbSolution = elements.inputCbSolution.value;
    dayData.cbScripture = elements.inputCbScripture.value;
    dayData.cbResolved = elements.inputCbResolved.checked;
  } else {
    dayData.cbId = "";
    dayData.cbSolution = "";
    dayData.cbScripture = "";
    dayData.cbResolved = false;
  }
  
  dayData.logTimestamp = new Date().toISOString();
  
  // Save PE Meeting
  if (elements.inputPeMeeting) {
    const weekIndex = Math.floor((currentEditingDayNum - 1) / 7);
    appState.weeks[weekIndex].sharedFid = elements.inputPeMeeting.checked;
  }
  
  // Auto-switch chart week to the currently edited week so updates are immediately visible
  currentWeekForChart = Math.floor((currentEditingDayNum - 1) / 7) + 1;
  
  saveState();
  closeModal();
  renderAll();
}

// RENDER ALL PAGE COMPONENTS
function renderAll() {
  renderHeaderAndKPIs();
  renderCalendarGrid();
  renderChart();
  renderScoringTable();
  renderLibraryList();
}

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
  
  // Update chart week selector options
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
      
      let timeIcon = '⏰';
      if (decTime !== null) {
        if (decTime <= targetERT) {
          timeDiv.style.color = 'var(--success)';
          timeIcon = '☀️';
        } else {
          timeDiv.style.color = 'var(--danger)';
          timeIcon = '💤';
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
      
      dots.forEach(dot => {
        const dotSpan = document.createElement('span');
        dotSpan.className = 'disc-dot';
        if (dayData[dot.name]) {
          dotSpan.classList.add(dot.isValidity ? 'valid' : 'checked');
        }
        dotSpan.title = `${dot.title}: ${dayData[dot.name] ? 'Completed' : 'Missed'}`;
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
function calculateScores() {
  const data = getActiveData();
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId);
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
    const prayerfulnessPoints = (prayerfulnessMetDaysCount === 7) ? 1 : 0;
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
    headerRow.innerHTML = '<th>CBR Discipline Description</th>';
    for (let w = 1; w <= stats.weeks.length; w++) {
      headerRow.innerHTML += `<th class="text-center" style="width: 12%;">Week ${w}</th>`;
    }
    headerRow.innerHTML += '<th class="text-right" style="width: 15%;">Total Score</th>';
  }
  
  const disciplines = [
    { name: 'Perseverance (Chapters Read)', key: 'perseverance', max: 3, desc: 'Read ALL set chapters each day' },
    { name: 'Commitment (Early Rising)', key: 'commitment', max: 2, desc: 'Woke up at set ERT each day' },
    { name: 'Prayerfulness (CBR Prayer)', key: 'prayer', max: 1, desc: 'Prayed 10 mins after CBR each day' },
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
  tdTotalLabel.innerText = 'CBR GROWTH POINTS (Total Weekly Score)';
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

// Render the historical archived cards list
function renderLibraryList() {
  elements.libraryTableBody.innerHTML = '';
  
  const emptyMsg = document.getElementById('history-empty-msg');
  const progressContainer = document.getElementById('history-progress-bar-container');
  
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
    btnView.innerText = '👁️';
    btnView.title = 'View this card';
    btnView.addEventListener('click', () => loadHistoricalView(card.instanceId));
    tdActions.appendChild(btnView);
    
    const btnPrint = document.createElement('button');
    btnPrint.className = 'btn btn-secondary btn-small';
    btnPrint.innerText = '🖨️';
    btnPrint.title = 'Print this card';
    btnPrint.addEventListener('click', () => {
      historicalCardData = card;
      isViewingHistory = true;
      prepareAndPrintCard();
      isViewingHistory = false;
      historicalCardData = null;
    });
    tdActions.appendChild(btnPrint);
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-secondary btn-small';
    btnDel.style.cssText = 'border-color:rgba(var(--danger-rgb),0.3);color:var(--danger);';
    btnDel.innerText = '🗑️';
    btnDel.title = 'Delete this archive';
    btnDel.addEventListener('click', () => deleteArchivedCard(card.instanceId));
    tdActions.appendChild(btnDel);
    
    tr.appendChild(tdActions);
    elements.libraryTableBody.appendChild(tr);
  });
}

function hasAnyDataLogged() {
  if (!appState || !appState.days) return false;
  return appState.days.some(d => d.wakingTime || (d.morningChapters + d.laterChapters) > 0 || d.fidJournaling || d.prayer10mins || d.cbResolved);
}

function resetActiveBoardForNewCard(newCardId) {
  const preserved = {
    username: appState.username,
    contact: appState.contact,
    church: appState.church,
    weaknesses: JSON.parse(JSON.stringify(appState.weaknesses)),
    savedCards: appState.savedCards,
    theme: appState.theme
  };
  
  const today = new Date().toISOString().split('T')[0];
  const timeline = calculateCardTimeline(today);
  
  appState.currentCardId = newCardId;
  appState.commencingDate = timeline.startStr;
  appState.days = [];
  appState.weeks = [];
  
  resizeStateForNewTimeline(timeline.startStr);
  
  Object.assign(appState, preserved);
  saveState();
}

function autoArchiveIfNeeded() {
  if (hasAnyDataLogged()) {
    archiveActiveCard(true); // silent archive
    return true;
  }
  return false;
}

// Archive active card into local library database
function archiveActiveCard(silent = false) {
  const stats = calculateScores();
  
  if (!silent && !confirm(`Archive active card (Card ${appState.currentCardId}) to history? Total Score: ${stats.totalScore} pts, Laxity: ${stats.totalLaxity} pts.`)) {
    return false;
  }
  
  const archiveInstance = {
    instanceId: `card_${appState.currentCardId}_${new Date().getTime()}`,
    cardId: appState.currentCardId,
    commencingDate: appState.commencingDate,
    username: appState.username,
    contact: appState.contact,
    church: appState.church,
    weaknesses: JSON.parse(JSON.stringify(appState.weaknesses)),
    days: JSON.parse(JSON.stringify(appState.days)),
    weeks: JSON.parse(JSON.stringify(appState.weeks)),
    totalScore: stats.totalScore,
    totalLaxity: stats.totalLaxity,
    savedAt: new Date().toISOString()
  };
  
  appState.savedCards.push(archiveInstance);
  
  fetch('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(archiveInstance)
  }).catch(e => console.error("Failed to archive card", e));
  
  saveState();
  
  if (!silent) {
    alert("Card successfully archived to your library!");
    if (appState.currentCardId < 7 && confirm(`Would you like to upgrade your active card to Card ${appState.currentCardId + 1} and clear logs?`)) {
      resetActiveBoardForNewCard(appState.currentCardId + 1);
    } else if (confirm("Would you like to reset/clear active card logs to start a new round?")) {
      resetActiveBoardForNewCard(appState.currentCardId);
    } else {
      renderAll();
    }
  }
  return true;
}

// Clear logs of current active card (helper for archiving reset)
function resetActiveCardLogsOnly() {
  const today = new Date().toISOString().split('T')[0];
  appState.commencingDate = today;
  appState.weeks = [
    { weekNumber: 1, sharedFid: false },
    { weekNumber: 2, sharedFid: false },
    { weekNumber: 3, sharedFid: false },
    { weekNumber: 4, sharedFid: false }
  ];
  
  appState.days.forEach(day => {
    day.wakingTime = "";
    day.bibleBook = "";
    day.startChapter = 0;
    day.endChapter = 0;
    day.morningChapters = 0;
    day.laterChapters = 0;
    day.recitedMemory = false;
    day.fidJournaling = false;
    day.prayer10mins = false;
    day.dataValidity = false;
    day.fidFocus = "";
    day.fidInsight = "";
    day.fidDoing = "";
    day.scriptureMemorized = "";
    day.prayerTopic = "";
    day.cbId = "";
    day.cbSolution = "";
    day.cbScripture = "";
    day.cbResolved = false;
    day.logTimestamp = null;
  });
  
  saveState();
  initUI();
  renderAll();
}

// Load archived card into read-only viewing mode
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
}

// Delete completed card snapshot from database
function deleteArchivedCard(instanceId) {
  if (confirm("Are you sure you want to delete this archived card from history? This action is permanent.")) {
    appState.savedCards = appState.savedCards.filter(c => c.instanceId !== instanceId);
    saveState();
    renderLibraryList();
  }
}

// Trigger print process for the current active or loaded history card
function handlePrintTrigger() {
  printChallengerCard(getActiveData());
}


// Export logs data to JSON file
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `cbr_challenger_backup_${appState.username.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Import logs data from JSON file
function importData(e) {
  const fileReader = new FileReader();
  const file = e.target.files[0];
  if (!file) return;
  
  fileReader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.days && (parsed.days.length === 28 || parsed.days.length === 35)) {
        appState = parsed;
        
        // Ensure library structure exists in imported state
        if (!appState.savedCards) appState.savedCards = [];
        if (!appState.weaknesses) {
          appState.weaknesses = [
            { name: "", action: "" },
            { name: "", action: "" },
            { name: "", action: "" }
          ];
        }
        
        saveState();
        initUI();
        renderAll();
        alert("Backup data imported successfully!");
      } else {
        alert("Invalid backup file structure. Ensure it is a valid CBR backup JSON.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse JSON file.");
    }
  };
  fileReader.readAsText(file);
}

// Reset current active card logs
function resetCurrentCard() {
  if (confirm("Are you sure you want to reset all log fields for the active card? This action cannot be undone unless you have archived it or exported a JSON backup.")) {
    resetActiveCardLogsOnly();
  }
}
