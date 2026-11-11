document.addEventListener('DOMContentLoaded',()=>{
  const panel=document.getElementById('overall-admin-manager');
  if(!panel)return;
  const feedback=panel.querySelector('#overall-admin-feedback');
  const form=panel.querySelector('#overall-admin-form');
  const submit=form.querySelector('button');
  let csrf='',busy=false;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function message(value,error=false){feedback.textContent=value;feedback.classList.toggle('course-feedback-error',error);}
  async function load(){
    submit.disabled=true;
    const response=await fetch('/api/courses/admins',{cache:'no-store'});
    if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Could not load admin access. Refresh and check your session.');
    const data=await response.json();csrf=data.csrf;
    panel.querySelector('#overall-admin-list').innerHTML='<table><thead><tr><th>Administrator</th><th>Access</th><th>Actions</th></tr></thead><tbody>'+data.admins.map(admin=>`<tr><td><strong>${esc(admin.name)}</strong><small>${esc(admin.email)}${admin.current?' · You':''}</small></td><td>${admin.protected?'Configured owner · protected':'Overall admin'}</td><td>${admin.protected?'<span class="admin-access-note">Protected owner</span>':admin.current?'<span class="admin-access-note">Ask another admin to remove you</span>':`<button type="button" class="btn btn-secondary btn-small" data-revoke-admin="${esc(admin.email)}">Remove access</button>`}</td></tr>`).join('')+'</tbody></table>';
    panel.querySelector('#overall-admin-activity').innerHTML=data.activity.length?'<table><thead><tr><th>Changed by</th><th>Account</th><th>Change</th><th>Date</th></tr></thead><tbody>'+data.activity.map(event=>`<tr><td>${esc(event.actor)}</td><td>${esc(event.target)}</td><td>${event.action==='grant'?'Admin added':'Admin removed'}</td><td>${esc(event.at.slice(0,10))}</td></tr>`).join('')+'</tbody></table>':'<p>No admin access changes recorded yet.</p>';
    submit.disabled=false;
    return data;
  }
  async function change(email,action){
    if(busy||!csrf)return;
    busy=true;
    try{
      const confirmed=await showModal({title:action==='grant'?'Add overall admin?':'Remove overall admin?',
        message:action==='grant'?`${email} will have full access to manage all courses, PEGs, leaders and other admins.`:`${email} will lose overall admin access. Any separate PEG leader role remains limited to that PEG.`,
        type:action==='grant'?'info':'warning',confirmText:action==='grant'?'Grant full admin access':'Remove admin access',cancelText:'Cancel'});
      if(!confirmed)return;
      submit.disabled=true;
      const response=await fetch('/api/courses/admins',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({email,action})});
      if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Your session expired. Refresh and sign in again.');
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not change admin access.');
      await load();message(data.message);if(action==='grant')form.reset();
    }catch(error){message(error.message,true);}finally{busy=false;submit.disabled=!csrf;}
  }
  form.addEventListener('submit',event=>{event.preventDefault();change(form.elements.email.value.trim().toLowerCase(),'grant');});
  panel.addEventListener('click',event=>{const button=event.target.closest('[data-revoke-admin]');if(button)change(button.dataset.revokeAdmin,'revoke');});
  load().then(()=>message('Only overall admins can grant or remove overall admin access.')).catch(error=>message(error.message,true));
});
