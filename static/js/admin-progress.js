document.addEventListener('DOMContentLoaded', () => {
  const panel = document.querySelector('.admin-progress');
  if (!panel) return;
  const search = panel.querySelector('#admin-member-search');
  const filters = ['cohort', 'peg', 'card', 'round', 'status'].map(key => [key, panel.querySelector(`#admin-member-${key}`)]);
  const rows = [...panel.querySelectorAll('[data-member]')];
  const dialog = panel.querySelector('#admin-member-dialog');
  const detail = panel.querySelector('#admin-member-detail');
  let selected = null;
  let requestId = 0;
  const esc = value => escapeCardText(value ?? '');
  function filterMembers() {
    let count = 0;
    for (const row of rows) {
      row.hidden = !(row.dataset.member.toLowerCase().includes(search.value.trim().toLowerCase()) &&
        filters.every(([key, input]) => !input.value || row.dataset[key] === input.value));
      if (!row.hidden) count++;
    }
    panel.querySelector('#admin-member-count').textContent = `${count} of ${rows.length} members`;
    panel.querySelector('#admin-empty').hidden = count > 0;
  }
  search.addEventListener('input', filterMembers);
  filters.forEach(([, input]) => input.addEventListener('change', filterMembers));
  panel.querySelector('#admin-detail-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { selected = null; requestId++; });
  function renderMember(data) {
    const m = data.member;
    panel.querySelector('#admin-detail-title').textContent = m.name;
    const stat = (label, value) => `<article><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`;
    const item = (label, value) => `<div><dt>${esc(label)}</dt><dd>${esc(value || 'Not recorded')}</dd></div>`;
    detail.innerHTML = `<p class="admin-detail-subtitle">${esc(m.email)} · ${esc(m.cohort || 'Cohort not set')} · ${esc(m.peg || 'PEG not set')}</p>
      <div class="admin-detail-actions"><button type="button" class="btn btn-primary" data-admin-booklet ${data.records.length ? '' : 'disabled'}>Download member booklet</button><span>Includes all cards and the evaluation card. Choose Save as PDF.</span></div>
      <div class="metrics admin-detail-metrics">${stat('Total points', m.totalPoints)}${stat('Growth points', m.growthPoints)}${stat('Diligence', m.diligencePoints)}${stat('Bonuses', m.bonusPoints)}</div>
      <section class="admin-detail-section"><h3>Progress & follow-up</h3><dl class="admin-detail-grid">${item('Current card', m.current_card_id ? `Card ${m.current_card_id} · Round ${m.round}` : 'No card yet')}${item('Started', m.startDate)}${item('Days logged', `${m.days} / 28`)}${item('Chapters read · current card', String(m.chapters))}${item('Last activity', m.lastActivity)}${item('Evaluations not submitted', String(m.pendingEvaluations))}${item('Contact', m.contact)}${item('Church', m.church)}</dl>
      <ul class="admin-flags">${m.flags.length ? m.flags.map(flag => `<li>${esc(flag)}</li>`).join('') : '<li>No follow-up flags on the current card.</li>'}</ul></section>
      <section class="admin-detail-section"><h3>Current card consistency</h3><div class="admin-discipline-grid">${Object.entries({recitedMemory:'Scripture recitation', fidJournaling:'Journaling', prayer10mins:'Prayer 10+ minutes', dataValidity:'Data validity'}).map(([key,label])=>`<div><span>${label}</span><strong>${m.disciplines[key]} / 28</strong></div>`).join('')}</div></section>
      <section class="admin-detail-section"><h3>Card records</h3><div class="table-wrap"><table><thead><tr><th>Card / round</th><th>Start date</th><th>Weekly growth points</th><th>Total</th><th>Download</th></tr></thead><tbody>${data.records.map((card,i)=>`<tr><td>Card ${card.currentCardId} · Round ${card.round}</td><td>${esc(card.commencingDate)}</td><td>${card.score.weeks.map(w=>`W${w.week}: ${w.points}`).join(' · ')}</td><td>${card.totalScore} / 40</td><td><button type="button" class="btn btn-secondary btn-small" data-admin-card="${i}">Download card</button></td></tr>`).join('') || '<tr><td colspan="5">No card records yet.</td></tr>'}</tbody></table></div></section>
      <section class="admin-detail-section"><h3>Session evaluation</h3><div class="table-wrap"><table><thead><tr><th>Session</th><th>Diligence points</th><th>Bonus points</th><th>Submission</th></tr></thead><tbody>${Array.from({length:7},(_,i)=>{const n=i+1,e=data.evaluations[n];return `<tr><td>${n}</td><td>${e ? Object.values(e.diligence).filter(Boolean).length*10 : 0}</td><td>${n===7 && e ? Object.values(e.bonus).filter(Boolean).length*50 : 0}</td><td>${esc(e?.submittedAt ? e.submittedAt.slice(0,10) : 'Not submitted')}</td></tr>`;}).join('')}</tbody></table></div></section>`;
  }
  panel.addEventListener('click', async event => {
    const button = event.target.closest('[data-admin-member]');
    if (!button) return;
    const current = ++requestId;
    selected = null;
    panel.querySelector('#admin-detail-title').textContent = 'Member details';
    detail.textContent = 'Loading member progress…';
    dialog.showModal();
    try {
      const response = await fetch(`/admin/api/members/${button.dataset.adminMember}/progress`, {cache:'no-store'});
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Could not load this member. Check your admin session and try again.');
      const data = await response.json();
      if (current !== requestId || !dialog.open) return;
      selected = data;
      renderMember(data);
    } catch (error) {
      if (current === requestId) detail.textContent = error.message;
    }
  });
  detail.addEventListener('click', async event => {
    const button = event.target.closest('[data-admin-booklet], [data-admin-card]');
    if (!button || !selected || button.disabled) return;
    button.disabled = true;
    try {
      if (button.hasAttribute('data-admin-booklet')) await downloadChallengerBooklet(selected.state, selected.evaluations);
      else {
        const card = collectBookletCards(selected.state)[Number(button.dataset.adminCard)];
        const growth = {};
        selected.records.forEach(record => { growth[record.currentCardId] = (growth[record.currentCardId] || 0) + record.totalScore; });
        await printChallengerCard(card, selected.evaluations, growth);
      }
    } catch (error) { showToast('Could not prepare the member download. Please try again.', 'error'); }
    finally { button.disabled = false; }
  });
});
