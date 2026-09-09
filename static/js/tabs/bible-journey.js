/* Unique chapter coverage across saved cards and the live card. */
function bibleJourneyProgress(state, books, today = new Date()) {
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const cutoff = dateKey(today);
  const cards = new Map();
  for (const card of state.savedCards || []) cards.set(card.instanceId || `${card.round || 1}:${card.currentCardId || card.cardId}:${card.commencingDate}`, card);
  cards.set(state.activeInstanceId || `${state.round || 1}:${state.currentCardId}:${state.commencingDate}`, state);
  const events = [];
  for (const card of cards.values()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(card.commencingDate || '')) continue;
    for (const [index, day] of (card.days || []).entries()) {
      const date = new Date(card.commencingDate + 'T00:00:00');
      date.setDate(date.getDate() + (Number(day.dayNumber) || index + 1) - 1);
      if (dateKey(date) > cutoff) continue;
      let passages = day.readingPassages || [];
      if (!passages.length && day.bibleBook) passages = [{book:day.bibleBook,startChapter:day.startChapter,endChapter:day.endChapter}];
      events.push({date:dateKey(date), passages, count:(Number(day.morningChapters)||0)+(Number(day.laterChapters)||0)});
    }
  }
  events.sort((a,b)=>a.date.localeCompare(b.date));
  const completed = new Map(books.map(b=>[b.name,new Set()]));
  const timeline = new Map();
  let unidentified = 0;
  for (const event of events) {
    const added = [];
    let identified = 0;
    for (const p of event.passages) {
      const book = books.find(b=>b.name===p.book);
      const start = Number(p.startChapter ?? p.start), end = Number(p.endChapter ?? p.end);
      if (!book || !Number.isInteger(start) || !Number.isInteger(end) || start<1 || end<start || end>book.chapters) continue;
      identified += end-start+1;
      for(let ch=start; ch<=end; ch++) if(!completed.get(book.name).has(ch)) {
        completed.get(book.name).add(ch); added.push(`${book.name} ${ch}`);
      }
    }
    unidentified += Math.max(0,event.count-identified);
    if(added.length) timeline.set(event.date,[...(timeline.get(event.date)||[]),...added]);
  }
  const total = books.reduce((n,b)=>n+b.chapters,0);
  const done = [...completed.values()].reduce((n,s)=>n+s.size,0);
  return {total,done,remaining:total-done,completed,timeline,unidentified};
}

function bibleJourneyForecast(remaining, pace, state, today = new Date()) {
  if (!Number.isInteger(remaining) || remaining<0 || (pace !== 'normal' && (!Number.isInteger(pace) || pace<1 || pace>1189))) return null;
  let days=0, chapters=remaining;
  const card = Math.min(7,Math.max(1,Number(state.currentCardId)||1));
  const start = new Date((state.commencingDate || '')+'T00:00:00');
  const midnight = new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const elapsed = Number.isNaN(start.getTime()) ? 0 : Math.max(0,Math.round((midnight-start)/86400000));
  // Forecast starts tomorrow; finish the current 28-day card, then progress to 7/day.
  const daysLeft = Math.max(0,28-elapsed-1);
  while(chapters>0) {
    const target = pace === 'normal' ? Math.min(7,card+(days<daysLeft?0:1+Math.floor((days-daysLeft)/28))) : pace;
    chapters -= target; days++;
  }
  const finish = new Date(midnight); finish.setDate(finish.getDate()+days);
  return {days,finish};
}

function bibleJourneyChapterLabel(book, chapters) {
  const short = {'Exodus':'Exo','Psalms':'Psa','Song of Solomon':'Song','Philippians':'Phil','Philemon':'Phlm','Judges':'Jdg','John':'Jn','1 John':'1 Jn','2 John':'2 Jn','3 John':'3 Jn'}[book] || book.replace(/([A-Za-z]{3})[A-Za-z]+/g, '$1');
  const numbers = [...new Set(chapters.map(ch => Number(ch.slice(book.length + 1))))].sort((a,b)=>a-b);
  const ranges = [];
  for (let i=0;i<numbers.length;i++) {
    const start=numbers[i]; let end=start;
    while(numbers[i+1]===end+1) end=numbers[++i];
    ranges.push(start===end ? String(start) : `${start}–${end}`);
  }
  return `${short} ${ranges.join(', ')}`;
}

function bibleJourneyReadingLabel(chapters) {
  const byBook = new Map();
  for (const chapter of chapters) {
    const match = chapter.match(/^(.+) (\d+)$/);
    if (!match) continue;
    if (!byBook.has(match[1])) byBook.set(match[1], []);
    byBook.get(match[1]).push(chapter);
  }
  return [...byBook].map(([book, readings])=>bibleJourneyChapterLabel(book,readings)).join(' · ');
}

