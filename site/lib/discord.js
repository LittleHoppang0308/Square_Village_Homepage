import { DISCORD_API, DISCORD_BOT_TOKEN } from './env';

export const LIMITS = {
  messagesPerChannel: 25,   // 한 번 돌 때 채널당 최대 처리 건수
  imagesPerRun: 20,         // 한 번 돌 때 미러링할 이미지 총 개수
  imagesPerPost: 6,
  imageBytes: 8 * 1024 * 1024,
  titleChars: 120,
};

async function dc(path) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'User-Agent': 'squarevillage-portal (+https://github.com)',
    },
    cache: 'no-store',
  });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(`디스코드 요청 제한 (${body.retry_after || '?'}s)`);
    err.rateLimited = true;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Discord ${res.status} ${path} ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** 커서 이후의 새 메시지를 오래된 순으로 돌려준다 */
export async function newMessages(channelId, afterId) {
  const qs = new URLSearchParams({ limit: String(LIMITS.messagesPerChannel) });
  if (afterId) qs.set('after', afterId);
  const list = await dc(`/channels/${channelId}/messages?${qs}`);
  return list
    .filter(isUsable)
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
}

/** 커서가 없는 첫 실행 — 최근 글을 한 번에 가져온다 (디스코드 상한 100건) */
export async function recentMessages(channelId, count) {
  const list = await dc(`/channels/${channelId}/messages?limit=${Math.min(Math.max(count, 1), 100)}`);
  return list
    .filter(isUsable)
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
}

function isUsable(m) {
  // 0 = 일반, 19 = 답장. 입퇴장·핀 알림 등 시스템 메시지는 제외
  if (m.type !== 0 && m.type !== 19) return false;
  const hasText = (m.content || '').trim().length > 0;
  const hasImage = (m.attachments || []).some(isImage);
  return hasText || hasImage;
}

export function isImage(a) {
  return (
    (a.content_type || '').startsWith('image/') ||
    /\.(png|jpe?g|gif|webp)$/i.test(a.filename || '')
  );
}

/** 디스코드 메시지를 게시글 형태로 바꾼다 */
export function toPost(msg, boardSlug) {
  const content = (msg.content || '').replace(/\r/g, '').trim();
  const lines = content.split('\n');
  const rawTitle = (lines.find((l) => l.trim().length > 0) || '').trim();
  const imageCount = (msg.attachments || []).filter(isImage).length;

  let title = rawTitle
    .replace(/^#{1,6}\s*/, '')       // 마크다운 제목 기호
    .replace(/\*\*(.+?)\*\*/g, '$1') // 굵게
    .replace(/^[-*>]\s*/, '')
    .trim();
  if (title.length > LIMITS.titleChars) title = title.slice(0, LIMITS.titleChars).trimEnd() + '…';
  if (!title) title = imageCount > 1 ? `이미지 ${imageCount}장` : '이미지';

  return {
    id: msg.id,
    board: boardSlug,
    title,
    body: content,
    author: msg.author?.global_name || msg.author?.username || '알 수 없음',
    fromBot: Boolean(msg.author?.bot),
    channelId: msg.channel_id,
    createdAt: msg.timestamp,
    editedAt: msg.edited_timestamp || null,
    reactions: (msg.reactions || []).reduce((n, r) => n + (r.count || 0), 0),
    commentCount: 0,
    images: [],
    pinned: Boolean(msg.pinned),
    source: 'discord',
  };
}

/** 첨부 이미지를 내려받아 저장소에 넣을 형태로 만든다 */
export async function fetchAttachments(msg, boardSlug, budget) {
  const files = [];
  const paths = [];
  const list = (msg.attachments || []).filter(isImage).slice(0, LIMITS.imagesPerPost);

  for (const a of list) {
    if (budget.left <= 0) break;
    if ((a.size || 0) > LIMITS.imageBytes) continue;
    try {
      const res = await fetch(a.url, { cache: 'no-store' });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > LIMITS.imageBytes) continue;
      const name = safeName(a.filename || `${a.id}.png`);
      const path = `images/${boardSlug}/${msg.id}/${name}`;
      files.push({ path, content: buf });
      paths.push(path.replace(/^images\//, ''));
      budget.left -= 1;
    } catch {
      /* 첨부 하나 실패로 동기화 전체를 멈추지 않는다 */
    }
  }
  return { files, paths };
}

function safeName(name) {
  const cleaned = name
    .normalize('NFC')
    .replace(/[^\w.\-가-힣]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(-80);
  return cleaned || 'image.png';
}
