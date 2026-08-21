/* =====================================================
   daily-notebook.js — realistic handwritten daily reading export
   Builds a fixed-size, two-page notebook spread without text overflow.
===================================================== */

(function initDailyNotebook(global) {
  'use strict';

  const NOTEBOOK_WIDTH = 1400;
  const NOTEBOOK_HEIGHT = 900;
  const BODY_TOP = 254;
  const BODY_BOTTOM = 666;
  const LEFT_TEXT_X = 222;
  const RIGHT_TEXT_X = 762;
  const LEFT_NUMBER_X = 204;
  const RIGHT_NUMBER_X = 748;
  const LEFT_RULE_END = 668;
  const RIGHT_RULE_END = 1190;
  const LEFT_TEXT_WIDTH = 420;
  const RIGHT_TEXT_WIDTH = 404;
  const FONT_FAMILY = 'CBR Patrick Hand';
  const FONT_STACK = `'${FONT_FAMILY}', 'Patrick Hand', 'Chalkboard SE', 'Comic Sans MS', cursive`;
  const INK_BLUE = '#173f78';
  const INK_RED = '#b92f2f';
  const INK_GRAPHITE = '#302b27';

  function escapeXml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function extractVerseItems(data) {
    const items = [];
    if (!data) return items;

    if (Array.isArray(data.passages)) {
      data.passages.forEach(passage => {
        if (Array.isArray(passage.verses_list) && passage.verses_list.length) {
          passage.verses_list.forEach(verse => {
            const text = String(verse.text || '').trim();
            if (text) items.push({ num: String(verse.num || '').trim(), text });
          });
          return;
        }

        const rawText = String(passage.text || '').trim();
        if (!rawText) return;
        const matches = Array.from(rawText.matchAll(/(?:^|\s)\[?(\d{1,3})\]?\s+(.+?)(?=(?:\s\[?\d{1,3}\]?\s)|$)/gs));
        if (matches.length) {
          matches.forEach(match => items.push({ num: match[1], text: match[2].trim() }));
        } else {
          const lead = rawText.match(/^\[?(\d{1,3})\]?\s+(.+)$/s);
          items.push(lead
            ? { num: lead[1], text: lead[2].trim() }
            : { num: '', text: rawText });
        }
      });
    }

    if (!items.length && data.text) {
      const rawText = String(data.text).trim();
      const lead = rawText.match(/^\[?(\d{1,3})\]?\s+(.+)$/s);
      items.push(lead
        ? { num: lead[1], text: lead[2].trim() }
        : { num: '', text: rawText });
    }
    return items;
  }

  async function ensureHandwritingFont() {
    if (!global.PATRICK_HAND_BASE64 || typeof FontFace === 'undefined' || !document.fonts) return;
    if (global.__cbrPatrickHandReady) {
      await global.__cbrPatrickHandReady;
      return;
    }

    global.__cbrPatrickHandReady = (async () => {
      try {
        const face = new FontFace(
          FONT_FAMILY,
          `url(data:font/woff2;base64,${global.PATRICK_HAND_BASE64}) format('woff2')`,
          { style: 'normal', weight: '400' }
        );
        await face.load();
        document.fonts.add(face);
        await document.fonts.load(`16px '${FONT_FAMILY}'`);
      } catch (error) {
        console.warn('Embedded handwriting font could not be registered:', error);
      }
    })();
    await global.__cbrPatrickHandReady;
  }

  function fallbackMeasure(text, fontSize) {
    const narrow = new Set('fijltI1!.,:;\'|');
    const wide = new Set('mwMWQOG@%');
    let units = 0;
    for (const char of String(text || '')) {
      if (char === ' ') units += 0.25;
      else if (narrow.has(char)) units += 0.32;
      else if (wide.has(char)) units += 0.7;
      else if (/[A-Z0-9]/.test(char)) units += 0.55;
      else units += 0.45;
    }
    return units * fontSize;
  }

  function createTextMeasurer() {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        return (text, fontSize, weight = 400) => {
          context.font = `${weight} ${fontSize}px '${FONT_FAMILY}', 'Patrick Hand', cursive`;
          return context.measureText(String(text || '')).width;
        };
      }
    } catch (_) {}
    return fallbackMeasure;
  }

  function breakLongWord(word, maxWidth, fontSize, measure) {
    const parts = [];
    let part = '';
    for (const char of word) {
      const next = part + char;
      if (part && measure(next, fontSize) > maxWidth) {
        parts.push(part);
        part = char;
      } else {
        part = next;
      }
    }
    if (part) parts.push(part);
    return parts;
  }

  function wrapText(text, maxWidth, fontSize, measure) {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const lines = [];
    let current = '';

    words.forEach(rawWord => {
      const wordParts = measure(rawWord, fontSize) > maxWidth
        ? breakLongWord(rawWord, maxWidth, fontSize, measure)
        : [rawWord];

      wordParts.forEach(word => {
        const candidate = current ? `${current} ${word}` : word;
        if (current && measure(candidate, fontSize) > maxWidth) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      });
    });

    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  function buildWrappedItems(items, maxWidth, fontSize, measure) {
    return items.map(item => ({
      num: item.num,
      lines: wrapText(item.text, maxWidth, fontSize, measure)
    }));
  }

  function chooseSpreadLayout(leftItems, rightItems, measure) {
    const bodyHeight = BODY_BOTTOM - BODY_TOP;
    for (let fontSize = 16; fontSize >= 9.5; fontSize -= 0.5) {
      const lineHeight = Math.max(16, Math.round(fontSize * 1.68 * 10) / 10);
      const verseGap = fontSize >= 13.5 ? 2.2 : 1.2;
      const left = buildWrappedItems(leftItems, LEFT_TEXT_WIDTH, fontSize, measure);
      const right = buildWrappedItems(rightItems, RIGHT_TEXT_WIDTH, fontSize, measure);
      const leftLines = left.reduce((sum, item) => sum + item.lines.length, 0);
      const rightLines = right.reduce((sum, item) => sum + item.lines.length, 0);
      const leftHeight = leftLines * lineHeight + Math.max(0, left.length - 1) * verseGap;
      const rightHeight = rightLines * lineHeight + Math.max(0, right.length - 1) * verseGap;

      if (Math.max(leftHeight, rightHeight) <= bodyHeight) {
        return { fontSize, lineHeight, verseGap, left, right };
      }
    }

    const fontSize = 9;
    const lineHeight = 15.4;
    return {
      fontSize,
      lineHeight,
      verseGap: 0.8,
      left: buildWrappedItems(leftItems, LEFT_TEXT_WIDTH, fontSize, measure),
      right: buildWrappedItems(rightItems, RIGHT_TEXT_WIDTH, fontSize, measure)
    };
  }

  function fitTitleSize(text, maxWidth, measure) {
    for (let size = 25; size >= 15; size -= 0.5) {
      if (measure(text, size, 700) <= maxWidth) return size;
    }
    return 15;
  }

  function inkVariation(index) {
    const xJitter = [0, 0.7, -0.4, 0.25, -0.6, 0.45, -0.15][index % 7];
    const angle = [-0.16, 0.11, -0.06, 0.18, -0.12, 0.07, -0.02][index % 7];
    const opacity = [0.96, 0.99, 0.94, 0.98, 0.95, 0.97, 0.99][index % 7];
    return { xJitter, angle, opacity };
  }

  function renderPageRules(x1, x2, layout) {
    let xml = '<g stroke="#8eadd3" stroke-width="0.8" opacity="0.48">\n';
    for (let y = BODY_TOP; y <= BODY_BOTTOM + 0.1; y += layout.lineHeight) {
      xml += `<line x1="${x1}" y1="${y.toFixed(1)}" x2="${x2}" y2="${y.toFixed(1)}"/>\n`;
    }
    return xml + '</g>\n';
  }

  function renderPageText(wrappedItems, options, layout) {
    const { textX, numberX, clipId } = options;
    let y = BODY_TOP - 2;
    let lineIndex = 0;
    let xml = `<g clip-path="url(#${clipId})" class="notebook-handwriting">\n`;

    wrappedItems.forEach((item, itemIndex) => {
      item.lines.forEach((line, lineInVerse) => {
        const variation = inkVariation(lineIndex);
        const x = textX + variation.xJitter;
        if (lineInVerse === 0 && item.num) {
          xml += `<text x="${numberX}" y="${y.toFixed(1)}" font-size="${Math.max(8.5, layout.fontSize * 0.82).toFixed(1)}" fill="${INK_RED}" stroke="${INK_RED}" stroke-width="0.06" text-anchor="end" opacity="0.94">${escapeXml(item.num)}</text>\n`;
        }
        xml += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${layout.fontSize.toFixed(1)}" fill="${INK_BLUE}" stroke="${INK_BLUE}" stroke-width="0.08" opacity="${variation.opacity}" transform="rotate(${variation.angle} ${x.toFixed(1)} ${y.toFixed(1)})" letter-spacing="0.08">${escapeXml(line)}</text>\n`;
        y += layout.lineHeight;
        lineIndex += 1;
      });
      if (itemIndex < wrappedItems.length - 1) y += layout.verseGap;
    });

    return xml + '</g>\n';
  }

  function buildRealisticBinding() {
    let punchedHoles = '';
    let paperDimples = '';
    let castShadows = '';
    let wireBodies = '';
    let wireHighlights = '';
    let entryOcclusion = '';

    for (let index = 0; index < 20; index += 1) {
      const slotY = 113 + index * 34;
      const drift = [-0.45, 0.2, 0.5, -0.15, 0.3][index % 5];
      const leftSlotX = 672.1 + drift * 0.2;
      const rightSlotX = 719.1 - drift * 0.16;
      const leftEntryX = 680.2 + drift;
      const rightEntryX = 719.8 - drift;
      const firstY = slotY + 5.7;
      const secondY = slotY + 13.2;
      const firstApex = slotY - 8.2 - Math.abs(drift);
      const secondApex = slotY - 0.7 - Math.abs(drift) * 0.6;
      const firstPath = `M ${leftEntryX.toFixed(2)},${firstY.toFixed(2)} C 686.2,${firstApex.toFixed(2)} 713.8,${firstApex.toFixed(2)} ${rightEntryX.toFixed(2)},${firstY.toFixed(2)}`;
      const secondPath = `M ${leftEntryX.toFixed(2)},${secondY.toFixed(2)} C 687.1,${secondApex.toFixed(2)} 712.9,${secondApex.toFixed(2)} ${rightEntryX.toFixed(2)},${secondY.toFixed(2)}`;

      paperDimples += `
        <rect x="${(leftSlotX - 1.2).toFixed(2)}" y="${(slotY - 1).toFixed(2)}" width="11" height="18" rx="5.5" fill="none" stroke="#b8aa8c" stroke-width="1.15" opacity="0.3"/>
        <rect x="${(rightSlotX - 1.2).toFixed(2)}" y="${(slotY - 1).toFixed(2)}" width="11" height="18" rx="5.5" fill="none" stroke="#b8aa8c" stroke-width="1.15" opacity="0.3"/>`;

      punchedHoles += `
        <rect x="${leftSlotX.toFixed(2)}" y="${slotY}" width="8.6" height="16" rx="4.3" fill="url(#bindingHole)" stroke="#827766" stroke-width="0.6"/>
        <rect x="${rightSlotX.toFixed(2)}" y="${slotY}" width="8.6" height="16" rx="4.3" fill="url(#bindingHole)" stroke="#827766" stroke-width="0.6"/>`;

      castShadows += `
        <path d="${firstPath}" transform="translate(1.4 2.6)"/>
        <path d="${secondPath}" transform="translate(1.4 2.6)"/>`;

      wireBodies += `
        <path d="${firstPath}"/>
        <path d="${secondPath}"/>`;

      wireHighlights += `
        <path d="${firstPath}" transform="translate(-0.55 -0.65)"/>
        <path d="${secondPath}" transform="translate(-0.55 -0.65)"/>`;

      entryOcclusion += `
        <ellipse cx="${leftEntryX.toFixed(2)}" cy="${firstY.toFixed(2)}" rx="1.25" ry="1.85" fill="#17181a" opacity="0.52"/>
        <ellipse cx="${rightEntryX.toFixed(2)}" cy="${firstY.toFixed(2)}" rx="1.25" ry="1.85" fill="#17181a" opacity="0.52"/>
        <ellipse cx="${leftEntryX.toFixed(2)}" cy="${secondY.toFixed(2)}" rx="1.2" ry="1.7" fill="#1b1c1e" opacity="0.46"/>
        <ellipse cx="${rightEntryX.toFixed(2)}" cy="${secondY.toFixed(2)}" rx="1.2" ry="1.7" fill="#1b1c1e" opacity="0.46"/>`;
    }

    return `
<!-- 11. REALISTIC TWIN-LOOP STEEL BINDING -->
<g id="realistic-notebook-binding">
  <g>${paperDimples}</g>
  <g>${punchedHoles}</g>
  <g fill="none" stroke="#000000" stroke-width="5.9" stroke-linecap="round" opacity="0.22" filter="url(#bindingCastShadow)">${castShadows}</g>
  <g fill="none" stroke="url(#bindingMetal)" stroke-width="4.35" stroke-linecap="round" stroke-linejoin="round">${wireBodies}</g>
  <g fill="none" stroke="#ffffff" stroke-width="0.78" stroke-linecap="round" opacity="0.58">${wireHighlights}</g>
  <g>${entryOcclusion}</g>
</g>`;
  }

  function replaceRootDimensions(svg) {
    return svg.replace(/<svg([^>]+)>/i, (_, attributes) => {
      const clean = attributes.replace(/\b(width|height|viewBox|style)="[^"]*"/gi, '');
      return `<svg ${clean} width="${NOTEBOOK_WIDTH}" height="${NOTEBOOK_HEIGHT}" viewBox="0 0 ${NOTEBOOK_WIDTH} ${NOTEBOOK_HEIGHT}" style="display:block;">`;
    });
  }

  async function buildSpreadSvg(previousData, currentData) {
    await ensureHandwritingFont();

    let template = global.cachedDiaryNoMugSvg;
    if (!template) {
      const response = await fetch('/realistic_diary_no_mug.svg', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Notebook template failed to load (${response.status})`);
      template = await response.text();
      global.cachedDiaryNoMugSvg = template;
    }

    const leftItems = extractVerseItems(previousData);
    const rightItems = extractVerseItems(currentData);
    const measure = createTextMeasurer();
    const layout = chooseSpreadLayout(leftItems, rightItems, measure);

    const dayNumber = global.readingDayIndex || global.currentDayIndex || 1;
    const previousDay = Math.max(1, dayNumber - 1);
    const weekNumber = Math.max(1, Math.ceil(dayNumber / 7));
    const previousWeek = Math.max(1, Math.ceil(previousDay / 7));
    const cardId = global.currentActiveCard?.cardId || global.currentCardId || 1;
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    const leftReference = previousData?.reference || 'Previous Reading';
    const rightReference = currentData?.reference || 'Current Reading';
    const leftVersion = previousData?.version || global.currentBibleVersion || 'NIV';
    const rightVersion = currentData?.version || global.currentBibleVersion || 'NIV';
    const leftTitle = `${leftReference}  ${leftVersion}`;
    const rightTitle = `${rightReference}  ${rightVersion}`;
    const leftTitleSize = fitTitleSize(leftTitle, 426, measure);
    const rightTitleSize = fitTitleSize(rightTitle, 408, measure);

    const fontCss = global.PATRICK_HAND_BASE64
      ? `@font-face { font-family: '${FONT_FAMILY}'; font-style: normal; font-weight: 400; src: url(data:font/woff2;base64,${global.PATRICK_HAND_BASE64}) format('woff2'); }`
      : '';

    const notebookDefs = `
  <clipPath id="leftInkClip"><rect x="190" y="228" width="480" height="450" rx="2"/></clipPath>
  <clipPath id="rightInkClip"><rect x="735" y="228" width="457" height="450" rx="2"/></clipPath>
  <filter id="inkWobble" x="-2%" y="-3%" width="104%" height="106%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="1" seed="17" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.28" xChannelSelector="R" yChannelSelector="B"/>
  </filter>
  <radialGradient id="bindingHole" cx="38%" cy="42%" r="72%">
    <stop offset="0%" stop-color="#090a0b"/>
    <stop offset="58%" stop-color="#171513"/>
    <stop offset="82%" stop-color="#493f34"/>
    <stop offset="100%" stop-color="#c8bda7"/>
  </radialGradient>
  <linearGradient id="bindingMetal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#343a3f"/>
    <stop offset="18%" stop-color="#e7ecee"/>
    <stop offset="38%" stop-color="#8f999f"/>
    <stop offset="55%" stop-color="#eef1f2"/>
    <stop offset="73%" stop-color="#687279"/>
    <stop offset="100%" stop-color="#202428"/>
  </linearGradient>
  <filter id="bindingCastShadow" x="-25%" y="-35%" width="160%" height="190%">
    <feGaussianBlur stdDeviation="1.45"/>
  </filter>
  <style>
    ${fontCss}
    #dynamic-notebook-content text { font-family: ${FONT_STACK}; }
    .notebook-handwriting text { filter: url(#inkWobble); paint-order: stroke; }
  </style>`;

    let content = `
<!-- REALISTIC DYNAMIC 2-PAGE SCRIPTURE SPREAD -->
<g id="dynamic-notebook-content">
  <text x="218" y="133" font-size="11.5" fill="${INK_GRAPHITE}" letter-spacing="0.45">CBR Challenger · daily scripture notebook</text>
  <text x="654" y="133" font-size="11.5" fill="#6d645c" text-anchor="end">previous reading</text>
  <text x="222" y="177" font-size="${leftTitleSize}" fill="${INK_RED}" font-weight="700" letter-spacing="0.2">${escapeXml(leftTitle)}</text>
  <text x="222" y="205" font-size="12" fill="#655e58">Day ${previousDay}  ·  Week ${previousWeek}  ·  Card #${escapeXml(cardId)}</text>

  <text x="758" y="133" font-size="11.5" fill="${INK_GRAPHITE}" letter-spacing="0.45">CBR Challenger · daily scripture notebook</text>
  <text x="1176" y="133" font-size="11.5" fill="#6d645c" text-anchor="end">${escapeXml(date)}</text>
  <text x="762" y="177" font-size="${rightTitleSize}" fill="${INK_RED}" font-weight="700" letter-spacing="0.2">${escapeXml(rightTitle)}</text>
  <text x="762" y="205" font-size="12" fill="#655e58">Day ${dayNumber}  ·  Week ${weekNumber}  ·  Card #${escapeXml(cardId)}</text>

  ${renderPageRules(212, LEFT_RULE_END, layout)}
  ${renderPageRules(752, RIGHT_RULE_END, layout)}
  ${renderPageText(layout.left, { textX: LEFT_TEXT_X, numberX: LEFT_NUMBER_X, clipId: 'leftInkClip' }, layout)}
  ${renderPageText(layout.right, { textX: RIGHT_TEXT_X, numberX: RIGHT_NUMBER_X, clipId: 'rightInkClip' }, layout)}

  <text x="432" y="706" font-size="15" fill="${INK_GRAPHITE}" text-anchor="middle">Read  ·  Meditate  ·  Pray</text>
  <text x="432" y="732" font-size="12.5" fill="#6d645c" text-anchor="middle">Previous daily scripture reading</text>
  <text x="960" y="706" font-size="15" fill="${INK_GRAPHITE}" text-anchor="middle">Read  ·  Meditate  ·  Pray</text>
  <text x="960" y="732" font-size="12.5" fill="#6d645c" text-anchor="middle">Current daily scripture reading</text>
</g>
`;

    let svg = template.replace(/<!-- 5\. RULED LINES[\s\S]*?<!-- 6\. RED MARGIN LINES -->/i, '<!-- 5. RULED LINES — generated to match handwriting -->\n<!-- 6. RED MARGIN LINES -->');
    const contentStart = '<!-- 8. HEADER TEXT — Left Page (Scripture Reading) -->';
    const bindingStart = '<!-- 11. TWIN-WIRE O-RING BINDING — Pill holes -->';
    const startIndex = svg.indexOf(contentStart);
    const endIndex = svg.indexOf(bindingStart);

    if (startIndex !== -1 && endIndex !== -1) {
      svg = svg.slice(0, startIndex) + content + svg.slice(endIndex);
    } else {
      svg = svg.replace('</svg>', content + '\n</svg>');
    }

    svg = svg.replace('</defs>', notebookDefs + '\n</defs>');
    svg = svg.replace(/<line x1="734" y1="96" x2="734" y2="776"/g, '<line x1="752" y1="96" x2="752" y2="776"');
    svg = svg.replace(/<line x1="734"/g, '<line x1="752"');
    svg = svg.replace(/<!-- 11\. TWIN-WIRE O-RING BINDING[\s\S]*?<\/svg>/i, buildRealisticBinding() + '\n</svg>');
    svg = replaceRootDimensions(svg);

    return svg;
  }

  global.CBRDailyNotebook = {
    buildSpreadSvg,
    extractVerseItems,
    version: '2.1.0'
  };
})(window);
