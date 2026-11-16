const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm');
const c=vm.createContext({window:{addEventListener(){}},timeStringToDecimal:v=>v?Number(v.split(':')[0])+Number(v.split(':')[1])/60:null});
for(const f of ['data','card-generator','evaluation-record','tabs/session_eval'])vm.runInContext(fs.readFileSync(`static/js/${f}.js`,'utf8'),c);
test('card 8 is session 7 while card 7 uses the agreed repeated target',()=>{
 assert.equal(c.seSessionForCard(8),7);
 assert.equal(c.seSessionForCard(2),1);
 assert.equal(vm.runInContext('CBR_DATA.cards.find(c=>c.cardId===7).chaptersTarget',c),6);
});
test('record excludes empty and future cards and grows with actual entries',()=>{
 const card=n=>({currentCardId:n,instanceId:'c'+n,round:1,commencingDate:'2099-01-01',days:[{dayNumber:1,morningChapters:1}],weeks:[]});
 const empty={...card(3),days:[]};
 const html=c.buildEvaluationRecordHTML({username:'<Member>',adminExport:true,savedCards:[card(1),card(2),empty]},{});
 assert.match(html,/Challenger Card 01/);assert.match(html,/Challenger Card 02/);
 assert.doesNotMatch(html,/Challenger Card 03/);assert.doesNotMatch(html,/Challenger Card 08/);
 assert.match(html,/EVALUATION TO DATE/);assert.doesNotMatch(html,/FINAL EVALUATION/);
 assert.match(html,/&lt;Member&gt;/);assert.equal((html.match(/data-evaluation-card=/g)||[]).length,2);
 assert.match(html,/<td>0<\/td>/);
 const blank=c.buildEvaluationRecordHTML({adminExport:true,savedCards:[empty]},{});
 assert.match(blank,/No card entries yet/);assert.doesNotMatch(blank,/Challenger Card 03/);
});
test('record includes cards beyond eight and finalizes only with submitted Session 7',()=>{
 const card=n=>({currentCardId:n,instanceId:'c'+n,days:[{dayNumber:1,morningChapters:1}],weeks:[]});
 const html=c.buildEvaluationRecordHTML({adminExport:true,savedCards:[card(8),card(9)]},{7:{submittedAt:'2026-11-12',diligence:{1:true},bonus:{7:true}}});
 assert.match(html,/Challenger Card 09/);assert.match(html,/FINAL EVALUATION/);assert.match(html,/<td>60<\/td>/);
});
