import unittest
import json
from pathlib import Path
import shutil
import subprocess

from engine.core import BOOK_TO_INDEX, CANONICAL_BOOKS, extract_all_verse_references_from_sentence, get_reference_pattern, get_verse_text


class ScriptureReferenceTest(unittest.TestCase):
    def test_every_canonical_book(self):
        for book_index, name in enumerate(CANONICAL_BOOKS, 1):
            with self.subTest(book=name):
                self.assertEqual(
                    extract_all_verse_references_from_sentence(f'{name} 1:1'),
                    [(book_index, '1', '1', None)],
                )

    def test_common_formats(self):
        cases = {
            'Jos 1:8 and Rev 1:3': [(6, '1', '8', None), (66, '1', '3', None)],
            'Gal. 6:6–10': [(48, '6', '6', '10')],
            'II Tim. 4 : 7 — 8': [(55, '4', '7', '8')],
            '1Cor9:24-27': [(46, '9', '24', '27')],
            'First John 1.9': [(62, '1', '9', None)],
            'John 3:16,18; 4:1-3': [(43, '3', '16', None), (43, '3', '18', None), (43, '4', '1', '3')],
            'Song of Songs 2:1': [(22, '2', '1', None)],
            'Yoshua 1:8 & Ufunuo wa Yohana 1:3': [(6, '1', '8', None), (66, '1', '3', None)],
            'Jos 1:8, Psa 1:1-3, 2 Tim 2:7': [(6, '1', '8', None), (19, '1', '1', '3'), (55, '2', '7', None)],
            'Rom 15:8, 1 Cor 15:3-4 and Jn 2:22': [(45, '15', '8', None), (46, '15', '3', '4'), (43, '2', '22', None)],
            '2 Ki 22 & 23': [(12, '22', None, None), (12, '23', None, None)],
            'Memorize James 1:25 & Heb 4:12.': [(59, '1', '25', None), (58, '4', '12', None)],
            'Jos 1:8 and Rev 1:3.': [(6, '1', '8', None), (66, '1', '3', None)],
            'Psalm 1:1-6.': [(19, '1', '1', '6')],
            'Deut 6:6-9.': [(5, '6', '6', '9')],
        }
        for reference, expected in cases.items():
            with self.subTest(reference=reference):
                self.assertEqual(extract_all_verse_references_from_sentence(reference), expected)

    def test_every_registered_alias(self):
        for alias, book_index in BOOK_TO_INDEX.items():
            for reference in (f'{alias} 1:1', f'{alias.upper()}. 1 : 1', f'{alias} 1:1.'):
                with self.subTest(reference=reference):
                    self.assertEqual(extract_all_verse_references_from_sentence(reference), [(book_index, '1', '1', None)])

    @unittest.skipUnless(shutil.which('node'), 'Node.js is required for browser parser checks')
    def test_browser_uses_server_pattern(self):
        source_path = Path(__file__).resolve().parents[1] / 'static/js/scripture-refs.js'
        references = [f'{alias}. 1:1' for alias in BOOK_TO_INDEX]
        references += ['Gal. 6:6-10', 'jos1:8', 'II Tim. 4:7–8', 'John 3:16,18; 4:1-3', 'John 3:36-4:2', '2 Ki 22 & 23']
        script = '''
const fs = require('fs');
const vm = require('vm');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
global.window = {scriptureReferencePattern: input.pattern};
global.document = {readyState: 'loading', addEventListener() {}};
vm.runInThisContext(fs.readFileSync(input.source, 'utf8'));
for (const reference of input.references) {
  const matches = [...reference.matchAll(window.getBibleRefRegex())];
  if (matches.length !== 1 || matches[0][0] !== reference) {
    throw new Error('Reference not fully detected: ' + reference);
  }
}
for (const [text, expected] of [
  ['Jos 1:8, Psa 1:1-3, 2 Tim 2:7', ['Jos 1:8', 'Psa 1:1-3', '2 Tim 2:7']],
  ['Rom 15:8, 1 Cor 15:3-4 and Jn 2:22', ['Rom 15:8', '1 Cor 15:3-4', 'Jn 2:22']],
  ['Memorize James 1:25 & Heb 4:12.', ['James 1:25', 'Heb 4:12']],
  ['Jos 1:8 and Rev 1:3.', ['Jos 1:8', 'Rev 1:3']],
  ['Psalm 1:1-6.', ['Psalm 1:1-6']],
  ['Deut 6:6-9.', ['Deut 6:6-9']]
]) {
  const actual = [...text.matchAll(window.getBibleRefRegex())].map(match => match[0]);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(JSON.stringify(actual));
}
'''
        subprocess.run(['node', '-e', script], input=json.dumps({
            'pattern': get_reference_pattern(), 'source': str(source_path), 'references': references,
        }), text=True, check=True, capture_output=True)

    def test_memory_assignment_returns_both_passages(self):
        passages = get_verse_text('Jos 1:8 and Rev 1:3', 'NIV')[3]
        self.assertEqual([passage['reference'] for passage in passages], ['Joshua 1:8', 'Revelation 1:3'])

    def test_cross_chapter_range(self):
        passages = get_verse_text('John 3:36-4:2', 'NIV')[3]
        self.assertEqual([passage['reference'] for passage in passages], ['John 3:36', 'John 4:1-2'])

    def test_whole_chapters(self):
        passages = get_verse_text('2 Ki 22 & 23', 'NIV')[3]
        self.assertEqual([passage['chapter'] for passage in passages], ['22', '23'])
        self.assertEqual([len(passage['verses_list']) for passage in passages], [20, 37])


if __name__ == '__main__':
    unittest.main()
