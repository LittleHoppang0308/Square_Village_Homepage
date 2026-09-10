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

    // 디스코드는 # / ## / ### 세 단계를 쓴다
    const head = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (head) {
      flushPara();
      blocks.push({ type: 'h', level: head[1].length, text: head[2] });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushPara();
      const lines2 = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        lines2.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'quote', lines: lines2 });
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

/**
 * 인라인 서식을 조각으로 나눈다.
 * `[글자](주소)` · `**굵게**` · `*기울임*` · `__밑줄__` · `~~취소~~` · `` `코드` `` · 맨 URL
 */
export function inline(text) {
  const out = [];
  const re = new RegExp([
    '\\[([^\\]]+)\\]\\((https?:\\/\\/[^)\\s]+)\\)', // 마크다운 링크
    '(`[^`]+`)',
    '(\\*\\*[^*]+\\*\\*)',
    '(~~[^~]+~~)',
    '(__[^_]+__)',
    '(\\*[^*\\n]+\\*)',
    '(https?:\\/\\/[^\\s<>"\')]+)',
  ].join('|'), 'g');

  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    if (m[1] && m[2]) out.push({ t: 'link', v: m[2], label: m[1] });
    else if (m[3]) out.push({ t: 'code', v: m[3].slice(1, -1) });
    else if (m[4]) out.push({ t: 'b', v: m[4].slice(2, -2) });
    else if (m[5]) out.push({ t: 's', v: m[5].slice(2, -2) });
    else if (m[6]) out.push({ t: 'u', v: m[6].slice(2, -2) });
    else if (m[7]) out.push({ t: 'i', v: m[7].slice(1, -1) });
    else if (m[8]) out.push({ t: 'link', v: m[8] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}
