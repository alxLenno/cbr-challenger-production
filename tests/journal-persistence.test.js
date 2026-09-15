const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('static/js/app.js', 'utf8');
function setup(method = 'FID') {
  const elements = new Proxy({}, { get(target, key) {
    return target[key] ||= { value: '', checked: false, classList: { contains: () => false } };
  }});
  elements.inputStudyMethod.value = method;
  const paste = { value: '' };
  const day = { dayNumber: 1 };
  const context = vm.createContext({ elements, window: {}, document: { getElementById: () => paste },
    currentEditingDayNum: 1, isViewingHistory: false,
    appState: { days: [day], weeks: [{}], commencingDate: '2026-09-15' },
    addDays: () => '2026-09-15', getLocalISODate: () => '2026-09-15',
    getReadingPassagesFromForm: () => [], saveState() {}, closeModal() {}, renderAll() {}, showToast() {}
  });
  vm.runInContext(source.slice(source.indexOf('function parseJournalSections'), source.indexOf('// RENDER TODAY AT A GLANCE TAB')), context);
  return { context, elements, paste, day };
}
test('FID paste keeps prose containing OPEN words and the selected method', () => {
  const { context, elements, paste, day } = setup();
  paste.value = 'FACT: God calls us to go and do good.\nINSIGHT: I need prayer and experience insight.\nDEED: I will open my heart.';
  context.window.parseQuickPasteJournal();
  assert.equal(elements.inputStudyMethod.value, 'FID');
  assert.equal(elements.inputFidInsight.value, 'I need prayer and experience insight.');
  elements.inputFidDoing.value = 'My corrected action';
  context.saveDayLog();
  assert.equal(day.studyMethod, 'FID');
  assert.equal(day.fidDoing, 'My corrected action');
});
test('typed journal text and notes survive Save verbatim', () => {
  const { context, elements, day } = setup();
  elements.inputFidFocus.value = 'Focus on doing good.\nKeep this second line.';
  elements.inputFidInsight.value = 'I need insight and prayer.';
  elements.inputFidDoing.value = 'Doing good matters.';
  elements.inputJournalNotes.value = 'Additional notes';
  context.saveDayLog();
  assert.equal(day.fidFocus, elements.inputFidFocus.value);
  assert.equal(day.fidInsight, elements.inputFidInsight.value);
  assert.equal(day.fidDoing, elements.inputFidDoing.value);
  assert.equal(day.journalNotes, 'Additional notes');
});
test('direct save imports OPEN without changing method and preserves unmatched text', () => {
  const { context, elements, paste, day } = setup('OPEN');
  paste.value = 'OBSERVATION: Be kind.\nPRINCIPLES: Love.\nEXPERIENCE: Today.\nNEED: Practice.';
  context.saveDayLog();
  assert.equal(day.studyMethod, 'OPEN');
  assert.equal(day.openNeed, 'Practice.');
  paste.value = 'FACT: A note using a different method';
  context.saveDayLog();
  assert.equal(day.studyMethod, 'OPEN');
  assert.equal(day.journalNotes, 'FACT: A note using a different method');
});
test('rendering does not rewrite journal state', () => {
  const { context, day } = setup('OPEN');
  Object.assign(day, { studyMethod: 'OPEN', journalNotes: 'FACT: notes', openObservation: 'Original', fidInsight: 'Insight remains' });
  const original = JSON.stringify(day);
  const today = fs.readFileSync('static/js/tabs/today.js', 'utf8');
  vm.runInContext(today.slice(today.indexOf('function _normalizeDayDataJournal'), today.indexOf('// Helper: Returns current local')), context);
  context._normalizeDayDataJournal(day);
  assert.equal(JSON.stringify(day), original);
});
