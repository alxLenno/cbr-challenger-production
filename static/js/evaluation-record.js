// Preserve the supplied sheet's paired boxes, but render only recorded cards.
function evaluationRecordStyles() {
  return `.evaluation-record-sheet{box-sizing:border-box;width:100%;max-width:794px;background:#fff;color:#171717;margin:16px auto;padding:36px 28px;font-family:Arial,sans-serif}.evaluation-record-sheet h2{text-align:center;font-size:20px;font-weight:900;margin:0 0 34px}.er-brand{display:flex;align-items:center;gap:12px;border-bottom:2px solid #d97706;padding-bottom:14px;margin-bottom:24px}.er-brand-mark{font-size:18px;font-weight:900;color:#b45309}.er-brand-name{font-size:14px;font-weight:700}.er-brand-caption{font-size:10px;color:#555;margin-top:4px}.er-identity{display:flex;justify-content:space-between;gap:24px;margin-bottom:38px;font-size:14px}.er-identity span{border-bottom:1px solid #888;flex:1;padding:0 4px 5px;overflow-wrap:anywhere}.er-identity strong{margin-right:8px}.er-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:38px 24px}.er-card-entry{display:flex;align-items:flex-end;gap:10px;break-inside:avoid}.er-box{flex:1;min-width:0}.er-box h3{font-size:14px;text-align:center;margin:0 0 5px;font-weight:700}.evaluation-record-sheet table{border-collapse:collapse;width:100%;table-layout:fixed;color:#171717}.evaluation-record-sheet th,.evaluation-record-sheet td{border:1px solid #222;padding:9px 4px;text-align:center;font-size:12px}.evaluation-record-sheet th{height:46px;font-weight:700;vertical-align:middle}.evaluation-record-sheet td{height:42px;font-weight:600;font-size:16px}.evaluation-record-sheet em{font-weight:400;font-size:11px;display:block}.er-summary{margin-top:40px;break-inside:avoid}.er-summary h3{text-align:center;font-size:22px;text-decoration:underline;margin:0 0 14px}.er-empty{text-align:center;padding:30px 0;color:#555}.er-round{font-size:12px;margin:0 0 15px;color:#444}.er-totals{display:block;width:100%}.er-totals-table th{overflow-wrap:anywhere}.er-totals .er-box{flex:1}.er-totals th{font-size:11px;height:94px;box-sizing:border-box}.er-totals .er-box:first-child{flex:1.5}.er-notice{text-align:center;font-size:11px;color:#555;margin-top:16px}@media(max-width:600px){.evaluation-record-sheet{padding:24px 14px}.er-cards{grid-template-columns:1fr;gap:24px}.er-totals{flex-wrap:wrap}.er-totals .er-box{min-width:90px}.er-identity{flex-wrap:wrap;gap:15px}.evaluation-record-sheet h2{font-size:17px}}@media print{.evaluation-record-sheet{width:210mm;max-width:none;margin:0;padding:18mm 14mm;break-after:page}.evaluation-record-sheet:last-child{break-after:auto}.er-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:12mm 7mm}.er-card-entry{break-inside:avoid}.er-summary{break-inside:avoid}.er-totals{flex-wrap:nowrap}.er-identity{flex-wrap:nowrap}.er-totals th{height:27mm;font-size:9pt!important}.evaluation-record-sheet th{font-size:11pt}.evaluation-record-sheet td{font-size:14pt}@page{size:A4;margin:0}}`;
}
function evaluationCardHasEntries(card) {
  return (card.days||[]).some(day=>['logTimestamp','wakingTime','morningChapters','laterChapters','bibleBook','recitedMemory','fidJournaling','prayer10mins','dataValidity','fidFocus','journalNotes','difDiscovery','difInsight','difFruit','cbId'].some(key=>Boolean(day[key]))) ||
    (card.weeks||[]).some(week=>week.sharedFid) || Number(card.archivedGrowthPoints||card.totalScore)>0;
}
function buildEvaluationRecordHTML(state, evaluations = {}) {
  const cards=collectBookletCards(state).filter(evaluationCardHasEntries),esc=escapeCardText;
  let growth=0,laxity=0;
  const availableSessions=new Set();
  const box=(heading,columns,values)=>`<div class="er-box">${heading?`<h3>${heading}</h3>`:''}<table><thead><tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody><tr>${values.map(v=>`<td>${v}</td>`).join('')}</tr></tbody></table></div>`;
  const entries=cards.map(card=>{
    const stats=calculateScoresForData(card);
    growth+=stats.totalScore;
    // Unfinished future weeks are not failures in a progressive record.
    const now=new Date();now.setHours(0,0,0,0);
    const start=new Date(`${card.commencingDate||''}T00:00:00`);
    const elapsed=Number.isNaN(start.getTime())?0:Math.max(0,Math.min(28,Math.floor((now-start)/86400000)));
    const weekLaxity=stats.weeks.reduce((sum,week,index)=>{
      const filled=(card.days||[]).slice(index*7,index*7+7).filter(day=>evaluationCardHasEntries({days:[day]})).length;
      return sum+(elapsed>=(index+1)*7||filled===7?week.laxity:0);
    },0);
    laxity+=weekLaxity;
    const n=cardDisplayNumber(card),session=n-1;
    let html=box(`Challenger Card ${String(cardDisplayNumber(card)).padStart(2,'0')}`,['GROWTH<br>POINTS','LAXITY'],[stats.totalScore,weekLaxity]);
    if(session>=1&&session<=7){
      const e=evaluations[session];availableSessions.add(session);
      const score=e?Object.values(e.diligence||{}).filter(Boolean).length*10:'—';
      html+=box('Evaluation Sheet',[`DILIGENCE<br>SCORE<em>(From Session ${session})</em>`],[score]);
    }
    return `<div class="er-card-entry" data-evaluation-card="${n}">${html}</div>`;
  }).join('');
  const diligence=[...availableSessions].reduce((sum,n)=>sum+Object.values(evaluations[n]?.diligence||{}).filter(Boolean).length*10,0);
  const bonus=availableSessions.has(7)?Object.values(evaluations[7]?.bonus||{}).filter(Boolean).length*50:0;
  const final=availableSessions.has(7)&&Boolean(evaluations[7]?.submittedAt);
  const totals=`<table class="er-totals-table"><colgroup><col style="width:20%"><col style="width:16%"><col style="width:22%"><col style="width:18%"><col style="width:24%"></colgroup><thead><tr><th>TOTAL<br>GROWTH<br>POINTS<em>(From available cards)</em></th><th>TOTAL<br>LAXITY</th><th>TOTAL<br>DILIGENCE<br>SCORE<em>(Available evaluations)</em></th><th>BONUS<br>POINTS<em>(Out of 300)</em></th><th>TOTAL POINTS<em>(Total Growth Pts + Total Diligence Score + Bonus Points)</em></th></tr></thead><tbody><tr>${[growth,laxity,diligence,bonus,growth+diligence+bonus].map(n=>`<td>${n}</td>`).join('')}</tr></tbody></table>`;
  return `<style>${evaluationRecordStyles()}</style><article class="evaluation-record-sheet"><h2>${esc((state.cohort||'PERSONAL READING').toUpperCase())} EVALUATION TABULATION CARD</h2><div class="er-identity"><span><strong>NAME:</strong>${esc(state.username||'')}</span><span><strong>PEG No.</strong>${esc(state.peg||'')}</span></div>${cards.length?`<div class="er-cards">${entries}</div><section class="er-summary"><h3>${final?'FINAL EVALUATION':'EVALUATION TO DATE'}</h3><div class="er-totals">${totals}</div>${final?'':'<p class="er-notice">This record progresses as cards are filled. Unfinished weeks are excluded from laxity.</p>'}</section>`:'<p class="er-empty">No card entries yet. Your evaluation record will appear as you fill your cards.</p>'}</article>`;
}
async function renderEvaluationRecord() {
  const target=document.getElementById('evaluation-record-content');
  if(!target||!appState)return;
  target.textContent='Loading evaluation record…';
  try {const evaluations=await getSessionEvaluationsForPrint();target.innerHTML=buildEvaluationRecordHTML(appState,evaluations);}catch(e){target.textContent='Could not load the evaluation record. Please try again.';}
}
async function printEvaluationRecord(state=appState,evaluations=null) {
  try {
    const data=evaluations||await getSessionEvaluationsForPrint();
    const name=(state.username||'Member').replace(/[^a-zA-Z0-9-]+/g,'-');
    await downloadEvaluationPDF(buildEvaluationRecordHTML(state,data),`CBR-Evaluation-Record-${name}.pdf`);
  } catch(e){showToast('Could not download the evaluation record. Please try again.','error');console.error(e);}
}
