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
  cwdTrigger: document.getElementById('cwd-trigger'),
  cwdLabel: document.getElementById('cwd-label'),
  cwdList: document.getElementById('cwd-list'),
  cwdDropdown: document.getElementById('custom-week-dropdown'),
  
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
  inputStudyMethod: document.getElementById('study-method'),
  fidFields: document.getElementById('fid-fields'),
  openFields: document.getElementById('open-fields'),
  personsFields: document.getElementById('persons-fields'),
  inputFidFocus: document.getElementById('fid-focus'),
  inputFidInsight: document.getElementById('fid-insight'),
  inputFidDoing: document.getElementById('fid-doing'),
  inputOpenObservation: document.getElementById('open-observation'),
  inputOpenPrinciples: document.getElementById('open-principles'),
  inputOpenExperience: document.getElementById('open-experience'),
  inputOpenNeed: document.getElementById('open-need'),
  inputPersonsPersonal: document.getElementById('persons-personal'),
  inputPersonsEnglish: document.getElementById('persons-english'),
  inputPersonsReferences: document.getElementById('persons-references'),
  inputPersonsSatan: document.getElementById('persons-satan'),
  inputPersonsObedience: document.getElementById('persons-obedience'),
  inputPersonsNote: document.getElementById('persons-note'),
  inputPersonsStirring: document.getElementById('persons-stirring'),
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
  mobileSidebarOverlay: document.getElementById('mobile-sidebar-overlay'),

  // Profile Page Elements
  topbarProfileBtn: document.getElementById('topbar-profile-btn'),
  topbarAvatarImg: document.getElementById('topbar-avatar-img'),
  topbarAvatarIcon: document.getElementById('topbar-avatar-icon'),
  topbarUsername: document.getElementById('topbar-username'),
  
  profileAvatarImg: document.getElementById('profile-avatar-img'),
  profileAvatarFallback: document.getElementById('profile-avatar-fallback'),
  profileDisplayName: document.getElementById('profile-display-name'),
  profileDisplayEmail: document.getElementById('profile-display-email'),
  profileInputUsername: document.getElementById('profile-input-username'),
  profileInputContact: document.getElementById('profile-input-contact'),
  profileInputChurch: document.getElementById('profile-input-church'),
  profileCardNum: document.getElementById('profile-card-num'),
  profileCommenceDate: document.getElementById('profile-commence-date'),
  btnProfileSave: document.getElementById('btn-profile-save'),
  profileSaveMsg: document.getElementById('profile-save-msg'),
  
  milestoneDays: document.getElementById('milestone-days'),
  milestonePoints: document.getElementById('milestone-points'),
  milestoneChapters: document.getElementById('milestone-chapters'),
  milestoneBarriers: document.getElementById('milestone-barriers'),

  // Sidebar footer
  sidebarFooterName: document.getElementById('sidebar-footer-name'),
  sidebarFooterEmail: document.getElementById('sidebar-footer-email'),
  sidebarFooterAvatar: document.getElementById('sidebar-footer-avatar')
};

