"""
CBR Challenger Universal Adaptive Bible Engine (Index-Based Architecture)
Uses Canonical Book Indices (1 to 66) as the universal primary key.
Automatically discovers and processes ANY Bible XML schema or pattern inside engine/bible_text/.
Features 100% deterministic reference extraction, multi-passage separation, and dynamic translation discovery.
"""
import os
import re
import xml.etree.ElementTree as ET
from functools import lru_cache

BIBLE_TEXT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bible_text')

# 66 Canonical Books in exact order (Index 1 to 66)
CANONICAL_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
    "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John", "Jude", "Revelation"
]

# Build universal book name -> book index (1..66) mapping
BOOK_TO_INDEX = {}
for idx, name in enumerate(CANONICAL_BOOKS, 1):
    BOOK_TO_INDEX[name.lower()] = idx

# Swahili mappings
SWAHILI_MAP = {
    1: "Mwanzo", 2: "Kutoka", 3: "Mambo ya Walawi", 4: "Hesabu", 5: "Kumbukumbu la Torati",
    6: "Yoshua", 7: "Waamuzi", 8: "Ruthu", 9: "1 Samueli", 10: "2 Samueli", 11: "1 Wafalme",
    12: "2 Wafalme", 13: "1 Mambo ya Nyakati", 14: "2 Mambo ya Nyakati", 15: "Ezra", 16: "Nehemia",
    17: "Esta", 18: "Ayubu", 19: "Zaburi", 20: "Mithali", 21: "Mhubiri", 22: "Wimbo Ulio Bora",
    23: "Isaya", 24: "Yeremia", 25: "Maombolezo", 26: "Ezekieli", 27: "Danieli", 28: "Hosea",
    29: "Yoeli", 30: "Amosi", 31: "Obadia", 32: "Yona", 33: "Mika", 34: "Nahumu", 35: "Habakuki",
    36: "Sefania", 37: "Hagai", 38: "Zekaria", 39: "Malaki",
    40: "Mathayo", 41: "Marko", 42: "Luka", 43: "Yohana", 44: "Matendo ya Mitume", 45: "Warumi",
    46: "1 Wakorintho", 47: "2 Wakorintho", 48: "Wagalatia", 49: "Waefeso", 50: "Wafilipi",
    51: "Wakolosai", 52: "1 Wathesalonike", 53: "2 Wathesalonike", 54: "1 Timotheo",
    55: "2 Timotheo", 56: "Tito", 57: "Filemoni", 58: "Waebrania", 59: "Yakobo", 60: "1 Petro",
    61: "2 Petro", 62: "1 Yohana", 63: "2 Yohana", 64: "3 Yohana", 65: "Yuda", 66: "Ufunuo wa Yohana"
}
for idx, swa_name in SWAHILI_MAP.items():
    BOOK_TO_INDEX[swa_name.lower()] = idx

# Common abbreviations mapping -> index (1..66)
ABBREV_INDEX = {
    "gen": 1, "ex": 2, "exod": 2, "lev": 3, "num": 4, "deut": 5, "josh": 6, "judg": 7, "1 sam": 9,
    "2 sam": 10, "1 kgs": 11, "2 kgs": 12, "1 chron": 13, "2 chron": 14, "ps": 19, "psa": 19,
    "psalm": 19, "prov": 20, "eccl": 21, "song": 22, "isa": 23, "jer": 24, "lam": 25, "ezek": 26,
    "dan": 27, "hos": 28, "obad": 31, "mic": 33, "hab": 35, "zeph": 36, "hag": 37, "zech": 38,
    "mal": 39, "matt": 40, "mat": 40, "mrk": 41, "luk": 42, "jhn": 43, "rom": 45, "1 cor": 46,
    "2 cor": 47, "gal": 48, "eph": 49, "phil": 50, "col": 51, "1 thess": 52, "2 thess": 53,
    "1 tim": 54, "2 tim": 55, "tit": 56, "phlm": 57, "heb": 58, "jas": 59, "1 pet": 60, "2 pet": 61,
    "1 jhn": 62, "2 jhn": 63, "3 jhn": 64, "rev": 66
}
for ab, idx in ABBREV_INDEX.items():
    BOOK_TO_INDEX[ab] = idx