function renderBibleJourney() {
  if (typeof appState === 'undefined' || !appState) return;
  const progress = bibleJourneyProgress(appState,CBR_DATA.bibleBooks);
  const format = date => date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
  const completedBooks = CBR_DATA.bibleBooks.filter(b=>progress.completed.get(b.name).size===b.chapters);
  const summary = `${progress.done} of ${progress.total} distinct chapters · ${completedBooks.length} of 66 books complete`;
  document.getElementById('bj-progress').textContent = `${progress.done} / ${progress.total} chapters · ${completedBooks.length} / 66 books`;
  document.getElementById('bj-coverage').value = progress.done;
  document.getElementById('bj-coverage').max = progress.total;
  document.getElementById('bj-unidentified').textContent = progress.unidentified ? `${progress.unidentified} logged chapter readings have no complete book/chapter reference. Add their passages in your daily logs to include them in this estimate.` : 'Based on dated passages in your saved cards and active card. Rereads count once; future entries are excluded.';
  const updateForecast = () => {
    const custom = document.getElementById('bj-mode').value === 'constant';
    document.getElementById('bj-speed').disabled = !custom;
    const pace = custom ? Number(document.getElementById('bj-speed').value) : 'normal';
    const forecast = bibleJourneyForecast(progress.remaining,pace,appState);
    document.getElementById('bj-result').textContent = !forecast ? 'Enter a whole number from 1 to 1,189.' : !progress.remaining ? 'Bible complete!' : format(forecast.finish);
    document.getElementById('bj-days').textContent = forecast && progress.remaining ? `${forecast.days} days to go · ${custom ? pace + ' chapters/day' : 'Challenger plan'}` : '';
    document.querySelectorAll('[data-bj-pace]').forEach(button=>button.setAttribute('aria-pressed',String(custom && Number(button.dataset.bjPace)===pace))); 
    document.getElementById('bj-assumption').textContent = custom ? 'Starting tomorrow, reading this many unread chapters every day with no missed days.' : 'Starting tomorrow: finish your current 28-day card, increase by one chapter per day at each new card, then stay at 7 chapters per day. An overdue card advances tomorrow.';
    document.getElementById('bj-comparison').textContent = [7,8].map(n=>{const f=bibleJourneyForecast(progress.remaining,n,appState);return `${n}/day: ${f.days} days (${format(f.finish)})`;}).join(' · ');
  };
  document.getElementById('bj-mode').onchange = () => {
    updateForecast();
    if (document.getElementById('bj-mode').value === 'constant') {
      document.getElementById('bj-speed').focus();
      document.getElementById('bj-speed').select();
    }
  };
  document.getElementById('bj-speed').oninput = updateForecast;
  document.getElementById('bj-speed').onchange = updateForecast;
  document.querySelectorAll('[data-bj-pace]').forEach(button=>button.onclick=()=>{
    document.getElementById('bj-mode').value='constant';
    document.getElementById('bj-speed').value=button.dataset.bjPace;
    updateForecast();
  });
  updateForecast();
  const host = document.getElementById('profile-bible-progress');
  host.replaceChildren();
  const heading = document.createElement('h3'); heading.textContent='Your Bible reading journey';host.append(heading);
  const desc = document.createElement('p');desc.textContent=summary;host.append(desc);
  const finished = document.createElement('p');finished.textContent=completedBooks.length ? `Books completed: ${completedBooks.map(b=>b.name).join(', ')}` : 'No fully recorded books yet. Add book and chapter ranges in your daily reading logs.';host.append(finished);
  const download=document.createElement('button');
  download.type='button';download.className='bj-download-icon';
  download.title='Download chart as PDF';
  download.setAttribute('aria-label','Download chart as PDF');
  download.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 16v4h14v-4"/></svg>';
  host.append(download);
  const chart=document.createElement('div');chart.className='bj-chart';host.append(chart);
  let printMonths=[];
  download.onclick=()=>printBibleJourneyMonths(chart.querySelector('svg'),printMonths,'All books',appState.username || 'Bible Reader');
  function drawJourney() {
    const allPoints=[...progress.timeline].map(([date,chapters])=>({date,chapters}));
    const chartMaximum=Math.max(10,Math.ceil(progress.done/10)*10);
    chart.replaceChildren();
    printMonths=[];download.disabled=!allPoints.length;
    if(!allPoints.length){chart.textContent='No dated chapters recorded yet. Add book and chapter ranges in your daily logs.';return;}
    const points = allPoints;
    const labels = points.map(p=>`${p.date.slice(8)} · ${bibleJourneyReadingLabel(p.chapters)}`);
    const labelHeight = Math.max(160,...labels.map(label=>label.length*7+20));
    // Allocate space to recorded dates rather than empty calendar days.
    const grouped = new Map();
    for (const point of points) {
      const key=point.date.slice(0,7);
      if (!grouped.has(key)) grouped.set(key,[]);
      grouped.get(key).push(point.date);
    }
    const monthBands = [];
    let width = 48;
    for (const [key,dates] of grouped) {
      const monthWidth=Math.max(136,dates.length*23+24);
      monthBands.push({key,dates,x:width,width:monthWidth,name:new Date(key+'-01T00:00:00').toLocaleDateString(undefined,{month:'short',year:'numeric'})});
      width+=monthWidth;
    }
    printMonths=monthBands;
    width += 24;
    const height = 240+labelHeight;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.style.minWidth=width+'px';
    svg.style.width=width+'px';
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',`All books: one cumulative reading chart, grouped horizontally by month, with vertical date and chapter labels. Only recorded dates are shown, spaced evenly within each month.`);
    function shape(tag, attributes, text) {
      const node=document.createElementNS(ns,tag);
      for(const [key,value] of Object.entries(attributes)) node.setAttribute(key,value);
      if(text !== undefined) node.textContent=text;
      svg.append(node);
      return node;
    }
    monthBands.forEach((month,index)=>{
      shape('rect',{x:month.x,y:0,width:month.width,height,fill:'currentColor','fill-opacity':index%2 ? '.025' : '.065'});
      shape('text',{x:month.x+month.width/2,y:24,'text-anchor':'middle',fill:'currentColor','font-size':14,'font-weight':700},month.name);
      shape('line',{x1:month.x,x2:month.x,y1:36,y2:height,stroke:'currentColor','stroke-opacity':'.18'});
    });
    let cumulative=0;
    const coords=points.map(p=>{
      cumulative+=p.chapters.length;
      const month=monthBands.find(m=>m.key===p.date.slice(0,7));
      return {...p,x:month.x+12+(month.dates.indexOf(p.date)+.5)*(month.width-24)/month.dates.length,y:210-cumulative/chartMaximum*150,total:cumulative};
    });
    shape('polyline',{points:coords.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'var(--accent-color, #38bdf8)','stroke-width':3});
    coords.forEach((p,index)=>{
      const dot=shape('circle',{cx:p.x,cy:p.y,r:4,fill:'#38bdf8'});
      const title=document.createElementNS(ns,'title');
      title.textContent=`${p.date}: ${bibleJourneyReadingLabel(p.chapters)}; ${p.total} chapters completed`;
      dot.append(title);
      shape('line',{x1:p.x,x2:p.x,y1:p.y+7,y2:222,stroke:'currentColor','stroke-opacity':'.2','stroke-dasharray':'3 4'});
      shape('text',{transform:`translate(${p.x+4},232) rotate(90)`,fill:'currentColor','font-size':12},labels[index]);
    });
    shape('text',{x:4,y:62,fill:'currentColor','font-size':12},chartMaximum+' ch');
    shape('text',{x:20,y:210,fill:'currentColor','font-size':12},'0');
    chart.append(svg);
  }

  drawJourney();
}
// An isolated print document keeps the card/evaluation print stylesheet out of this export.
function printBibleJourneyMonths(source, months, book, reader) {
  if (!source || !months.length) return;
  document.getElementById('bible-journey-print-frame')?.remove();
  const frame=document.createElement('iframe');
  frame.id='bible-journey-print-frame';
  frame.title='Bible reading chart PDF';
  frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;top:0;border:0;';
  document.body.append(frame);
  const doc=frame.contentDocument;
  const style=doc.createElement('style');
  style.textContent=`@page {size:A4 portrait;margin:12mm;}
    body {margin:0;color:#17212b;background:white;font:12px Arial,sans-serif;}
    h1 {font-size:20px;margin:0 0 6px;} p {margin:6px 0 16px;}
    section {break-inside:avoid;page-break-inside:avoid;margin:0 0 18px;border:1px solid #ddd;padding:8px;}
    svg {display:block;width:100%;height:auto;overflow:hidden;color:#17212b;--accent-color:#1670a6;}
    * {print-color-adjust:exact;-webkit-print-color-adjust:exact;}`;
  doc.head.append(style);
  doc.title=`Bible-reading-${book.replaceAll(' ','-')}`;
  const heading=doc.createElement('h1');heading.textContent=book+' — Reading progress';doc.body.append(heading);
  const subtitle=doc.createElement('p');subtitle.textContent=reader+' · Monthly charts · Cumulative chapters completed';doc.body.append(subtitle);
  const height=source.viewBox.baseVal.height;
  for (const month of months) {
    const section=doc.createElement('section');
    section.setAttribute('aria-label',month.name);
    const svg=source.cloneNode(true);
    svg.removeAttribute('style');
    svg.setAttribute('viewBox',`${month.x} 0 ${month.width} ${height}`);
    svg.style.height='85mm';
    svg.setAttribute('aria-label',`${book}, ${month.name}`);
    section.append(svg);doc.body.append(section);
  }
  const printWindow=frame.contentWindow;
  // Keep the iframe alive after printing; the next export replaces it safely.
  printWindow.requestAnimationFrame(()=>printWindow.requestAnimationFrame(()=>{
    printWindow.focus();printWindow.print();
  }));
}
if(typeof document !== 'undefined') document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.tab-btn').forEach(button=>button.addEventListener('click',()=>{if(['tab-bible-journey','tab-account'].includes(button.dataset.tab)) renderBibleJourney();}));
});
if(typeof module !== 'undefined') module.exports={bibleJourneyProgress,bibleJourneyForecast,bibleJourneyChapterLabel,bibleJourneyReadingLabel};