// ==========================================
// VECTOR ICONS & CUSTOM UI DIALOG SYSTEM
// ==========================================
function refreshIcons(root = document) {
  if (window.lucide && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons({ root });
    } catch (e) {
      console.warn("Lucide icons refresh warning:", e);
    }
  }
}

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  else if (type === 'error') iconName = 'alert-circle';
  else if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
    <div class="toast-text">${message}</div>
  `;
  container.appendChild(toast);
  refreshIcons(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, duration);
}

function showModal({ title, subtitle = '', message, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel', showCancel = true, isDanger = false }) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-dialog-modal');
    if (!modal) {
      resolve(confirm(message));
      return;
    }
    const titleEl = document.getElementById('custom-dialog-title');
    const subEl = document.getElementById('custom-dialog-subtitle');
    const msgEl = document.getElementById('custom-dialog-message');
    const iconEl = document.getElementById('custom-dialog-icon');
    const confirmBtn = document.getElementById('custom-dialog-confirm-btn');
    const cancelBtn = document.getElementById('custom-dialog-cancel-btn');
    const closeBtn = document.getElementById('custom-dialog-close-btn');

    if (titleEl) titleEl.textContent = title || 'Notification';
    if (subEl) subEl.textContent = subtitle || '';
    if (msgEl) msgEl.textContent = message || '';

    let iconName = 'info';
    let iconBg = 'rgba(59,130,246,0.15)';
    let iconColor = '#60a5fa';
    let iconBorder = 'rgba(59,130,246,0.3)';

    if (type === 'success') {
      iconName = 'check-circle-2';
      iconBg = 'rgba(16,185,129,0.18)'; iconColor = '#34d399'; iconBorder = 'rgba(16,185,129,0.35)';
    } else if (type === 'error' || isDanger) {
      iconName = 'alert-triangle';
      iconBg = 'rgba(239,68,68,0.18)'; iconColor = '#f87171'; iconBorder = 'rgba(239,68,68,0.35)';
    } else if (type === 'warning') {
      iconName = 'alert-triangle';
      iconBg = 'rgba(245,158,11,0.18)'; iconColor = '#fbbf24'; iconBorder = 'rgba(245,158,11,0.35)';
    }

    if (iconEl) {
      iconEl.style.background = iconBg;
      iconEl.style.color = iconColor;
      iconEl.style.borderColor = iconBorder;
      iconEl.innerHTML = `<i data-lucide="${iconName}"></i>`;
    }

    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      if (isDanger || type === 'error') {
        confirmBtn.style.background = 'rgba(239, 68, 68, 0.85)';
        confirmBtn.style.borderColor = 'rgba(239, 68, 68, 1)';
      } else {
        confirmBtn.style.background = '';
        confirmBtn.style.borderColor = '';
      }
    }

    if (cancelBtn) {
      cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
      cancelBtn.textContent = cancelText;
    }

    refreshIcons(modal);
    modal.classList.add('open');

    const cleanup = () => {
      modal.classList.remove('open');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
    };

    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
  });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  syncAllTimelinesToFirstWeek();
  checkAndArchiveCompletedCard();
  initUI();
  setupEventListeners();
  renderAll();
  // Prefetch leaderboard in background so it's instant on tab open
  prefetchLeaderboard();
  // Init video guides admin state immediately after appState is loaded
  initVideoGuides();
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
      setTimeout(() => {
        showModal({
          title: "Card Automatically Archived",
          subtitle: "New Cycle Started",
          message: "Your previous card timeframe ended and was automatically archived to history. Welcome to your new card!",
          type: "info",
          showCancel: false,
          confirmText: "Get Started"
        });
      }, 500);
    } else {
      const newTimeline = calculateCardTimeline(today);
      resizeStateForNewTimeline(newTimeline.startStr);
      saveState();
    }
  }
}

// Date logic helpers for dynamic card timelines
function getFirstSunday(year, monthIndex) {
  let date = new Date(year, monthIndex, 1);
  let dayOfWeek = date.getDay();
  let daysToFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  date.setDate(1 + daysToFirstSunday);
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

  let currentMonth1stSunday = getFirstSunday(year, month);
  let startOfCurrentMonthCard = new Date(currentMonth1stSunday);
  startOfCurrentMonthCard.setDate(startOfCurrentMonthCard.getDate() + 1);

  let startMonth, startYear;
  if (d < startOfCurrentMonthCard) {
    if (month === 0) { startMonth = 11; startYear = year - 1; }
    else { startMonth = month - 1; startYear = year; }
  } else {
    startMonth = month; startYear = year;
  }

  const startCard1stSunday = getFirstSunday(startYear, startMonth);
  const cardStart = new Date(startCard1stSunday);
  cardStart.setDate(cardStart.getDate() + 1);

  let endMonth = startMonth === 11 ? 0 : startMonth + 1;
  let endYear = startMonth === 11 ? startYear + 1 : startYear;
  const cardEnd = getFirstSunday(endYear, endMonth);

  const diffTime = Math.abs(cardEnd - cardStart);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const startStr = toLocalISOString(cardStart);
  const dates = [];
  for (let i = 0; i < diffDays; i++) {
    dates.push(addDays(startStr, i));
  }
  return {
    startStr: startStr,
    endStr: toLocalISOString(cardEnd),
    totalDays: diffDays,
    totalWeeks: diffDays / 7,
    dates: dates
  };
}

function hasDayData(d) {
  if (!d) return false;
  return d.wakingTime || (d.morningChapters + d.laterChapters) > 0 || d.fidJournaling || d.prayer10mins || d.cbResolved || d.openObservation || d.openPrinciples || d.prayerTopic || d.scriptureMemorized;
}

function syncAllTimelinesToFirstWeek() {
  const masterLogPool = new Map(); // dateStr => dayObj
  const cardMetadataByTimeline = new Map(); // timelineStartStr => { cardId, instanceId, ... }

  // Helper to process a card's days and harvest logs
  function harvestCard(cardObj, isSaved) {
    if (!cardObj || !cardObj.days || !Array.isArray(cardObj.days)) return;
    const commDate = cardObj.commencingDate || appState.commencingDate;
    if (!commDate) return;
    
    const cId = cardObj.cardId || cardObj.currentCardId || appState.currentCardId || 1;
    
    // Check what the target timeline would be for this commencingDate
    const targetTimeline = calculateCardTimeline(commDate);
    if (!cardMetadataByTimeline.has(targetTimeline.startStr)) {
      cardMetadataByTimeline.set(targetTimeline.startStr, {
        cardId: cId,
        instanceId: cardObj.instanceId || `card_${cId}_${targetTimeline.startStr}`,
        totalScore: cardObj.totalScore || 0,
        totalLaxity: cardObj.totalLaxity || 0,
        savedAt: cardObj.savedAt || new Date().toISOString(),
        weeks: cardObj.weeks || []
      });
    }

    cardObj.days.forEach((day, idx) => {
      // If day doesn't have an explicit calendar date, calculate it from commDate
      const dayDate = day.date || addDays(commDate, idx);
      day.date = dayDate; // Stamp it
      
      // If this day has logged data, harvest it
      if (hasDayData(day)) {
        // If multiple cards have logs for the same date, prefer the one with more reading/data
        if (!masterLogPool.has(dayDate)) {
          masterLogPool.set(dayDate, JSON.parse(JSON.stringify(day)));
        } else {
          const existing = masterLogPool.get(dayDate);
          if ((day.morningChapters + day.laterChapters) > (existing.morningChapters + existing.laterChapters)) {
            masterLogPool.set(dayDate, JSON.parse(JSON.stringify(day)));
          }
        }
      }
    });
  }

  // Harvest from saved cards first, then active card (so active card takes precedence if duplicate date)
  if (appState.savedCards && Array.isArray(appState.savedCards)) {
    appState.savedCards.forEach(c => harvestCard(c, true));
  }
  harvestCard(appState, false);

  // If we found no logs at all, just ensure active card is aligned to first week and return
  if (masterLogPool.size === 0 && appState.commencingDate) {
    const activeTimeline = calculateCardTimeline(appState.commencingDate);
    if (appState.commencingDate !== activeTimeline.startStr) {
      resizeStateForNewTimeline(activeTimeline.startStr);
      saveState();
    }
    return;
  }

  // Group harvested logs by their target First-Sunday timeline
  const timelineGroups = new Map(); // timelineStartStr => { timeline, logs: Map(dateStr => dayObj) }

  masterLogPool.forEach((dayObj, dateStr) => {
    const timeline = calculateCardTimeline(dateStr);
    if (!timelineGroups.has(timeline.startStr)) {
      timelineGroups.set(timeline.startStr, {
        timeline: timeline,
        logs: new Map()
      });
    }
    timelineGroups.get(timeline.startStr).logs.set(dateStr, dayObj);
  });

  // Also make sure we have a group for the currently active card's target timeline even if it has no logs yet
  if (appState.commencingDate) {
    const activeTime = calculateCardTimeline(appState.commencingDate);
    if (!timelineGroups.has(activeTime.startStr)) {
      timelineGroups.set(activeTime.startStr, {
        timeline: activeTime,
        logs: new Map()
      });
    }
  }

  // Sort timeline start dates chronologically
  const sortedStartStrs = Array.from(timelineGroups.keys()).sort();

  // Assign cardIds sequentially or preserve existing metadata
  let nextCardId = 1;
  const newSavedCards = [];
  let newActiveState = null;

  const currentActiveTarget = appState.commencingDate ? calculateCardTimeline(appState.commencingDate).startStr : null;
  
  const savedCardIds = new Set();
  const savedStartStrs = new Set();
  if (appState.savedCards && Array.isArray(appState.savedCards)) {
    appState.savedCards.forEach(c => {
      if (c.commencingDate) savedStartStrs.add(calculateCardTimeline(c.commencingDate).startStr);
      if (c.cardId || c.currentCardId) savedCardIds.add(c.cardId || c.currentCardId);
    });
  }

  sortedStartStrs.forEach((startStr) => {
    const group = timelineGroups.get(startStr);
    const meta = cardMetadataByTimeline.get(startStr) || {};
    
    const assignedCardId = meta.cardId || (nextCardId++);
    if (assignedCardId >= nextCardId) nextCardId = assignedCardId + 1;

    // Build the 28 (or 35) days for this card timeline
    const totalDays = group.timeline.totalDays || 28;
    const daysArr = [];
    for (let i = 0; i < totalDays; i++) {
      const dStr = addDays(startStr, i);
      if (group.logs.has(dStr)) {
        const loggedDay = group.logs.get(dStr);
        loggedDay.dayNumber = i + 1;
        loggedDay.date = dStr;
        daysArr.push(loggedDay);
      } else {
        daysArr.push({
          dayNumber: i + 1,
          date: dStr,
          wakingTime: "",
          studyMethod: "FID",
          morningChapters: 0,
          laterChapters: 0,
          fidFocus: "",
          fidInsight: "",
          fidDoing: "",
          openObservation: "",
          openPrinciples: "",
          openExperience: "",
          openNeed: "",
          personsPersonal: "",
          personsEnglish: "",
          personsReferences: "",
          personsSatan: "",
          personsObedience: "",
          personsNote: "",
          personsStirring: "",
          fidJournaling: false,
          scriptureMemorized: "",
          prayerTopic: "",
          prayer10mins: false,
          cbResolved: false
        });
      }
    }

    // Build weeks array
    const totalWeeks = totalDays / 7;
    let weeksArr = meta.weeks ? JSON.parse(JSON.stringify(meta.weeks)) : [];
    while (weeksArr.length < totalWeeks) {
      weeksArr.push({
        weekNumber: weeksArr.length + 1,
        peMeeting: false,
        memoryValidity: false,
        orderly: false,
        promotedCbr: false
      });
    }
    if (weeksArr.length > totalWeeks) {
      weeksArr = weeksArr.slice(0, totalWeeks);
    }

    const cardObj = {
      instanceId: meta.instanceId || `card_${assignedCardId}_${startStr}`,
      currentCardId: assignedCardId,
      cardId: assignedCardId,
      commencingDate: startStr,
      username: appState.username,
      contact: appState.contact,
      church: appState.church,
      weaknesses: JSON.parse(JSON.stringify(appState.weaknesses || [{name:"",action:""},{name:"",action:""},{name:"",action:""}])),
      days: daysArr,
      weeks: weeksArr,
      totalScore: meta.totalScore || 0,
      totalLaxity: meta.totalLaxity || 0,
      savedAt: meta.savedAt || new Date().toISOString()
    };

    const stats = calculateScores(cardObj);
    cardObj.totalScore = stats.totalScore;
    cardObj.totalLaxity = stats.totalLaxity;
    
    // Determine if this should be the active card
    if (startStr === currentActiveTarget || (assignedCardId === appState.currentCardId && !newActiveState)) {
      newActiveState = cardObj;
    }
    
    // Determine if this should be in the archives
    if (savedStartStrs.has(startStr) || savedCardIds.has(assignedCardId) || startStr !== currentActiveTarget || !newActiveState || cardObj !== newActiveState) {
      newSavedCards.push(cardObj);
    }
  });

  if (!newActiveState && newSavedCards.length > 0) {
    newActiveState = newSavedCards[newSavedCards.length - 1];
  }

  if (newActiveState) {
    appState.currentCardId = newActiveState.cardId;
    appState.activeInstanceId = newActiveState.instanceId;
    appState.commencingDate = newActiveState.commencingDate;
    appState.days = newActiveState.days;
    appState.weeks = newActiveState.weeks;
    if (newActiveState.weaknesses) appState.weaknesses = newActiveState.weaknesses;
  }

  appState.savedCards = newSavedCards;

  // Sync all saved cards to backend DB
  if (appState.savedCards.length > 0) {
    appState.savedCards.forEach(card => {
      fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      }).catch(e => console.error("Failed to sync dynamic archive to DB", e));
    });
  }

  saveState();
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
        if (d.studyMethod === undefined) d.studyMethod = "FID";
        if (d.openObservation === undefined) d.openObservation = "";
        if (d.openPrinciples === undefined) d.openPrinciples = "";
        if (d.openExperience === undefined) d.openExperience = "";
        if (d.openNeed === undefined) d.openNeed = "";
        if (d.personsPersonal === undefined) d.personsPersonal = "";
        if (d.personsEnglish === undefined) d.personsEnglish = "";
        if (d.personsReferences === undefined) d.personsReferences = "";
        if (d.personsSatan === undefined) d.personsSatan = "";
        if (d.personsObedience === undefined) d.personsObedience = "";
        if (d.personsNote === undefined) d.personsNote = "";
        if (d.personsStirring === undefined) d.personsStirring = "";
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

function syncActiveCardToArchiveIfNeeded() {
  if (!appState || !appState.savedCards || isViewingHistory) return;
  const cId = appState.currentCardId;
  const existingIdx = appState.savedCards.findIndex(c => (c.currentCardId || c.cardId) === cId);
  if (existingIdx >= 0) {
    const stats = calculateScores();
    const syncedArchive = {
      instanceId: `card_${cId}`,
      currentCardId: cId,
      cardId: cId,
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
    appState.savedCards[existingIdx] = syncedArchive;
    fetch('/api/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncedArchive)
    }).catch(e => console.error("Failed to sync archive", e));
  }
}

// Save state to Backend
function saveState() {
  if (isViewingHistory) return;
  syncActiveCardToArchiveIfNeeded();
  fetch('/api/save_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appState)
  }).catch(e => console.error("Failed to save state", e));
}

// Old duplicate resizeStateForNewTimeline removed (replaced by newer version below)

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
  const d = isViewingHistory ? historicalCardData : appState;
  if (d && !d.currentCardId) d.currentCardId = d.cardId || 1;
  return d;
}

// Initialize static UI components like Bible Books drop-downs, sidebar data, etc.
function initUI() {
  const data = getActiveData();

  // Theme setup
  if (appState.theme === 'light') {
    document.body.classList.add('light-mode');
    elements.themeToggle.innerHTML = '<i data-lucide="moon"></i>';
  } else {
    document.body.classList.remove('light-mode');
    elements.themeToggle.innerHTML = '<i data-lucide="sun"></i>';
  }
  refreshIcons(elements.themeToggle);

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
  if (elements.topbarProfileBtn) {
    elements.topbarProfileBtn.addEventListener('click', () => {
      const accountTabBtn = document.querySelector('.tab-btn[data-tab="tab-account"]');
      if (accountTabBtn) accountTabBtn.click();
      const profileSubtabBtn = document.querySelector('.subnav-btn[data-subtab="tab-profile"]');
      if (profileSubtabBtn) profileSubtabBtn.click();
    });
  }

  if (elements.btnProfileSave) {
    elements.btnProfileSave.addEventListener('click', () => {
      if (isViewingHistory) return;
      appState.username = elements.profileInputUsername.value;
      appState.contact = elements.profileInputContact.value;
      appState.church = elements.profileInputChurch.value;
      if (elements.usernameInput) elements.usernameInput.value = appState.username;
      if (elements.contactInput) elements.contactInput.value = appState.contact;
      if (elements.churchInput) elements.churchInput.value = appState.church;
      saveState();
      renderProfile();
      if (elements.profileSaveMsg) {
        elements.profileSaveMsg.style.display = 'block';
        setTimeout(() => { elements.profileSaveMsg.style.display = 'none'; }, 3000);
      }
    });
  }

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

  elements.cardSelector.addEventListener('change', async () => {
    if (isViewingHistory) return;
    
    const newCardId = parseInt(elements.cardSelector.value, 10);
    const oldCardId = appState.currentCardId;
    
    if (newCardId === oldCardId) return;

    // 1. Archive current card if needed (silently saves progress)
    autoArchiveIfNeeded();
    
    // 2. Load existing save for new card OR reset it fresh
    await loadOrResetBoardForNewCard(newCardId);
    
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
    elements.themeToggle.innerHTML = isLight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
    refreshIcons(elements.themeToggle);
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
      
      if (target === 'tab-leaderboard') {
        fetchLeaderboard();
      }
      if (target === 'tab-session-eval') {
        initSessionEval();
      }
      
      // On mobile, automatically close sidebar after making a selection
      if (window.innerWidth <= 900) {
        if (typeof window.closeSidebar === 'function') {
          window.closeSidebar();
        } else if (elements.sidebarSection && elements.sidebarSection.classList.contains('open')) {
          elements.sidebarSection.classList.remove('open');
          if (elements.mobileSidebarOverlay) elements.mobileSidebarOverlay.classList.remove('open');
          if (elements.hamburgerBtn) elements.hamburgerBtn.classList.remove('open');
        }
      }
    });
  });

  // Subnav Tabs Handler
  document.querySelectorAll('.subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subtab;
      const parentTab = btn.closest('.tab-content');
      if (!parentTab) return;
      parentTab.querySelectorAll('.subnav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      parentTab.querySelectorAll('.subtab-content').forEach(c => {
        if (c.id === target) c.classList.add('active');
        else c.classList.remove('active');
      });
    });
  });

  // (Mobile sidebar toggle is handled globally in index.html to prevent duplicate click events)

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

  // Study method toggle handler
  if (elements.inputStudyMethod) {
    elements.inputStudyMethod.addEventListener('change', () => {
      const method = elements.inputStudyMethod.value;
      if (elements.fidFields) elements.fidFields.style.display = method === 'FID' ? 'flex' : 'none';
      if (elements.openFields) elements.openFields.style.display = method === 'OPEN' ? 'flex' : 'none';
      if (elements.personsFields) elements.personsFields.style.display = method === 'PERSONS' ? 'flex' : 'none';
    });
  }

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

  // Custom Week Dropdown logic
  if (elements.cwdTrigger && elements.cwdList) {
    // Toggle open/close
    elements.cwdTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = elements.cwdList.classList.toggle('open');
      elements.cwdTrigger.classList.toggle('open', isOpen);
      elements.cwdTrigger.setAttribute('aria-expanded', isOpen);
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
      elements.cwdList.classList.remove('open');
      elements.cwdTrigger.classList.remove('open');
      elements.cwdTrigger.setAttribute('aria-expanded', 'false');
    });

    // Keep native select in sync for any legacy code referencing it
    elements.weekSelectChart.addEventListener('change', () => {
      currentWeekForChart = parseInt(elements.weekSelectChart.value, 10);
      renderChart();
    });
  }

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
  elements.inputStudyMethod.value = dayData.studyMethod || "FID";
  
  // Update UI for study method
  const method = elements.inputStudyMethod.value;
  if (elements.fidFields) elements.fidFields.style.display = method === 'FID' ? 'flex' : 'none';
  if (elements.openFields) elements.openFields.style.display = method === 'OPEN' ? 'flex' : 'none';
  if (elements.personsFields) elements.personsFields.style.display = method === 'PERSONS' ? 'flex' : 'none';
  
  elements.inputFidFocus.value = dayData.fidFocus || "";
  elements.inputFidInsight.value = dayData.fidInsight || "";
  elements.inputFidDoing.value = dayData.fidDoing || "";
  
  if (elements.inputOpenObservation) elements.inputOpenObservation.value = dayData.openObservation || "";
  if (elements.inputOpenPrinciples) elements.inputOpenPrinciples.value = dayData.openPrinciples || "";
  if (elements.inputOpenExperience) elements.inputOpenExperience.value = dayData.openExperience || "";
  if (elements.inputOpenNeed) elements.inputOpenNeed.value = dayData.openNeed || "";
  
  if (elements.inputPersonsPersonal) elements.inputPersonsPersonal.value = dayData.personsPersonal || "";
  if (elements.inputPersonsEnglish) elements.inputPersonsEnglish.value = dayData.personsEnglish || "";
  if (elements.inputPersonsReferences) elements.inputPersonsReferences.value = dayData.personsReferences || "";
  if (elements.inputPersonsSatan) elements.inputPersonsSatan.value = dayData.personsSatan || "";
  if (elements.inputPersonsObedience) elements.inputPersonsObedience.value = dayData.personsObedience || "";
  if (elements.inputPersonsNote) elements.inputPersonsNote.value = dayData.personsNote || "";
  if (elements.inputPersonsStirring) elements.inputPersonsStirring.value = dayData.personsStirring || "";
  
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
  dayData.studyMethod = elements.inputStudyMethod.value;
  dayData.fidFocus = elements.inputFidFocus.value;
  dayData.fidInsight = elements.inputFidInsight.value;
  dayData.fidDoing = elements.inputFidDoing.value;
  
  dayData.openObservation = elements.inputOpenObservation ? elements.inputOpenObservation.value : "";
  dayData.openPrinciples = elements.inputOpenPrinciples ? elements.inputOpenPrinciples.value : "";
  dayData.openExperience = elements.inputOpenExperience ? elements.inputOpenExperience.value : "";
  dayData.openNeed = elements.inputOpenNeed ? elements.inputOpenNeed.value : "";
  
  dayData.personsPersonal = elements.inputPersonsPersonal ? elements.inputPersonsPersonal.value : "";
  dayData.personsEnglish = elements.inputPersonsEnglish ? elements.inputPersonsEnglish.value : "";
  dayData.personsReferences = elements.inputPersonsReferences ? elements.inputPersonsReferences.value : "";
  dayData.personsSatan = elements.inputPersonsSatan ? elements.inputPersonsSatan.value : "";
  dayData.personsObedience = elements.inputPersonsObedience ? elements.inputPersonsObedience.value : "";
  dayData.personsNote = elements.inputPersonsNote ? elements.inputPersonsNote.value : "";
  dayData.personsStirring = elements.inputPersonsStirring ? elements.inputPersonsStirring.value : "";
  
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

// RENDER TODAY AT A GLANCE TAB
function renderToday() {
  const todayEl = document.getElementById('tab-today');
  if (!todayEl) return;
  const data = getActiveData();
  if (!data) return;
  const card = CBR_DATA.cards.find(c => c.cardId === data.currentCardId) || CBR_DATA.cards[0];

  // Calculate today's day number
  const todayStr = new Date().toISOString().split('T')[0];
  let dayNum = 1;
  if (data.commencingDate) {
    const diffTime = new Date(todayStr) - new Date(data.commencingDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 28) {
      dayNum = diffDays + 1;
    } else if (diffDays >= 28) {
      dayNum = 28;
    }
  }

  const dayData = (data.days || []).find(d => d.dayNumber === dayNum) || {};

  // Update Heading
  const dateHeading = document.getElementById('today-date-heading');
  if (dateHeading) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateHeading.innerText = new Date().toLocaleDateString('en-US', options);
  }

  const cycleSub = document.getElementById('today-cycle-sub');
  if (cycleSub) {
    const weekNum = Math.ceil(dayNum / 7);
    cycleSub.innerText = `Day ${dayNum} of 28 • Week ${weekNum} • Active Card #${card.cardId}`;
  }

  // Targets
  const readingTarget = document.getElementById('today-reading-target');
  if (readingTarget) readingTarget.innerText = `Target: ${card.chaptersTarget} Chapter${card.chaptersTarget > 1 ? 's' : ''}`;

  const wakingTarget = document.getElementById('today-waking-target');
  if (wakingTarget) wakingTarget.innerText = `Limit: ${card.ertTarget}`;

  // Journal method
  const journalTitle = document.getElementById('today-journal-method-title');
  if (journalTitle) {
    journalTitle.innerText = card.cardId >= 4 ? '2. Bible Study (OPEN)' : '2. Devotional Journaling (FID)';
  }

  // Psalm verse
  const psalmVerse = document.getElementById('today-psalm-verse');
  if (psalmVerse) {
    psalmVerse.innerText = `Psalm 119:${dayNum}`;
  }

  // Statuses
  const totalChaptersRead = (dayData.morningChapters || 0) + (dayData.daytimeChapters || 0);
  const statusReading = document.getElementById('today-status-reading');
  if (statusReading) {
    if (totalChaptersRead >= card.chaptersTarget) {
      statusReading.className = 'act-status completed';
      statusReading.innerText = `✅ Read (${totalChaptersRead} ch)`;
    } else if (totalChaptersRead > 0) {
      statusReading.className = 'act-status partial';
      statusReading.innerText = `🔄 Partial (${totalChaptersRead}/${card.chaptersTarget})`;
    } else {
      statusReading.className = 'act-status pending';
      statusReading.innerText = '📖 Pending Reading';
    }
  }

  const statusJournal = document.getElementById('today-status-journal');
  if (statusJournal) {
    const hasJournal = (dayData.journalNotes && dayData.journalNotes.trim().length > 0) || dayData.fidFocus || dayData.openObservation;
    if (hasJournal) {
      statusJournal.className = 'act-status completed';
      statusJournal.innerText = '✅ Recorded';
    } else {
      statusJournal.className = 'act-status pending';
      statusJournal.innerText = '✍️ No Entry Yet';
    }
  }

  const statusWaking = document.getElementById('today-status-waking');
  if (statusWaking) {
    if (dayData.wakingTime) {
      const isLate = (dayData.wakingTime > card.ertTarget);
      statusWaking.className = isLate ? 'act-status late' : 'act-status completed';
      statusWaking.innerText = isLate ? `⚠️ Late (${dayData.wakingTime})` : `⏰ On Time (${dayData.wakingTime})`;
    } else {
      statusWaking.className = 'act-status pending';
      statusWaking.innerText = '⏰ Time Not Logged';
    }
  }

  const statusBarriers = document.getElementById('today-status-barriers');
  if (statusBarriers) {
    if (dayData.cbId) {
      statusBarriers.className = 'act-status late';
      statusBarriers.innerText = `⚠️ Recorded (${dayData.cbId})`;
    } else {
      statusBarriers.className = 'act-status clear';
      statusBarriers.innerText = '🟢 Clear';
    }
  }

  // Populate Filled Details Box 1: Scripture Reading
  const detReading = document.getElementById('today-details-reading');
  if (detReading) {
    if (dayData.bibleBook && ((dayData.morningChapters || 0) > 0 || (dayData.laterChapters || 0) > 0)) {
      detReading.style.display = 'block';
      detReading.innerHTML = `<strong style="color:var(--primary);">📖 Book:</strong> ${dayData.bibleBook} ${dayData.startChapter ? `(Ch ${dayData.startChapter}${dayData.endChapter && dayData.endChapter != dayData.startChapter ? `-${dayData.endChapter}` : ''})` : ''}<br>
      <strong style="color:#34d399;">☀️ Morning:</strong> ${dayData.morningChapters || 0} ch &nbsp;&bull;&nbsp; <strong style="color:#94a3b8;">🌙 Later:</strong> ${dayData.laterChapters || 0} ch`;
    } else {
      detReading.style.display = 'none';
    }
  }

  // Populate Filled Details Box 2: Devotional Journaling
  const detJournal = document.getElementById('today-details-journal');
  if (detJournal) {
    const hasFid = dayData.fidFocus || dayData.fidInsight || dayData.fidDoing;
    const hasOpen = dayData.openObservation || dayData.openPrinciples || dayData.openExperience || dayData.openNeed;
    if (hasFid || hasOpen || (dayData.journalNotes && dayData.journalNotes.trim().length > 0)) {
      detJournal.style.display = 'block';
      let html = '';
      if (hasFid) {
        if (dayData.fidFocus) html += `<div><strong style="color:#60a5fa;">🎯 Focus:</strong> ${dayData.fidFocus}</div>`;
        if (dayData.fidInsight) html += `<div style="margin-top:0.35rem;"><strong style="color:#fbbf24;">💡 Insight:</strong> ${dayData.fidInsight}</div>`;
        if (dayData.fidDoing) html += `<div style="margin-top:0.35rem;"><strong style="color:#34d399;">🏃 Doing:</strong> ${dayData.fidDoing}</div>`;
      } else if (hasOpen) {
        if (dayData.openObservation) html += `<div><strong style="color:#60a5fa;">👁️ Observation:</strong> ${dayData.openObservation}</div>`;
        if (dayData.openPrinciples) html += `<div style="margin-top:0.35rem;"><strong style="color:#fbbf24;">📜 Principles:</strong> ${dayData.openPrinciples}</div>`;
        if (dayData.openExperience) html += `<div style="margin-top:0.35rem;"><strong style="color:#c084fc;">⚡ Experience:</strong> ${dayData.openExperience}</div>`;
        if (dayData.openNeed) html += `<div style="margin-top:0.35rem;"><strong style="color:#34d399;">🙏 Need:</strong> ${dayData.openNeed}</div>`;
      } else if (dayData.journalNotes) {
        html += `<div><strong style="color:#60a5fa;">📝 Notes:</strong> ${dayData.journalNotes}</div>`;
      }
      detJournal.innerHTML = html;
    } else {
      detJournal.style.display = 'none';
    }
  }

  // Populate Filled Details Box 3: Waking Time
  const detWaking = document.getElementById('today-details-waking');
  if (detWaking) {
    if (dayData.wakingTime) {
      detWaking.style.display = 'block';
      detWaking.innerHTML = `<div><strong style="color:#60a5fa;">⏰ Logged Waking:</strong> ${dayData.wakingTime}</div>`;
    } else {
      detWaking.style.display = 'none';
    }
  }

  // Populate Filled Details Box 4: Consistency Barriers
  const detBarriers = document.getElementById('today-details-barriers');
  if (detBarriers) {
    if (dayData.cbId) {
      detBarriers.style.display = 'block';
      detBarriers.innerHTML = `<div><strong style="color:#f87171;">🚨 Barrier Code:</strong> ${dayData.cbId}</div>
      ${dayData.cbSolution ? `<div style="margin-top:0.35rem;"><strong style="color:#34d399;">💡 Conviction Principle:</strong> ${dayData.cbSolution}</div>` : ''}
      ${dayData.cbScripture ? `<div style="margin-top:0.35rem;"><strong style="color:#60a5fa;">📖 Supporting Verse:</strong> ${dayData.cbScripture}</div>` : ''}`;
    } else {
      detBarriers.style.display = 'none';
    }
  }

  // Populate Filled Details Box 5: Psalm / Memorized Verse
  const detPsalm = document.getElementById('today-details-psalm');
  if (detPsalm) {
    if (dayData.scriptureMemorized) {
      detPsalm.style.display = 'block';
      detPsalm.innerHTML = `<div><strong style="color:#c084fc;">📜 Memorized Scripture:</strong> ${dayData.scriptureMemorized}</div>`;
    } else {
      detPsalm.style.display = 'none';
    }
  }

  // Populate Filled Details Box 6: Prayer / Fellowship
  const detPe = document.getElementById('today-details-pe');
  if (detPe) {
    if (dayData.prayerTopic) {
      detPe.style.display = 'block';
      detPe.innerHTML = `<div><strong style="color:#fbbf24;">🙏 Prayer / Sharing Topic:</strong> ${dayData.prayerTopic}</div>`;
    } else {
      detPe.style.display = 'none';
    }
  }

  // Log Button Click & Label
  const btnTodayLog = document.getElementById('btn-today-log');
  if (btnTodayLog) {
    const hasLogged = ((dayData.morningChapters || 0) + (dayData.daytimeChapters || 0) > 0) ||
                      (dayData.journalNotes && dayData.journalNotes.trim().length > 0) ||
                      dayData.fidFocus || dayData.openObservation ||
                      dayData.wakingTime || dayData.cbId || dayData.prayerTopic;
    if (hasLogged) {
      btnTodayLog.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Edit Today's Entry`;
    } else {
      btnTodayLog.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Log Today's Entry`;
    }
    btnTodayLog.onclick = () => {
      openDayModal(dayNum);
    };
  }
}

