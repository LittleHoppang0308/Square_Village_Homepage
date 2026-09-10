const SEOUL = 'Asia/Seoul';

export function ymd(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  const p = new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t)?.value || '';
  return `${g('year')}.${g('month')}.${g('day')}`;
}

export function ymdhm(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d).replace(/\.\s?/g, '.').replace(/\.$/, '');
}

/** "12분 전" / "3시간 전" / "어제" / "2026.09.05" */
export function ago(iso, now = Date.now()) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const m = Math.floor((now - t) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d === 1) return '어제';
  if (d < 7) return `${d}일 전`;
  return ymd(iso);
}

/** 3일 이내면 NEW */
export function isNew(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && now - t < 3 * 24 * 3600 * 1000;
}

/** 추천이 있거나 댓글 3개 이상이면 HOT */
export function isHot(post) {
  return (post.reactions || 0) > 0 || (post.commentCount || 0) >= 3;
}

/** 본문을 줄 단위로 쪼개고 URL 만 링크로 만든다 (마크다운 라이브러리 없이) */
export function toBlocks(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  return lines.map((line) => {
    const parts = [];
    const re = /https?:\/\/[^\s<>"']+/g;
    let last = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push({ t: 'text', v: line.slice(last, m.index) });
      parts.push({ t: 'link', v: m[0] });
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push({ t: 'text', v: line.slice(last) });
    return parts;
  });
}
