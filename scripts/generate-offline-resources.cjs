// Run with Playwright available through NODE_PATH (or installed locally).
const fs=require('fs'),path=require('path'),vm=require('vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'static/pdfs/offline');
const context=vm.createContext({window:{addEventListener(){}},timeStringToDecimal:v=>v?Number(v.split(':')[0])+Number(v.split(':')[1])/60:null});
for(const file of ['data','card-generator'])vm.runInContext(fs.readFileSync(path.join(root,`static/js/${file}.js`),'utf8'),context);
const css=fs.readFileSync(path.join(root,'static/css/card-print.css'),'utf8');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch();const page=await browser.newPage();
 for(let n=1;n<=8;n++){
  const data={currentCardId:n,commencingDate:'2099-01-01',username:'',contact:'',church:'',cohort:'',peg:'',round:1,days:Array.from({length:28},(_,i)=>({dayNumber:i+1})),weeks:Array.from({length:4},(_,i)=>({weekNumber:i+1,sharedFid:false}))};
  const html=context.buildChallengerCardHTML(data);
  await page.setContent(`<html><head><style>${css}html,body{margin:0;padding:0;background:white}.offline-sheet{width:198mm;height:281mm;overflow:hidden;margin:0 auto}.offline-sheet .cc-root{width:194mm;margin:0;box-sizing:border-box}.offline-sheet .cc-date-row{min-height:10mm;align-items:flex-end;padding:2mm 2mm;gap:4mm}.offline-sheet .cc-date-row .field-group{align-items:flex-end}.offline-sheet .field-val{min-height:6mm}.offline-sheet .cc-round-row{min-height:11mm;align-items:center}.offline-sheet .cc-round-row>span:last-child{min-width:42mm}@page{size:A4;margin:8mm 6mm}</style></head><body><div class="offline-sheet challenger-card-replica">${html}</div></body></html>`);
  await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('.cc-date-row')];
   const field=(label,flex=1)=>`<div class="field-group" style="flex:${flex}"><span class="field-label">${label}:</span><span class="field-val"></span></div>`;
   rows[0].outerHTML=`<div class="cc-date-row">${field('NAME',2)}${field('TELEPHONE')}</div><div class="cc-date-row">${field('CHURCH / FELLOWSHIP')}</div><div class="cc-date-row">${field('COHORT')}${field('PEG NUMBER')}${field('READING ROUND')}</div>`;
   rows[1].remove();
   document.querySelectorAll('.field-val,.week-score').forEach(e=>e.textContent='');
   const date=document.querySelector('.cc-round-row > span:last-child span');if(date)date.textContent='____________';
   document.querySelectorAll('.cc-cal-table tr').forEach(row=>row.querySelectorAll('td:not(.row-label):not([rowspan])').forEach(cell=>cell.textContent=''));
   document.querySelectorAll('.has-x,.has-check,.selected').forEach(e=>e.classList.remove('has-x','has-check','selected'));
   const card=document.querySelector('.cc-root');card.style.zoom=Math.min(1,1045/card.scrollHeight);
  });
  await page.pdf({path:path.join(out,`challenger-card-${String(n).padStart(2,'0')}.pdf`),format:'A4',printBackground:true,preferCSSPageSize:true});
 }
 const html=context.buildSessionEvaluationPrintHTML({},{});
 await page.setContent(`<html><head><style>${css}html,body{margin:0;padding:0;background:white}@page{size:A4;margin:10mm}.cc-session-evaluation-page{margin:0;width:190mm;min-height:0}</style></head><body><div class="challenger-card-replica">${html}</div></body></html>`);
 await page.evaluate(()=>{document.querySelectorAll('td').forEach(e=>{if(e.textContent.trim()==='0')e.textContent='';});document.querySelectorAll('.cc-eval-check,.cc-eval-main-table td:not(.cc-eval-criterion):not(.cc-eval-course-score)').forEach(e=>e.textContent='');document.querySelector('.cc-eval-reader-meta').innerHTML='NAME: ____________________<br>COHORT: __________ PEG: __________';document.querySelectorAll('strong').forEach(e=>{if(e.textContent==='Bible Reader'||/^\d+$/.test(e.textContent.trim()))e.textContent='________';});});
 await page.pdf({path:path.join(out,'session-evaluation.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 const template=fs.readFileSync(path.join(root,'static/images/evaluation-record-template.png')).toString('base64');
 await page.setContent(`<html><head><style>@page{size:A4;margin:0}html,body{margin:0}img{width:210mm;height:297mm;display:block}</style></head><body><img src="data:image/png;base64,${template}"></body></html>`);
 await page.waitForFunction(()=>document.images[0].complete);
 await page.evaluate(()=>{const title=document.createElement('div');title.textContent='COHORT ______ EVALUATION TABULATION CARD';title.style.cssText='position:absolute;left:16.8mm;top:13.4mm;width:176.4mm;height:9mm;background:white;text-align:center;font:bold 18pt Arial;padding-top:3px';document.body.append(title);});
 await page.pdf({path:path.join(out,'evaluation-record.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 await browser.close();
 require('child_process').execFileSync('python3',['-c',`import sys
from pathlib import Path
from pypdf import PdfWriter
p=Path(sys.argv[1]);w=PdfWriter()
for f in sorted(p.glob('challenger-card-*.pdf'))+[p/'session-evaluation.pdf',p/'evaluation-record.pdf']:w.append(str(f))
with (p/'all-templates.pdf').open('wb') as target:w.write(target)`,out]);
 console.log('Generated ten blank templates and the combined download.');
})().catch(e=>{console.error(e);process.exit(1)});