// RENDER ALL PAGE COMPONENTS
function renderAll() {
  renderToday();
  renderHeaderAndKPIs();
  renderCalendarGrid();
  renderChart();
  renderScoringTable();
  renderLibraryList();
  renderProfile();
  refreshIcons();
}

function renderProfile() {
  const data = getActiveData();
  if (!data) return;
  const name = data.username || "Trainee";
  const email = data.email || "";
  const pic = data.profilePic || "";

  if (elements.topbarUsername) elements.topbarUsername.innerText = name.split(' ')[0];
  if (pic && elements.topbarAvatarImg) {
    elements.topbarAvatarImg.src = pic;
    elements.topbarAvatarImg.style.display = 'inline-block';
    if (elements.topbarAvatarIcon) elements.topbarAvatarIcon.style.display = 'none';
  }

  // Sidebar footer
  if (elements.sidebarFooterName) elements.sidebarFooterName.textContent = name.split(' ')[0] || 'Profile';
  if (elements.sidebarFooterEmail) elements.sidebarFooterEmail.textContent = email || '—';
  if (elements.sidebarFooterAvatar && pic) {
    elements.sidebarFooterAvatar.innerHTML = `<img src="${pic}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }

  if (elements.profileDisplayName) elements.profileDisplayName.innerText = name;
  if (elements.profileDisplayEmail) elements.profileDisplayEmail.innerText = email;
  if (pic && elements.profileAvatarImg) {
    elements.profileAvatarImg.src = pic;
    elements.profileAvatarImg.style.display = 'block';
    if (elements.profileAvatarFallback) elements.profileAvatarFallback.style.display = 'none';
  } else if (elements.profileAvatarFallback) {
    elements.profileAvatarFallback.innerHTML = name ? name[0].toUpperCase() : '<i data-lucide="user"></i>';
  }

  if (elements.profileInputUsername) elements.profileInputUsername.value = name;
  if (elements.profileInputContact) elements.profileInputContact.value = data.contact || "";
  if (elements.profileInputChurch) elements.profileInputChurch.value = data.church || "";
  if (elements.profileCardNum) elements.profileCardNum.innerText = `Card #${data.currentCardId || 1}`;
  if (elements.profileCommenceDate) elements.profileCommenceDate.innerText = data.commencingDate || "—";

  const daysList = data.days || [];
  const completedDays = daysList.filter(d => d.wakingTime || (d.morningChapters + d.laterChapters) > 0).length;
  const totalChapters = daysList.reduce((acc, d) => acc + (d.morningChapters || 0) + (d.laterChapters || 0), 0);
  const resolvedBarriers = daysList.filter(d => d.cbResolved).length;
  const stats = calculateScores();

  if (elements.milestoneDays) elements.milestoneDays.innerText = completedDays;
  if (elements.milestonePoints) elements.milestonePoints.innerText = stats ? stats.totalScore : 0;
  if (elements.milestoneChapters) elements.milestoneChapters.innerText = totalChapters;
  if (elements.milestoneBarriers) elements.milestoneBarriers.innerText = resolvedBarriers;
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
    headerRow.innerHTML = '<th>CBR Discipline Description</th>';
    for (let w = 1; w <= stats.weeks.length; w++) {
      headerRow.innerHTML += `<th class="text-center" style="width: 12%;">Week ${w}</th>`;
    }
    headerRow.innerHTML += '<th class="text-right" style="width: 15%;">Total Score</th>';
  }
  
  const disciplines = [
    { name: 'Perseverance (Chapters Read)', key: 'perseverance', max: 3, desc: 'Read ALL set chapters each day' },
    { name: 'Commitment (Early Rising)', key: 'commitment', max: 2, desc: 'Woke up at set ERT each day' },
    { name: 'Prayerfulness (CBR Prayer)', key: 'prayer', max: 2, desc: 'Prayed 10 mins after CBR each day' },
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

function renderSavedCardsCarousel() {
  const sliderSection = document.getElementById('saved-cards-slider-section');
  const carousel = document.getElementById('saved-cards-carousel');
  if (!sliderSection || !carousel) return;

  if (!appState.savedCards || appState.savedCards.length === 0) {
    sliderSection.style.display = 'none';
    carousel.innerHTML = '';
    return;
  }

  sliderSection.style.display = 'block';
  carousel.innerHTML = '';

  // Sort newest first
  const sorted = [...appState.savedCards].reverse();

  sorted.forEach(card => {
    const totalWeeks = card.weeks ? card.weeks.length : 4;
    const maxScore = totalWeeks * 10;
    const pct = Math.round((card.totalScore / maxScore) * 100);
    const scoreColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning, #f59e0b)' : 'var(--danger)';
    
    const cardId = card.cardId || card.currentCardId || 1;
    const isActive = (cardId === appState.currentCardId && !isViewingHistory);

    const tile = document.createElement('div');
    tile.className = `saved-card-tile${isActive ? ' is-active-card' : ''}`;
    tile.innerHTML = `
      <div>
        <div class="saved-card-tile-top">
          <span class="saved-card-level">Card ${cardId}</span>
          <span class="saved-card-badge">${isActive ? 'Active Now' : 'Restore'}</span>
        </div>
        <div class="saved-card-date">Started: ${card.commencingDate || '—'}</div>
      </div>
      <div>
        <div class="saved-card-stats">
          <span>Score: <strong style="color:${scoreColor};">${card.totalScore}</strong>/${maxScore}</span>
          <span>Laxity: <strong style="color:var(--danger);">${card.totalLaxity}</strong></span>
        </div>
        <div class="saved-card-action-hint">
          <span>${isActive ? 'Currently Active' : 'Click to Resume'}</span>
          ${isActive ? '' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>'}
        </div>
      </div>
    `;

    tile.addEventListener('click', () => restoreArchivedToActive(card.instanceId));
    carousel.appendChild(tile);
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

function hasAnyDataLogged() {
  if (!appState || !appState.days) return false;
  return appState.days.some(d => d.wakingTime || (d.morningChapters + d.laterChapters) > 0 || d.fidJournaling || d.prayer10mins || d.cbResolved);
}

// ------------------------------------------------------------------------------
// RESIZING STATE FOR TIMELINE SHIFTS
// ------------------------------------------------------------------------------
function createEmptyDay(dayNum, dateStr) {
  return {
    dayNumber: dayNum,
    date: dateStr,
    wakingTime: "",
    studyMethod: "FID",
    morningChapters: 0,
    laterChapters: 0,
    fidFocus: "",
    fidInsight: "",
    fidDoing: "",
    openObservation: "",
    openPrinciples: "",
    openExperience: "",
    openNeed: "",
    personsPersonal: "",
    personsEnglish: "",
    personsReferences: "",
    personsSatan: "",
    personsObedience: "",
    personsNote: "",
    personsStirring: "",
    fidJournaling: false,
    scriptureMemorized: "",
    prayerTopic: "",
    prayer10mins: false,
    cbResolved: false
  };
}

function createEmptyWeek(weekNum) {
  return {
    weekNumber: weekNum,
    peMeeting: false,
    memoryValidity: false,
    orderly: false,
    promotedCbr: false
  };
}

function resizeStateForNewTimeline(newStartStr) {
  const newTimeline = calculateCardTimeline(newStartStr);
  const oldDays = appState.days || [];
  const newDays = [];
  
  for (let i = 0; i < newTimeline.dates.length; i++) {
    const dStr = newTimeline.dates[i];
    const existing = oldDays.find(d => d.date === dStr);
    if (existing) {
      const copy = JSON.parse(JSON.stringify(existing));
      copy.dayNumber = i + 1;
      newDays.push(copy);
    } else {
      newDays.push(createEmptyDay(i + 1, dStr));
    }
  }
  appState.days = newDays;
  
  const newWeeksCount = Math.ceil(newTimeline.dates.length / 7);
  const oldWeeks = appState.weeks || [];
  const newWeeks = [];
  for (let w = 1; w <= newWeeksCount; w++) {
    const exW = oldWeeks.find(wk => (wk.weekNumber || wk.weekNum) === w);
    if (exW) {
      const copyW = JSON.parse(JSON.stringify(exW));
      copyW.weekNumber = w;
      newWeeks.push(copyW);
    } else {
      newWeeks.push(createEmptyWeek(w));
    }
  }
  appState.weeks = newWeeks;
  appState.commencingDate = newStartStr;
}

function resetActiveBoardForNewCard(newCardId) {
  const today = new Date().toISOString().split('T')[0];
  const timeline = calculateCardTimeline(today);
  
  appState.currentCardId = newCardId;
  appState.activeInstanceId = `card_${newCardId}_${today}_${Date.now()}`;
  appState.commencingDate = timeline.startStr;
  appState.days = [];
  appState.weeks = [];
  
  for (let i = 0; i < timeline.dates.length; i++) {
    appState.days.push(createEmptyDay(i + 1, timeline.dates[i]));
  }
  
  const totalWeeks = Math.ceil(timeline.dates.length / 7);
  for (let w = 1; w <= totalWeeks; w++) {
    appState.weeks.push(createEmptyWeek(w));
  }
  
  const preserved = {
    username: appState.username,
    contact: appState.contact,
    church: appState.church,
    weaknesses: JSON.parse(JSON.stringify(appState.weaknesses)),
    savedCards: appState.savedCards,
    theme: appState.theme
  };
  
  resizeStateForNewTimeline(timeline.startStr);
  
  Object.assign(appState, preserved);
  saveState();
}

async function loadOrResetBoardForNewCard(newCardId) {
  // Check if we have a saved version of this card in history (most recent first)
  const existingSave = [...appState.savedCards].reverse().find(c => (c.currentCardId || c.cardId) === newCardId);
  
  if (existingSave) {
    const resume = await showModal({
      title: `Resume Card ${newCardId}?`,
      subtitle: "Previously Saved Session Found",
      message: `You have a previously saved session for Card ${newCardId}. Would you like to resume it? (Click Cancel to start a fresh Card ${newCardId})`,
      type: "info",
      confirmText: "Resume Saved Session",
      cancelText: "Start Fresh"
    });
    if (resume) {
      // Resume the saved state
      appState.currentCardId = newCardId;
      appState.activeInstanceId = existingSave.instanceId;
      appState.commencingDate = existingSave.commencingDate;
      appState.days = JSON.parse(JSON.stringify(existingSave.days || []));
      appState.weeks = JSON.parse(JSON.stringify(existingSave.weeks || []));
      if (existingSave.weaknesses) {
        appState.weaknesses = JSON.parse(JSON.stringify(existingSave.weaknesses));
      }
      syncAllTimelinesToFirstWeek();
      saveState();
      return;
    }
  }
  
  // No saved state or user clicked cancel -> start fresh
  resetActiveBoardForNewCard(newCardId);
}

function autoArchiveIfNeeded() {
  if (hasAnyDataLogged()) {
    archiveActiveCard(true); // silent archive
    return true;
  }
  return false;
}

// Archive active card into local library database
async function archiveActiveCard(silent = false) {
  const stats = calculateScores();
  
  if (!silent) {
    const confirmed = await showModal({
      title: `Archive Card ${appState.currentCardId}?`,
      subtitle: `Score: ${stats.totalScore} pts | Laxity: ${stats.totalLaxity} pts`,
      message: `Are you sure you want to archive your active card (Card ${appState.currentCardId}) to your historical library?`,
      type: "info",
      confirmText: "Archive Card",
      cancelText: "Cancel"
    });
    if (!confirmed) return false;
  }
  
  const cId = appState.currentCardId;
  const instId = appState.activeInstanceId || (`card_${cId}_${appState.commencingDate || Date.now()}`);
  const archiveInstance = {
    instanceId: instId,
    currentCardId: cId,
    cardId: cId,
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
  
  const existingIdx = appState.savedCards.findIndex(c => 
    c.instanceId === instId || 
    ((c.currentCardId || c.cardId) === cId && c.commencingDate === appState.commencingDate)
  );
  if (existingIdx >= 0) {
    archiveInstance.instanceId = appState.savedCards[existingIdx].instanceId;
    appState.savedCards[existingIdx] = archiveInstance;
  } else {
    appState.savedCards.push(archiveInstance);
  }
  
  fetch('/api/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(archiveInstance)
  }).catch(e => console.error("Failed to archive card", e));
  
  saveState();
  
  if (!silent) {
    showToast("Card successfully archived to your library!", "success");
    if (appState.currentCardId < 7) {
      const upgrade = await showModal({
        title: "Upgrade Card?",
        subtitle: `Advance to Card ${appState.currentCardId + 1}`,
        message: `Would you like to upgrade your active card to Card ${appState.currentCardId + 1} and start a fresh round?`,
        type: "info",
        confirmText: `Upgrade to Card ${appState.currentCardId + 1}`,
        cancelText: "Stay on Current"
      });
      if (upgrade) {
        resetActiveBoardForNewCard(appState.currentCardId + 1);
        renderAll();
        return true;
      }
    }
    const reset = await showModal({
      title: "Reset Card Logs?",
      subtitle: "Start New Round",
      message: "Would you like to reset/clear active card logs to start a new round?",
      type: "info",
      confirmText: "Reset Logs",
      cancelText: "Keep Logs"
    });
    if (reset) {
      resetActiveBoardForNewCard(appState.currentCardId);
    }
    renderAll();
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
        // Preserve current theme so the display doesn't flip when importing
        const currentTheme = appState.theme || 'dark';
        
        appState = parsed;
        
        // Restore the theme the user had before importing
        appState.theme = currentTheme;
        
        if (!appState.savedCards) appState.savedCards = [];
        if (!appState.weaknesses) {
          appState.weaknesses = [
            { name: "", action: "" },
            { name: "", action: "" },
            { name: "", action: "" }
          ];
        }
        
        syncAllTimelinesToFirstWeek();
        
        // Sync imported archived cards into the backend database
        if (appState.savedCards && appState.savedCards.length > 0) {
          appState.savedCards.forEach(card => {
            fetch('/api/archive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(card)
            }).catch(e => console.error("Failed to sync imported archive to DB", e));
          });
        }
        
        saveState();
        initUI();
        renderAll();
        showToast("Backup data imported successfully!", "success");
      } else {
        showToast("Invalid backup file structure. Ensure it is a valid CBR backup JSON.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to parse JSON file.", "error");
    }
  };
  fileReader.readAsText(file);
}

// Reset current active card logs
async function resetCurrentCard() {
  const confirmed = await showModal({
    title: "Reset Card Logs?",
    subtitle: "Clear All Progress",
    message: "Are you sure you want to reset all log fields for the active card? This action cannot be undone unless you have archived it or exported a JSON backup.",
    type: "error",
    confirmText: "Yes, Reset Logs",
    cancelText: "Cancel",
    isDanger: true
  });
  if (confirmed) {
    resetActiveCardLogsOnly();
    showToast("Active card logs reset.", "info");
  }
}

// ------------------------------------------------------------------------------
// LEADERBOARD LOGIC
// ----------------------------------------------------------------------
let leaderboardCache = null;   // prefetched data stored here
let leaderboardFetching = false; // prevent duplicate in-flight requests
let lbCurrentFilter = 'cumulative'; // Default filter: cumulative, session, weekly, daily

// Bind filter buttons
document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.lb-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      lbCurrentFilter = targetBtn.dataset.filter;
      
      if (leaderboardCache) {
        const podium = document.getElementById('leaderboard-podium');
        const listWrapper = document.getElementById('leaderboard-list-wrapper');
        const tbody = document.getElementById('leaderboard-tbody');
        renderLeaderboard(leaderboardCache, podium, listWrapper, tbody);
      }
    });
  });
});

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