def normalize_book_index(raw_book_str):
    """Convert any book name string, abbreviation, or Swahili name into its integer index (1..66)."""
    if not raw_book_str: return None
    cleaned = raw_book_str.strip().lower()
    if cleaned in BOOK_TO_INDEX:
        return BOOK_TO_INDEX[cleaned]
    # Check partial match on standard names
    for name in CANONICAL_BOOKS:
        if cleaned == name.lower() or name.lower().startswith(cleaned):
            return BOOK_TO_INDEX[name.lower()]
    for idx, swa in SWAHILI_MAP.items():
        if cleaned == swa.lower() or swa.lower().startswith(cleaned):
            return idx
    return None

def get_available_versions():
    """Dynamically discover all Bible translation XMLs inside engine/bible_text/ without hardcoding."""
    if not os.path.exists(BIBLE_TEXT_DIR):
        os.makedirs(BIBLE_TEXT_DIR, exist_ok=True)
        return []
    
    files = sorted(os.listdir(BIBLE_TEXT_DIR))
    versions = []
    names = {
        "NIV": "New International Version",
        "AMP": "Amplified Bible",
        "ESV": "English Standard Version",
        "KJV": "King James Version",
        "MSG": "The Message",
        "NASB": "New American Standard Bible",
        "NKJV": "New King James Version",
        "NLT": "New Living Translation",
        "RSV": "Revised Standard Version",
        "SVV": "Statenvertaling",
        "SWAB": "Swahili Bible (Kiswahili)"
    }
    for f in files:
        if f.endswith('.xml'):
            code = f[:-4].upper()
            name = names.get(code, f"{code} Translation")
            versions.append({"code": code, "name": name})
    return versions

def normalize_book_name(book_idx, version="NIV"):
    """Return localized canonical book title for a given book index (1..66)."""
    if not isinstance(book_idx, int) or not (1 <= book_idx <= 66):
        return str(book_idx)
    if version.upper() == "SWAB":
        return SWAHILI_MAP.get(book_idx, CANONICAL_BOOKS[book_idx - 1])
    return CANONICAL_BOOKS[book_idx - 1]

def extract_all_verse_references_from_sentence(sentence):
    """
    Extract ALL scripture references from inside any instruction string and resolve to canonical book index.
    Example: '1 Cor 9:24-27 and 1 Tim 4:7-8' -> [(46, '9', '24', '27'), (54, '4', '7', '8')]
    """
    if not sentence: return []
    matches = list(re.finditer(r'\b(\d+):(\d+)(?:-(\d+))?\b', sentence))
    if not matches: return []
    
    # Sort all known strings longest first
    all_known_strings = sorted(BOOK_TO_INDEX.keys(), key=lambda s: len(s), reverse=True)
    
    results = []
    for match in matches:
        ch, v_start, v_end = match.group(1), match.group(2), match.group(3)
        prefix = sentence[:match.start()].strip()
        prefix_low = prefix.lower()
        
        for book_cand in all_known_strings:
            if prefix_low.endswith(book_cand):
                idx_boundary = len(prefix_low) - len(book_cand)
                if idx_boundary == 0 or not prefix_low[idx_boundary - 1].isalnum():
                    book_idx = BOOK_TO_INDEX[book_cand]
                    results.append((book_idx, ch, v_start, v_end))
                    break
    return results

def _extract_text_recursive(elem):
    """Safely get all text inside an XML element including nested tags."""
    text = elem.text or ""
    for child in elem:
        text += _extract_text_recursive(child)
        if child.tail:
            text += child.tail
    return re.sub(r'\s+', ' ', text).strip()

