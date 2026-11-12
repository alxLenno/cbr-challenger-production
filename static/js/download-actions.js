document.addEventListener('DOMContentLoaded', () => {
  // Image downloads share the document-download styling; copy/share stay distinct.
  document.querySelectorAll('#btn-download-verse, #btn-download-daily, [onclick="downloadJournalImage()"], #btn-export').forEach(button => {
    button.classList.add('download-action');
    if (!button.querySelector('svg, i')) {
      button.insertAdjacentHTML('afterbegin', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/></svg>');
    }
  });
});
