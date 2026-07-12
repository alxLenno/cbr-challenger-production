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

  if (file.size > 100 * 1024 * 1024) {
    showToast('Warning: Video is over 100MB. Online servers may reject large uploads.', 'warning');
  }

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
      let msg = 'Upload failed (HTTP ' + xhr.status + ').';
      if (xhr.status === 413) {
        msg = 'File is too large for the online server (HTTP 413). Try uploading a smaller video under 50MB-100MB.';
      } else if (xhr.status === 403) {
        msg = 'Permission denied: Admin access required.';
      } else if (xhr.status === 500) {
        msg = 'Server error (HTTP 500). Please check server permissions or storage limits.';
      } else {
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.error) msg = parsed.error;
        } catch(ex) {}
      }
      showToast(msg, 'error');
    }
  });
  xhr.addEventListener('error', () => {
    if (progressWrap) progressWrap.style.display = 'none';
    if (label) label.style.opacity = '1';
    showToast('Network error: Upload failed. Please check your connection.', 'error');
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


/* ─── PDF GUIDES & MANUALS MODULE ────────────────────────────────────────── */
function initPdfGuides() {
  const uploadZone = document.getElementById('pdf-upload-zone');
  const fileInput  = document.getElementById('pdf-file-input');

  if (appState && appState.isAdmin && uploadZone) {
    uploadZone.style.display = 'inline-block';
  }
  if (fileInput) {
    fileInput.addEventListener('change', handlePdfFileSelected);
  }
  loadPdfGuides();
}

async function loadPdfGuides() {
  try {
    const res  = await fetch('/api/pdfs');
    if (!res.ok) return;
    const data = await res.json();
    renderPdfGuides(data.pdfs || []);
  } catch(e) {
    console.error('Failed to load PDF guides:', e);
  }
}

function renderPdfGuides(pdfs) {
  const grid = document.getElementById('ref-pdf-grid');
  if (!grid) return;

  // If no uploaded pdfs exist from API, keep fallback static card (Reference Card A5) if present
  if (!pdfs || pdfs.length === 0) {
    return;
  }

  grid.innerHTML = '';
  pdfs.forEach(p => {
    const tile = document.createElement('div');
    tile.className = 'ref-pdf-tile';
    tile.style.position = 'relative';
    tile.style.display = 'flex';
    tile.style.alignItems = 'center';
    tile.style.gap = '12px';
    tile.style.cursor = 'pointer';

    tile.innerHTML = `
      <a href="${p.url}" download style="display: flex; align-items: center; gap: 12px; flex: 1; text-decoration: none; color: inherit;">
        <div class="pdf-icon"><i data-lucide="file-text"></i></div>
        <span style="font-weight: 500; font-size: 0.95rem;">${p.title}</span>
      </a>
    `;

    if (appState && appState.isAdmin) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-video';
      delBtn.style.position = 'static';
      delBtn.style.marginLeft = 'auto';
      delBtn.title = 'Delete PDF Manual';
      delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        handlePdfDelete(p.filename, tile);
      };
      tile.appendChild(delBtn);
    }

    grid.appendChild(tile);
  });
  if (window.lucide) window.lucide.createIcons();
}

function handlePdfFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const progressWrap = document.getElementById('pdf-upload-progress-wrap');
  const progressBar  = document.getElementById('pdf-upload-progress-bar');
  const label        = document.getElementById('pdf-upload-label');

  const formData = new FormData();
  formData.append('pdf', file);
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
    if (progressBar)  progressBar.style.width = '0%';
    if (label) label.style.opacity = '1';
    e.target.value = '';
    if (xhr.status === 200) {
      showToast('PDF manual uploaded!', 'success');
      loadPdfGuides();
    } else {
      let msg = 'Upload failed (HTTP ' + xhr.status + ').';
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (parsed.error) msg = parsed.error;
      } catch(ex) {}
      showToast(msg, 'error');
    }
  });
  xhr.addEventListener('error', () => {
    if (progressWrap) progressWrap.style.display = 'none';
    if (label) label.style.opacity = '1';
    showToast('Network error: PDF upload failed.', 'error');
  });
  xhr.open('POST', '/api/pdfs/upload');
  xhr.send(formData);
}

async function handlePdfDelete(filename, tileEl) {
  const confirmed = await showModal({
    title: 'Delete PDF Manual', subtitle: 'This cannot be undone',
    message: 'Are you sure you want to permanently delete "' + filename + '"?',
    type: 'error', isDanger: true, confirmText: 'Delete', cancelText: 'Cancel'
  });
  if (!confirmed) return;
  try {
    const res = await fetch('/api/pdfs/' + encodeURIComponent(filename), { method: 'DELETE' });
    if (res.ok) {
      showToast('PDF manual deleted.', 'success');
      if (tileEl && tileEl.parentNode) tileEl.parentNode.removeChild(tileEl);
      loadPdfGuides();
    } else { showToast('Failed to delete PDF manual.', 'error'); }
  } catch(ex) { showToast('Error deleting PDF manual.', 'error'); }
}

// Reload PDF list when Reference tab is clicked
(function() {
  const refTabBtn = document.querySelector('.tab-btn[data-tab="tab-reference"]');
  if (refTabBtn) {
    refTabBtn.addEventListener('click', () => loadPdfGuides());
  }
})();