@lru_cache(maxsize=24)
def get_parsed_bible(version="NIV"):
    """
    Universal Adaptive Index-Based Parser:
    Maps Book Elements sequentially to canonical book index (1..66).
    Returns (index, version) where index is { int_book_idx: { str_chapter: { str_verse: text } } }
    """
    version = version.upper().replace(".XML", "")
    filepath = os.path.join(BIBLE_TEXT_DIR, f"{version}.xml")
    if not os.path.exists(filepath):
        filepath = os.path.join(BIBLE_TEXT_DIR, "NIV.xml")
        version = "NIV"
        if not os.path.exists(filepath):
            return {}, version

    tree = ET.parse(filepath)
    root = tree.getroot()
    index = {}

    # Tier 1: Known standard tags fast-path mapped to book order 1..66
    if root.tag == "bible":
        for b_idx, b in enumerate(root.findall("b"), 1):
            if b_idx > 66: break
            index[b_idx] = {}
            for c in b.findall("c"):
                cnum = str(c.get("n", "")).strip()
                index[b_idx][cnum] = {}
                for v in c.findall("v"):
                    vnum = str(v.get("n", "")).strip()
                    vtext = _extract_text_recursive(v)
                    index[b_idx][cnum][vnum] = vtext
        if index: return index, version

    if root.tag in ("XMLBIBLE", "BIBLE"):
        for b_idx, b in enumerate(root.findall("BIBLEBOOK"), 1):
            if b_idx > 66: break
            index[b_idx] = {}
            for c in b.findall("CHAPTER"):
                cnum = str(c.get("cnumber", "")).strip()
                index[b_idx][cnum] = {}
                for v in c.findall("VERS"):
                    vnum = str(v.get("vnumber", "")).strip()
                    vtext = _extract_text_recursive(v)
                    index[b_idx][cnum][vnum] = vtext
        if index: return index, version

    # Tier 2: Universal Auto-Discovery Heuristic mapped by sequence
    book_candidates = list(root)
    if len(book_candidates) == 1 and len(list(book_candidates[0])) > 50:
        book_candidates = list(book_candidates[0])

    for b_idx, b_elem in enumerate(book_candidates, 1):
        if b_idx > 66: break
        index[b_idx] = {}
        chapter_candidates = list(b_elem)
        for c_idx, c_elem in enumerate(chapter_candidates):
            cnum = c_elem.get("n") or c_elem.get("cnumber") or c_elem.get("number") or c_elem.get("id") or str(c_idx + 1)
            cnum = str(cnum).strip()
            index[b_idx][cnum] = {}
            verse_candidates = list(c_elem)
            for v_idx, v_elem in enumerate(verse_candidates):
                vnum = v_elem.get("n") or v_elem.get("vnumber") or v_elem.get("number") or v_elem.get("id") or str(v_idx + 1)
                vnum = str(vnum).strip()
                vtext = _extract_text_recursive(v_elem)
                index[b_idx][cnum][vnum] = vtext

    return index, version

def get_verse_text(reference_string, version="NIV"):
    """
    Looks up single or multiple passages deterministically using integer book indices (1..66).
    Returns (final_text, actual_ver, final_clean_ref, passages_list)
    """
    if not reference_string or not reference_string.strip():
        return None, version, None, []

    ref = reference_string.strip()
    extracted_list = extract_all_verse_references_from_sentence(ref)
    
    if not extracted_list:
        match = re.match(r'^([\d\sA-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$', ref)
        if match:
            raw_book, ch, vs, ve = match.groups()
            book_idx = normalize_book_index(raw_book)
            if book_idx:
                extracted_list = [(book_idx, ch, vs, ve)]
    
    if not extracted_list:
        return None, version, None, []

    index, actual_ver = get_parsed_bible(version)
    combined_texts = []
    clean_refs = []
    passages = []

    for book_idx, chapter, start_verse, end_verse in extracted_list:
        if book_idx not in index or chapter not in index[book_idx]:
            continue

        ch_data = index[book_idx][chapter]
        v_start = int(start_verse)
        v_end = int(end_verse) if end_verse else v_start

        verses_out = []
        verses_list = []
        for v in range(v_start, v_end + 1):
            v_str = str(v)
            if v_str in ch_data:
                verses_list.append({"num": v_str, "text": ch_data[v_str]})
                if v_end > v_start:
                    verses_out.append(f"{v_str} {ch_data[v_str]}")
                else:
                    verses_out.append(ch_data[v_str])

        if verses_out:
            localized_book = normalize_book_name(book_idx, actual_ver)
            clean_r = f"{localized_book} {chapter}:{v_start}" + (f"-{v_end}" if v_end > v_start else "")
            clean_refs.append(clean_r)
            passage_text = " ".join(verses_out)
            
            passages.append({
                "book_index": book_idx,
                "book_name": localized_book,
                "chapter": chapter,
                "verses": f"{v_start}" + (f"-{v_end}" if v_end > v_start else ""),
                "reference": clean_r,
                "verses_list": verses_list,
                "text": passage_text
            })
            
            combined_texts.append(f"[{clean_r}]\n{passage_text}")

    if not passages:
        return None, actual_ver, None, []

    final_clean_ref = " & ".join(clean_refs)
    final_text = "\n\n".join(combined_texts)
    return final_text, actual_ver, final_clean_ref, passages
