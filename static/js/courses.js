document.addEventListener('DOMContentLoaded', async () => {
  const enrollment=document.getElementById('course-enrollment');
  if(!enrollment) return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mode=document.getElementById('participation-mode');
  const gender=document.getElementById('participation-gender');
  const cohort=document.getElementById('participation-cohort');
  const peg=document.getElementById('participation-peg');
  const feedback=document.getElementById('participation-feedback');
  const manager=document.getElementById('course-manager');
  let csrf='', catalog=null, management=null, preview=null;
  async function api(path, data) {
    const response=await fetch('/api/courses'+path, data===undefined ? {cache:'no-store'} : {
      method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(data)
    });
    if(!response.headers.get('content-type')?.includes('application/json')) throw new Error('Your session expired. Sign in again and refresh this page.');
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Could not save this change. Please try again.');
    return result;
  }
  function message(target,value,error=false){target.textContent=value;target.classList.toggle('course-feedback-error',error);}
  function modeFields(){
    const course=mode.value==='course';
    document.getElementById('participation-course-fields').hidden=!course;
    document.getElementById('participation-gender-field').hidden=!course;
    cohort.required=course;
  }
  function pegOptions(){
    const c=catalog?.courses.find(c=>c.cohort.toLowerCase()===cohort.value.trim().toLowerCase() || c.cohort.replace(/\D/g,'')===cohort.value.trim());
    document.getElementById('participation-pegs').innerHTML=(catalog?.groups||[]).filter(g=>g.courseId===c?.id).map(g=>`<option value="${esc(g.name)}"></option>`).join('');
  }
  function renderEnrollment(data){
    catalog=data;csrf=data.csrf;
    const p=data.participation;
    mode.value=p.mode;gender.value=p.gender;cohort.value=p.cohort;peg.value=p.peg;
    document.getElementById('participation-cohorts').innerHTML=data.courses.map(c=>`<option value="${esc(c.cohort)}">${esc(c.name)}</option>`).join('');
    document.getElementById('participation-placement').textContent=p.assigned ? `Assigned to ${p.cohort} · ${p.peg}.` : 'Existing cohort and PEG details are matched automatically when the group has space and is eligible. Otherwise an admin will help with placement.';
    modeFields();pegOptions();
    window.dispatchEvent(new CustomEvent('cbr:participation', {detail:p}));
  }
  mode.addEventListener('change',modeFields);cohort.addEventListener('input',pegOptions);
  enrollment.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
    try{
      const result=await api('/participation',{mode:mode.value,gender:gender.value,cohort:cohort.value,peg:peg.value});
      const p=result.participation;
      if(typeof appState!=='undefined' && appState){appState.participation=p;appState.participationMode=p.mode;appState.peg=p.peg;appState.cohort=p.cohort;appState.courseId=p.courseId;}
      renderEnrollment(await api('/participation'));message(feedback,result.message);
      if(manager) await refreshManagement();
    }catch(error){message(feedback,error.message,true);}finally{button.disabled=false;}
  });
  const mgFeedback=manager?.querySelector('#course-management-feedback');
  const selectedCourse=()=>Number(manager.querySelector('#manage-course').value);
  function dataFrom(form){const data=Object.fromEntries(new FormData(form));if('minimum'in data){data.minimum=Number(data.minimum);data.maximum=Number(data.maximum);}return data;}
  function renderGroups(){
    const courseId=selectedCourse(), groups=management.groups.filter(g=>g.courseId===courseId);
    const options=groups.map(g=>`<option value="${g.id}">${esc(g.name)} · ${g.members.length}/${g.maximum}</option>`).join('');
    manager.querySelector('#assign-group').innerHTML='<option value="">Awaiting PEG placement</option>'+options;
    manager.querySelector('#leader-group').innerHTML=options||'<option value="">Create a PEG first</option>';
    manager.querySelector('#course-member-emails').innerHTML=management.members.map(m=>`<option value="${esc(m.email)}">${esc(m.name)}</option>`).join('');
    manager.querySelector('#course-group-list').innerHTML='<h3>PEG groups & leaders</h3>'+groups.map(g=>`<article class="course-group"><strong>${esc(g.name)} · ${g.members.length} members</strong><small>${esc({mixed:'Mixed / any gender',women:'Ladies only',men:'Men only'}[g.policy])} · Minimum ${g.minimum} / Maximum ${g.maximum}${g.members.length<g.minimum ? ' · Below minimum' : ''}</small><small>Leaders: ${g.leaders.map(l=>esc(l.email)).join(', ')||'Not appointed'}</small><ul>${g.members.map(id=>{const m=management.members.find(m=>m.id===id);return `<li>${esc(m?.name)} · ${esc(m?.email)}</li>`;}).join('')||'<li>No members assigned yet.</li>'}</ul></article>`).join('')+
      `<p>${management.members.filter(m=>m.courseId===courseId&&!m.groupId).length} members in this course await PEG placement. ${management.members.filter(m=>!m.courseId).length} course registrations await cohort matching.</p>`;
    const numbers=groups.map(g=>Number(g.name.replace(/\D/g,''))).filter(Number.isFinite);
    manager.querySelector('#create-peg-form [name="name"]').value='PEG '+(Math.max(0,...numbers)+1);
    preview=null;manager.querySelector('#random-peg-preview').hidden=true;
  }
  async function refreshManagement(){
    const previous=manager.querySelector('#manage-course').value;
    management=await api('/management');csrf=management.csrf;
    manager.querySelector('#manage-course').innerHTML=management.courses.map(c=>`<option value="${c.id}">${esc(c.name)} · ${esc(c.cohort)}</option>`).join('');
    if(management.courses.some(c=>String(c.id)===previous)) manager.querySelector('#manage-course').value=previous;
    manager.querySelector('#new-cohort-number').value='Cohort '+management.nextCohort;
    renderGroups();
  }
  function formHandler(id,action){manager.querySelector(id).addEventListener('submit',async event=>{
    event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
    try{const result=await action(dataFrom(event.target));message(mgFeedback,result.message||'Saved. Refresh Member Progress to see the updated directory.');await refreshManagement();renderEnrollment(await api('/participation'));}
    catch(error){message(mgFeedback,error.message,true);}finally{button.disabled=false;}
  });}
  try{
    renderEnrollment(await api('/participation'));
    if(!manager)return;
    await refreshManagement();
    manager.querySelector('#manage-course').addEventListener('change',renderGroups);
    manager.querySelector('#course-refresh').addEventListener('click',()=>refreshManagement().catch(e=>message(mgFeedback,e.message,true)));
    formHandler('#create-course-form',data=>api('',data));
    formHandler('#create-peg-form',data=>api('/'+selectedCourse()+'/groups',data));
    formHandler('#assign-peg-form',data=>api('/'+selectedCourse()+'/assign',{email:data.email,groupId:data.groupId?Number(data.groupId):null}));
    formHandler('#peg-leader-form',data=>api('/groups/'+data.groupId+'/leaders',data));
    manager.querySelector('#random-peg-form').addEventListener('submit',async event=>{
      event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
      try{
        const plan=await api('/'+selectedCourse()+'/random-preview',dataFrom(event.target));
        preview={...plan,courseId:selectedCourse()};
        const box=manager.querySelector('#random-peg-preview');box.hidden=false;
        box.innerHTML=`<h3>Review random placement</h3><p>${plan.count} members in ${plan.groups.length} groups. ${plan.remaining} other unassigned members are excluded by the selected group type.</p>`+plan.groups.map((members,i)=>`<p><strong>New group ${i+1} · ${members.length} members</strong><br>${members.map(m=>esc(m.name)).join(', ')}</p>`).join('')+'<button type="button" class="btn btn-primary btn-small" id="apply-random-pegs">Create these PEG groups</button>';
      }catch(error){message(mgFeedback,error.message,true);}finally{button.disabled=false;}
    });
    manager.addEventListener('click',async event=>{
      if(event.target.id!=='apply-random-pegs'||!preview)return;
      const button=event.target;button.disabled=true;
      try{const result=await api('/'+preview.courseId+'/random-apply',{token:preview.token});message(mgFeedback,result.message+' Refresh Member Progress to see the updated directory.');await refreshManagement();}
      catch(error){message(mgFeedback,error.message,true);button.disabled=false;}
    });
  }catch(error){message(feedback,error.message,true);if(mgFeedback)message(mgFeedback,error.message,true);}
});
