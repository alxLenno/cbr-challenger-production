const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('reference observer ignores comments while processing new elements and text', () => {
  const scanned = [];
  let onMutation;
  const element = (tagName = 'DIV', parentElement = null) => ({
    nodeType: 1, tagName, parentElement, isConnected: true,
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    matches: () => false, classList: {contains: () => false}
  });
  const body = element('BODY');
  const context = {
    window: {scriptureReferencePattern: '(Psalm) (119)'},
    Node: {ELEMENT_NODE: 1, TEXT_NODE: 3},
    NodeFilter: {SHOW_TEXT: 4},
    document: {
      body, readyState: 'complete',
      createTreeWalker(root) { scanned.push(root); return {nextNode: () => null}; }
    },
    MutationObserver: class {
      constructor(callback) { onMutation = callback; }
      observe() {}
    }
  };
  vm.runInNewContext(fs.readFileSync('static/js/scripture-refs.js', 'utf8'), context);
  scanned.length = 0;
  const section = element('SECTION', body);
  const comment = {nodeType: 8, isConnected: true, parentElement: body};
  const text = {nodeType: 3, isConnected: true, parentElement: section};
  assert.doesNotThrow(() => onMutation([{type: 'childList', addedNodes: [comment, section, text]}]));
  assert.deepEqual(scanned, [section]);

  scanned.length = 0;
  const svg = {...element('svg', body), namespaceURI: 'http://www.w3.org/2000/svg'};
  onMutation([{type: 'childList', addedNodes: [svg]}]);
  assert.equal(scanned.length, 0);
});
