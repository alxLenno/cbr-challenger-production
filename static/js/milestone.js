document.addEventListener('DOMContentLoaded', () => {
  let shown=false;
  async function check() {
    if(shown||document.hidden)return;
    try {
      const response=await fetch('/api/milestone',{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json(),key=`cbr.celebrated.600.${data.userId}`;
      if(data.points<600)return;
      try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch(e){}
      shown=true;
      const dialog=document.createElement('dialog');dialog.className='milestone-celebration';
      dialog.innerHTML='<div class="milestone-confetti" aria-hidden="true">'+Array.from({length:24},(_,i)=>`<i style="--i:${i};left:${i*4}%"></i>`).join('')+'</div><span aria-hidden="true" style="font-size:3rem">🏆</span><h2>Congratulations!</h2><p>You’ve reached <strong>600+ points</strong>.</p><p>Your commitment to consistent Bible reading is worth celebrating. Keep growing!</p><button type="button" class="btn btn-primary">Keep going</button>';
      document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
    }catch(e){}
  }
  setTimeout(check,2500);setInterval(check,60000);document.addEventListener('visibilitychange',check);
});
