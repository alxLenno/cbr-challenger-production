document.addEventListener('DOMContentLoaded', () => {
  const manager = document.getElementById('course-manager');
  if (!manager) return;
  const tabs = [...manager.querySelectorAll('[role="tab"]')];
  function activate(tab, focus=false) {
    tabs.forEach(button => {
      const selected=button===tab;
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=selected?0:-1;
      document.getElementById(button.getAttribute('aria-controls')).hidden=!selected;
    });
    manager.querySelector('.course-management-toolbar').hidden=tab.id==='peg-tab-access';
    const feedback=manager.querySelector('#course-management-feedback');
    feedback.textContent='';
    if(focus) tab.focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      activate(tabs[next],true);
    });
  });
});
