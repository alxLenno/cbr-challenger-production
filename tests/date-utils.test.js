const test = require('node:test');
const assert = require('node:assert/strict');

const {
  addDays,
  calculateCardTimeline,
  getCycleStartForDate,
  getDayNumberForDate,
  getMondayOnOrBefore,
  getSessionStart
} = require('../static/js/date-utils.js');

test('a calendar month suggests its first Monday as the commencement date', () => {
  assert.equal(getSessionStart(2022, 7), '2022-08-01');
  assert.equal(getSessionStart(2026, 8), '2026-09-07');
});

test('every dashboard contains exactly four complete Monday-Sunday weeks', () => {
  const august = calculateCardTimeline('2022-08-01');
  assert.deepEqual(
    { start: august.startStr, end: august.endStr, days: august.totalDays, weeks: august.totalWeeks },
    { start: '2022-08-01', end: '2022-08-28', days: 28, weeks: 4 }
  );

  const midweekCommencement = calculateCardTimeline('2026-09-03');
  assert.equal(midweekCommencement.startStr, '2026-09-07');
  assert.equal(midweekCommencement.endStr, '2026-10-04');
});

test('the next dashboard starts on the Monday immediately after week four', () => {
  const current = calculateCardTimeline('2026-08-03');
  const next = calculateCardTimeline(addDays(current.endStr, 1));

  assert.equal(current.endStr, '2026-08-30');
  assert.equal(next.startStr, '2026-08-31');
  assert.equal(next.endStr, '2026-09-27');
});

test('session boundaries work across a year change', () => {
  const december = calculateCardTimeline('2023-12-04');
  assert.equal(december.endStr, '2023-12-31');
  assert.equal(calculateCardTimeline(addDays(december.endStr, 1)).startStr, '2024-01-01');
});

test('late reopening rolls forward by whole four-week dashboards', () => {
  assert.equal(getCycleStartForDate('2026-08-03', '2026-09-05'), '2026-08-31');
  assert.equal(getCycleStartForDate('2026-08-03', '2026-10-01'), '2026-09-28');
  assert.equal(getMondayOnOrBefore('2026-09-05'), '2026-08-31');
});

test('Today is limited to the dashboard\'s 28 days', () => {
  const days = Array.from({ length: 28 }, (_, index) => ({
    dayNumber: index + 1,
    date: addDays('2026-08-03', index)
  }));
  const data = { commencingDate: '2026-08-03', days };

  assert.equal(getDayNumberForDate(data, '2026-08-30'), 28);
  assert.equal(getDayNumberForDate(data, '2026-09-03'), 28);
});