// ======================================================================
// SESSION EVALUATION LOGIC
// ======================================================================

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




// ═══════════════════════════════════════════════════
//  VIDEO GUIDES MODULE — PREMIUM PLAYER
// ═══════════════════════════════════════════════════

let _allVideoPlayers = []; // track all video elements for global pause

/* SVG icon helpers */
const VG_ICONS = {
  play:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  volHigh: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  volMute: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  expand:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  close:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  trash:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
};

function vgFmt(s) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

/* Build a controls overlay for any video wrapper */
function buildVideoOverlay(videoEl, titleText, isFullscreen) {
  const overlay = document.createElement('div');
  overlay.className = 'vc-overlay';

  // Top fade
  const top = document.createElement('div');
  top.className = 'vc-top-fade';

  // Center big play/pause
  const center = document.createElement('div');
  center.className = 'vc-center';
  const bigPlay = document.createElement('button');
  bigPlay.className = 'vc-big-play';
  bigPlay.innerHTML = `<span class="icon-play">${VG_ICONS.play}</span><span class="icon-pause">${VG_ICONS.pause}</span>`;
  center.appendChild(bigPlay);

  // Bottom bar
  const bottom = document.createElement('div');
  bottom.className = 'vc-bottom-fade';

  // Progress
  const prog = document.createElement('div');
  prog.className = 'vc-progress';
  const fill = document.createElement('div');
  fill.className = 'vc-progress-fill';
  const thumb = document.createElement('div');
  thumb.className = 'vc-progress-thumb';
  fill.appendChild(thumb);
  prog.appendChild(fill);

  // Controls row
  const row = document.createElement('div');
  row.className = 'vc-controls-row';

  // Left: play btn + time
  const left = document.createElement('div');
  left.className = 'vc-left';
  const playBtn = document.createElement('button');
  playBtn.className = 'vc-btn';
  playBtn.innerHTML = VG_ICONS.play;
  const timeEl = document.createElement('span');
  timeEl.className = 'vc-time';
  timeEl.textContent = '0:00 / 0:00';
  left.appendChild(playBtn);
  left.appendChild(timeEl);

  // Right: volume + fullscreen
  const right = document.createElement('div');
  right.className = 'vc-right';

  const volWrap = document.createElement('div');
  volWrap.className = 'vc-volume-wrap';
  const volBtn = document.createElement('button');
  volBtn.className = 'vc-btn';
  volBtn.innerHTML = VG_ICONS.volHigh;
  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.min = 0; volSlider.max = 1; volSlider.step = 0.05; volSlider.value = 1;
  volSlider.className = 'vc-volume-slider';
  volWrap.appendChild(volBtn);
  volWrap.appendChild(volSlider);

  const fsBtn = document.createElement('button');
  fsBtn.className = 'vc-btn';
  fsBtn.title = 'Fullscreen';
  fsBtn.innerHTML = VG_ICONS.expand;

  right.appendChild(volWrap);
  if (!isFullscreen) right.appendChild(fsBtn);

  row.appendChild(left);
  row.appendChild(right);
  bottom.appendChild(prog);
  bottom.appendChild(row);

  overlay.appendChild(top);
  overlay.appendChild(center);
  overlay.appendChild(bottom);

  /* Wire controls to videoEl */
  let scrubbing = false;

  function updateUI() {
    const playing = !videoEl.paused;
    if (playing) {
      bigPlay.classList.add('playing');
      playBtn.innerHTML = VG_ICONS.pause;
      overlay.classList.remove('always-show');
    } else {
      bigPlay.classList.remove('playing');
      playBtn.innerHTML = VG_ICONS.play;
      overlay.classList.add('always-show');
    }
    const pct = videoEl.duration ? (videoEl.currentTime / videoEl.duration) * 100 : 0;
    fill.style.width = pct + '%';
    timeEl.textContent = `${vgFmt(videoEl.currentTime)} / ${vgFmt(videoEl.duration)}`;
  }

  function togglePlay() {
    if (videoEl.paused) {
      _allVideoPlayers.forEach(p => { if (p.videoEl !== videoEl) p.videoEl.pause(); });
      videoEl.play();
    } else {
      videoEl.pause();
    }
  }

  bigPlay.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
  playBtn.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });

  videoEl.addEventListener('play', updateUI);
  videoEl.addEventListener('pause', updateUI);
  videoEl.addEventListener('ended', updateUI);
  videoEl.addEventListener('timeupdate', () => { if (!scrubbing) updateUI(); });
  videoEl.addEventListener('loadedmetadata', updateUI);

  // Scrubber
  prog.addEventListener('mousedown', e => {
    e.stopPropagation();
    scrubbing = true;
    seek(e);
    overlay.classList.add('always-show');
  });
  document.addEventListener('mousemove', e => { if (scrubbing) seek(e); });
  document.addEventListener('mouseup', () => { if (scrubbing) { scrubbing = false; updateUI(); } });
  function seek(e) {
    const rect = prog.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoEl.duration) videoEl.currentTime = pct * videoEl.duration;
    fill.style.width = (pct * 100) + '%';
  }

  // Volume
  volSlider.addEventListener('input', e => {
    e.stopPropagation();
    videoEl.volume = parseFloat(volSlider.value);
    videoEl.muted = videoEl.volume === 0;
    volBtn.innerHTML = videoEl.muted ? VG_ICONS.volMute : VG_ICONS.volHigh;
  });
  volBtn.addEventListener('click', e => {
    e.stopPropagation();
    videoEl.muted = !videoEl.muted;
    volSlider.value = videoEl.muted ? 0 : videoEl.volume;
    volBtn.innerHTML = videoEl.muted ? VG_ICONS.volMute : VG_ICONS.volHigh;
  });

  // Fullscreen button (card only)
  if (!isFullscreen) {
    fsBtn.addEventListener('click', e => {
      e.stopPropagation();
      openVGFullscreen(videoEl, titleText || '');
    });
  }

  // Initially show overlay (paused)
  overlay.classList.add('always-show');
  return overlay;
}

