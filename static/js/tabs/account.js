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
  if (elements.profileInputPeg) elements.profileInputPeg.value = data.peg || "";
  if (elements.profileInputCohort) elements.profileInputCohort.value = data.cohort || "";
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
