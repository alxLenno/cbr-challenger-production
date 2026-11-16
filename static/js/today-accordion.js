// Available before Today content is interactive, independently of verse loading.
// ── Toggle accordion open/close ──────────────────────────────────────────────
function toggleAccord(id) {
  const body    = document.getElementById('today-accord-body-' + id);
  const chevron = document.getElementById('today-chevron-' + id);
  const header  = body ? body.previousElementSibling : null;
  const accord  = body ? body.closest('.today-accord') : null;
  const grid    = accord ? accord.closest('.today-accord-grid') : null;
  if (!body || !chevron) return;

  const isOpen = header?.getAttribute('aria-expanded') === 'true';
  body.style.display    = isOpen ? 'none' : 'block';
  chevron.classList.toggle('open', !isOpen);
  if (accord) accord.classList.toggle('is-open', !isOpen);
  if (grid) grid.classList.toggle('has-open', Boolean(grid.querySelector('.today-accord.is-open')));
  if (header) header.setAttribute('aria-expanded', String(!isOpen));

  if (!isOpen && id === 'memory' && window.currentMemoryRef) {
    if (typeof fetchAndDisplayMemoryVerse === 'function') fetchAndDisplayMemoryVerse(window.currentMemoryRef, window.currentBibleVersion || 'NIV');
  }
  if (!isOpen && id === 'daily' && window.currentDailyRef) {
    if (typeof fetchAndDisplayDailyVerse === 'function') fetchAndDisplayDailyVerse(window.currentDailyRef, 'NIV');
  }
}

// Legacy alias kept for backward compatibility
window.toggleStudyQuestions = function() { toggleAccord('questions'); };
