const {test}=require('node:test');
const assert=require('node:assert/strict');
const {bibleJourneyProgress:progress,bibleJourneyForecast:forecast}=require('../static/js/tabs/bible-journey.js');
const books=[{name:'Genesis',chapters:50}];
const today=new Date('2026-09-10T12:00:00');
test('deduplicates live snapshots and rereads; ignores future and invalid ranges',()=>{
 const state={activeInstanceId:'a',commencingDate:'2026-09-09',days:[{dayNumber:1,readingPassages:[{book:'Genesis',startChapter:1,endChapter:3},{book:'Genesis',startChapter:2,endChapter:4}]},{dayNumber:2,readingPassages:[{book:'Genesis',startChapter:0,endChapter:50}]},{dayNumber:3,readingPassages:[{book:'Genesis',startChapter:5,endChapter:50}]}],savedCards:[{instanceId:'a',commencingDate:'2026-09-01',days:[{bibleBook:'Genesis',startChapter:1,endChapter:50}]}]};
 const result=progress(state,books,today);assert.equal(result.done,4);assert.equal(result.timeline.size,1);assert.equal(result.remaining,46);
});
test('legacy passages and missing references',()=>{
 const r=progress({commencingDate:'2026-09-01',days:[{bibleBook:'Genesis',startChapter:1,endChapter:50},{morningChapters:8}]},books,today);assert.equal(r.done,50);assert.equal(r.unidentified,8);
});
test('constant speeds and completion boundaries',()=>{
 assert.equal(forecast(1189,7,{},today).days,170);assert.equal(forecast(1189,8,{},today).days,149);assert.equal(forecast(0,7,{},today).days,0);assert.equal(forecast(10,0,{},today),null);assert.equal(forecast(10,1.5,{},today),null);
});
test('normal plan increases after remaining card days and caps at seven',()=>{
 const state={currentCardId:1,commencingDate:'2026-09-10'};
 assert.equal(forecast(27,'normal',state,today).days,27);
 assert.equal(forecast(29,'normal',state,today).days,28);
 assert.equal(forecast(14,'normal',{currentCardId:7,commencingDate:'2026-01-01'},today).days,2);
});