/* Fullscreen Modal */
let _vgfModal = null;
let _vgfSourceVideo = null;

function ensureFullscreenModal() {
  if (_vgfModal) return _vgfModal;

  const modal = document.createElement('div');
  modal.id = 'vg-fullscreen-modal';

  const backdrop = document.createElement('div');
  backdrop.className = 'vgf-backdrop';
  backdrop.addEventListener('click', closeVGFullscreen);

  const content = document.createElement('div');
  content.className = 'vgf-content';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'vgf-close';
  closeBtn.innerHTML = VG_ICONS.close;
  closeBtn.addEventListener('click', closeVGFullscreen);

  const videoWrap = document.createElement('div');
  videoWrap.className = 'vgf-video-wrap';

  const video = document.createElement('video');
  video.id = 'vgf-video';
  video.preload = 'metadata';
  video.setAttribute('playsinline', '');

  const fsOverlay = buildVideoOverlay(video, '', true);
  videoWrap.appendChild(video);
  videoWrap.appendChild(fsOverlay);

  // Click wrapper area to toggle play
  videoWrap.addEventListener('click', e => {
    if (e.target.closest('.vc-btn') || e.target.closest('.vc-big-play') ||
        e.target.closest('.vc-progress') || e.target.closest('.vc-volume-wrap') ||
        e.target === closeBtn) return;
    if (video.paused) video.play(); else video.pause();
  });

  const footer = document.createElement('div');
  footer.className = 'vgf-footer';
  const titleEl = document.createElement('span');
  titleEl.className = 'vgf-title';
  footer.appendChild(titleEl);

  content.appendChild(closeBtn);
  content.appendChild(videoWrap);
  content.appendChild(footer);

  modal.appendChild(backdrop);
  modal.appendChild(content);
  document.body.appendChild(modal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeVGFullscreen();
  });

  video._titleEl = titleEl;
  _vgfModal = modal;
  return modal;
}

