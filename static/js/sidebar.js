document.addEventListener('DOMContentLoaded', () => {
  const sidebar=document.getElementById('sidebar-section');
  const menu=document.getElementById('hamburger-btn');
  const mobile=window.matchMedia('(max-width: 900px)');
  const buttons=[...sidebar.querySelectorAll('.tab-btn[data-tab]')];
  function currentPage() {
    buttons.forEach(button=>{
      if(button.classList.contains('active')) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }
  currentPage();
  buttons.forEach(button=>new MutationObserver(currentPage).observe(button,{attributes:true,attributeFilter:['class']}));
  function close(returnFocus=true) { window.closeSidebar(); if(returnFocus) menu.focus(); }
  document.getElementById('sidebar-close').addEventListener('click',()=>close());
  document.getElementById('sidebar-profile-shortcut').addEventListener('click',()=>{
    document.querySelector('[data-subtab="tab-profile"]')?.click();
  });
  window.addEventListener('cbr:participation', event=>{
    const p=event.detail;
    document.getElementById('sidebar-participation').textContent=p.mode==='course' ? [p.cohort,p.assigned?p.peg:'Awaiting PEG placement'].filter(Boolean).join(' · ') : 'Personal reading';
  });
  function resize() {
    if(!mobile.matches && sidebar.classList.contains('open')) close(false);
    sidebar.inert=mobile.matches && !sidebar.classList.contains('open');
  }
  resize();mobile.addEventListener('change',resize);
  document.addEventListener('keydown',event=>{
    if(!mobile.matches||!sidebar.classList.contains('open')) return;
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key!=='Tab') return;
    const controls=[...sidebar.querySelectorAll('button:not([disabled]), a[href]')].filter(el=>el.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
});
