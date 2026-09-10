/**
 * 문서 본문을 블록으로 나눈다. 마크다운 라이브러리 없이 필요한 것만.
 *   ## 제목      → 소제목
 *   - 항목       → 목록
 *   1. 항목      → 번호 목록
 *   | a | b |    → 표
 *   그 외        → 문단 (URL 은 링크로)
 */
export function parseDoc(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let buf = [];

  const flushPara = () => {
    if (buf.length) {
      blocks.push({ type: 'p', lines: buf.slice() });
      buf = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { flushPara(); continue; }

    if (/^##\s+/.test(trimmed)) {
      flushPara();
      blocks.push({ type: 'h', text: trimmed.replace(/^##\s+/, '') });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      flushPara();
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        const cells = lines[i].trim().slice(1, -1).split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      i -= 1;
      if (rows.length) blocks.push({ type: 'table', head: rows[0], rows: rows.slice(1) });
      continue;
    }

    buf.push(trimmed);
  }
  flushPara();
  return blocks;
}

/** `**굵게**`, `` `코드` ``, URL 을 조각으로 나눈다 */
export function inline(text) {
  const out = [];
  const re = /(\*\*[^*]+\*\*)|(`[^`]+`)|(https?:\/\/[^\s<>"')]+)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    if (m[1]) out.push({ t: 'b', v: m[1].slice(2, -2) });
    else if (m[2]) out.push({ t: 'code', v: m[2].slice(1, -1) });
    else out.push({ t: 'link', v: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}