function openVGFullscreen(sourceVideo, title) {
  const modal = ensureFullscreenModal();
  const vgfVid = modal.querySelector('#vgf-video');
  if (vgfVid._titleEl) vgfVid._titleEl.textContent = title;

  sourceVideo.pause();
  _vgfSourceVideo = sourceVideo;

  vgfVid.src = sourceVideo.src;
  vgfVid.currentTime = sourceVideo.currentTime;
  vgfVid.volume = sourceVideo.volume;
  vgfVid.muted = sourceVideo.muted;

  modal.classList.add('open');
  vgfVid.play().catch(() => {});
}

function closeVGFullscreen() {
  const modal = document.getElementById('vg-fullscreen-modal');
  if (!modal) return;
  const vgfVid = modal.querySelector('#vgf-video');
  if (_vgfSourceVideo && vgfVid) {
    _vgfSourceVideo.currentTime = vgfVid.currentTime;
    vgfVid.pause();
    vgfVid.src = '';
  }
  modal.classList.remove('open');
  _vgfSourceVideo = null;
}

/* Pause all videos on tab/window leave */
function pauseAllVGVideos() {
  _allVideoPlayers.forEach(p => p.videoEl.pause());
  const modal = document.getElementById('vg-fullscreen-modal');
  if (modal && modal.classList.contains('open')) {
    const v = modal.querySelector('#vgf-video');
    if (v) v.pause();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseAllVGVideos();
});

