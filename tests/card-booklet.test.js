const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({
  timeStringToDecimal: value => value ? Number(value.split(':')[0]) + Number(value.split(':')[1]) / 60 : null
});
vm.runInContext(fs.readFileSync('static/js/data.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('static/js/card-generator.js', 'utf8'), context);
const card = (id, round, instanceId) => ({ currentCardId: id, round, instanceId, commencingDate: '2026-10-05', username: 'Test User', cohort: 'Cohort 12', peg: 'PEG 8', days: [], weeks: [] });
test('booklet keeps distinct rounds and uses live data once for the active instance', () => {
  const active = { ...card(2, 1), activeInstanceId: 'active', peg: 'PEG 9' };
  active.savedCards = [card(1, 2, 'second-round'), card(2, 1, 'active'), card(1, 1, 'first-round')];
  const before = JSON.stringify(active);
  const cards = context.collectBookletCards(active);
  assert.deepEqual(Array.from(cards, c => `${c.round}:${c.currentCardId}`), ['1:1', '1:2', '2:1']);
  assert.equal(cards[1].peg, 'PEG 9');
  assert.equal(cards[0].peg, 'PEG 8');
  assert.equal(cards[0].days.length, 28);
  assert.equal(JSON.stringify(active), before);
});
test('booklet has two covers and cohort and PEG on every card, including escaped values', () => {
  const state = { ...card(1, 1), cohort: '<Cohort & 12>', activeInstanceId: 'active', savedCards: [] };
  const cards = context.collectBookletCards(state);
  const html = context.buildChallengerBookletHTML(cards, state);
  assert.equal((html.match(/class="cc-booklet-cover/g) || []).length, 2);
  assert.equal((html.match(/class="cc-booklet-card"/g) || []).length, 1);
  assert.match(html, /COHORT:<\/span><span class="field-val">&lt;Cohort &amp; 12&gt;/);
  assert.match(html, /PEG NUMBER:<\/span><span class="field-val">PEG 8/);
  assert.ok(!html.includes('<Cohort & 12>'));
});
test('missing historical details are explicit and are not replaced by current profile values', () => {
  const archived = card(1, 1, 'old');
  delete archived.cohort;
  delete archived.peg;
  const state = { ...card(2, 1), activeInstanceId: 'active', savedCards: [archived] };
  const cards = context.collectBookletCards(state);
  assert.match(context.buildChallengerCardHTML(cards[0]), /COHORT:<\/span><span class="field-val">Not specified/);
});
