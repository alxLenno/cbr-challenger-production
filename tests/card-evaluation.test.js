const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/js/card-generator.js'), 'utf8'), context);

test('PDF course totals include other sessions when printing card 1', () => {
  const sessions = {
    2: { growthPoints: 15 },
    3: { growthPoints: 1 },
    4: { diligence: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true } },
  };
  const html = context.buildSessionEvaluationPrintHTML(sessions, { currentCardId: 1 });
  assert.match(html, /TOTAL SESSIONS SCORE<\/span><strong>76<\/strong>/);
  assert.match(html, /TOTAL POINTS<\/span><strong>76<\/strong>/);
});

test('completed course bonuses appear even when exporting an earlier card', () => {
  const html = context.buildSessionEvaluationPrintHTML({
    7: { diligence: { 1: true }, growthPoints: 40, bonus: { 7: true, 8: true } },
  }, { currentCardId: 2 });
  assert.match(html, /TOTAL SESSIONS SCORE<\/span><strong>50<\/strong>/);
  assert.match(html, /BONUS SCORES<\/span><strong>100<\/strong>/);
  assert.match(html, /TOTAL POINTS<\/span><strong>150<\/strong>/);
});