// Pause when switching away from reference tab
document.querySelectorAll('.tab-btn').forEach(btn => {
  if (btn.dataset.tab !== 'tab-reference') {
    btn.addEventListener('click', pauseAllVGVideos);
  }
});

// Pause when switching away from video guides subtab
document.querySelectorAll('.subnav-btn').forEach(btn => {
  if (btn.dataset.subtab !== 'tab-video-guides') {
    btn.addEventListener('click', pauseAllVGVideos);
  }
});

/* initVideoGuides — called after appState loads */
function initVideoGuides() {
  const uploadZone = document.getElementById('video-upload-zone');
  const fileInput  = document.getElementById('video-file-input');
  const emptyHint  = document.getElementById('video-empty-hint');

  if (appState && appState.isAdmin) {
    if (uploadZone) uploadZone.style.display = 'flex';
    if (emptyHint)  emptyHint.style.display   = 'inline';
  } else {
    if (uploadZone) uploadZone.style.display = 'none';
    if (emptyHint)  emptyHint.style.display   = 'none';
  }

  if (fileInput && !fileInput.dataset.bound) {
    fileInput.dataset.bound = '1';
    fileInput.addEventListener('change', handleVideoFileSelected);
  }

  loadVideoGuides();
}

/* loadVideoGuides */
async function loadVideoGuides() {
  const grid = document.getElementById('video-guides-grid');
  if (!grid) return;
  try {
    const res  = await fetch('/api/videos');
    const data = await res.json();
    renderVideoGuides(data.videos || []);
  } catch (e) {
    console.error('Failed to load video guides', e);
  }
}

