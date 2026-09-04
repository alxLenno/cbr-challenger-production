(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CBRDateUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function parseISODate(dateStr) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    if (!match) throw new Error(`Invalid ISO date: ${dateStr}`);

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const utcDate = new Date(Date.UTC(year, monthIndex, day));

    if (
      utcDate.getUTCFullYear() !== year ||
      utcDate.getUTCMonth() !== monthIndex ||
      utcDate.getUTCDate() !== day
    ) {
      throw new Error(`Invalid ISO date: ${dateStr}`);
    }

    return utcDate;
  }

  function toISODate(date) {
    return date.toISOString().slice(0, 10);
  }

  function addDays(dateStr, days) {
    const date = parseISODate(dateStr);
    date.setUTCDate(date.getUTCDate() + days);
    return toISODate(date);
  }

  function daysBetween(startStr, endStr) {
    return Math.round((parseISODate(endStr) - parseISODate(startStr)) / MS_PER_DAY);
  }

  function getMondayOnOrAfter(dateStr) {
    const date = parseISODate(dateStr);
    const daysToMonday = (8 - date.getUTCDay()) % 7;
    date.setUTCDate(date.getUTCDate() + daysToMonday);
    return toISODate(date);
  }

  function getMondayOnOrBefore(dateStr) {
    const date = parseISODate(dateStr);
    const daysSinceMonday = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - daysSinceMonday);
    return toISODate(date);
  }

  // A calendar month's suggested commencement date is its first Monday. The
  // dashboard itself is always four weeks long; later dashboards continue on
  // the Monday immediately after the preceding dashboard ends.
  function getSessionStart(year, monthIndex) {
    const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
    return getMondayOnOrAfter(toISODate(firstOfMonth));
  }

  function calculateCardTimeline(commencingDateStr) {
    const startStr = getMondayOnOrAfter(commencingDateStr);
    const totalDays = 28;
    const totalWeeks = 4;
    const endStr = addDays(startStr, totalDays - 1);
    const dates = Array.from({ length: totalDays }, (_, index) => addDays(startStr, index));

    return {
      startStr,
      endStr,
      totalDays,
      totalWeeks,
      dates
    };
  }

  // Advance from an existing dashboard's commencement date in complete
  // four-week blocks until the block containing targetDateStr is reached.
  // This keeps transitions continuous even when the app is reopened late.
  function getCycleStartForDate(commencingDateStr, targetDateStr) {
    const firstStartStr = calculateCardTimeline(commencingDateStr).startStr;
    const elapsedDays = daysBetween(firstStartStr, targetDateStr);
    if (elapsedDays < 0) return firstStartStr;
    return addDays(firstStartStr, Math.floor(elapsedDays / 28) * 28);
  }

  function getDayNumberForDate(data, targetDateStr) {
    if (!data || !data.commencingDate) return 1;

    const storedDays = Array.isArray(data.days) ? data.days.length : 0;
    const totalDays = storedDays || calculateCardTimeline(data.commencingDate).totalDays;
    const unclampedDay = daysBetween(data.commencingDate, targetDateStr) + 1;
    return Math.min(Math.max(unclampedDay, 1), totalDays);
  }

  return {
    addDays,
    calculateCardTimeline,
    daysBetween,
    getCycleStartForDate,
    getDayNumberForDate,
    getMondayOnOrAfter,
    getMondayOnOrBefore,
    getSessionStart
  };
});