/* renderVideoGuides */
function renderVideoGuides(videos) {
  const grid    = document.getElementById('video-guides-grid');
  const emptyEl = document.getElementById('video-guides-empty');
  if (!grid) return;

  const isAdmin = !!(appState && appState.isAdmin);

  // Pause and clear old players
  _allVideoPlayers.forEach(p => p.videoEl.pause());
  _allVideoPlayers = [];
  Array.from(grid.children).forEach(c => { if (c !== emptyEl) grid.removeChild(c); });

  if (!videos || videos.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  videos.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-guide-card';

    const wrapper = document.createElement('div');
    wrapper.className = 'video-guide-wrapper';

    const video = document.createElement('video');
    video.className = 'video-guide-player';
    video.preload   = 'metadata';
    video.src       = v.url;
    video.setAttribute('playsinline', '');

    const overlay = buildVideoOverlay(video, v.title, false);

    // Click wrapper to toggle play (not on control elements)
    wrapper.addEventListener('click', e => {
      if (e.target.closest('.vc-btn') || e.target.closest('.vc-big-play') ||
          e.target.closest('.vc-progress') || e.target.closest('.vc-volume-wrap')) return;
      if (video.paused) {
        _allVideoPlayers.forEach(p => { if (p.videoEl !== video) p.videoEl.pause(); });
        video.play();
      } else {
        video.pause();
      }
    });

    wrapper.appendChild(video);
    wrapper.appendChild(overlay);
    _allVideoPlayers.push({ videoEl: video, overlayEl: overlay });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'video-guide-footer';

    const title = document.createElement('span');
    title.className = 'video-guide-title';
    title.textContent = v.title;
    title.title       = v.title;

    const dur = document.createElement('span');
    dur.className = 'video-guide-duration';
    dur.textContent = '';
    video.addEventListener('loadedmetadata', () => { dur.textContent = vgFmt(video.duration); });

    footer.appendChild(title);
    footer.appendChild(dur);

    if (isAdmin) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-video-delete';
      delBtn.title = 'Delete video';
      delBtn.innerHTML = VG_ICONS.trash;
      delBtn.addEventListener('click', () => handleVideoDelete(v.filename, card));
      footer.appendChild(delBtn);
    }

    card.appendChild(wrapper);
    card.appendChild(footer);
    grid.appendChild(card);
  });
}

/* Upload handler */
function handleVideoFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const progressWrap = document.getElementById('video-upload-progress-wrap');
  const progressBar  = document.getElementById('video-upload-progress-bar');
  const label        = document.getElementById('video-upload-label');

  const formData = new FormData();
  formData.append('video', file);
  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', evt => {
    if (evt.lengthComputable && progressBar)
      progressBar.style.width = Math.round((evt.loaded / evt.total) * 100) + '%';
  });
  xhr.addEventListener('loadstart', () => {
    if (progressWrap) progressWrap.style.display = 'block';
    if (label) label.style.opacity = '0.6';
  });
  xhr.addEventListener('load', () => {
    if (progressWrap) progressWrap.style.display = 'none';
    if (progressBar)  progressBar.style.width    = '0%';
    if (label) label.style.opacity = '1';
    e.target.value = '';
    if (xhr.status === 200) {
      showToast('Video uploaded!', 'success');
      loadVideoGuides();
    } else {
      let msg = 'Upload failed.';
      try { msg = JSON.parse(xhr.responseText).error || msg; } catch(ex) {}
      showToast(msg, 'error');
    }
  });
  xhr.addEventListener('error', () => {
    if (progressWrap) progressWrap.style.display = 'none';
    if (label) label.style.opacity = '1';
    showToast('Upload failed. Please try again.', 'error');
  });
  xhr.open('POST', '/api/videos/upload');
  xhr.send(formData);
}

/* Delete handler */
async function handleVideoDelete(filename, cardEl) {
  const confirmed = await showModal({
    title: 'Delete Video', subtitle: 'This cannot be undone',
    message: 'Are you sure you want to permanently delete "' + filename + '"?',
    type: 'error', isDanger: true, confirmText: 'Delete', cancelText: 'Cancel'
  });
  if (!confirmed) return;
  try {
    const res = await fetch('/api/videos/' + encodeURIComponent(filename), { method: 'DELETE' });
    if (res.ok) {
      showToast('Video deleted.', 'success');
      if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
      const grid = document.getElementById('video-guides-grid');
      if (grid && grid.querySelectorAll('.video-guide-card').length === 0) {
        const emptyEl = document.getElementById('video-guides-empty');
        if (emptyEl) emptyEl.style.display = 'flex';
      }
    } else { showToast('Failed to delete video.', 'error'); }
  } catch(ex) { showToast('Error deleting video.', 'error'); }
}

// Reload video list every time the Reference tab is opened
(function() {
  const refTabBtn = document.querySelector('.tab-btn[data-tab="tab-reference"]');
  if (refTabBtn) {
    refTabBtn.addEventListener('click', () => loadVideoGuides());
  }
})();
