import { DISCORD_API, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } from './env';

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

/* ══════════════════════════════════════════════════════════
   채널 종류
   디스코드 채널은 종류에 따라 글이 담기는 방식이 다르다.
     텍스트/공지 채널 → 메시지 목록
     포럼/미디어 채널 → 스레드 목록 (스레드 하나가 글 하나)
   ══════════════════════════════════════════════════════════ */

export const KIND = { TEXT: 'text', FORUM: 'forum' };

const kindCache = new Map();

export async function channelKind(channelId) {
  if (kindCache.has(channelId)) return kindCache.get(channelId);
  const ch = await dc(`/channels/${channelId}`);
  // 15 = 포럼, 16 = 미디어. 0 = 텍스트, 5 = 공지 채널
  const kind = ch.type === 15 || ch.type === 16 ? KIND.FORUM : KIND.TEXT;
  kindCache.set(channelId, kind);
  return kind;
}

/**
 * 포럼 채널의 새 게시물(스레드)을 오래된 순으로 돌려준다.
 * 진행 중인 스레드와 보관된 스레드를 합쳐서 본다.
 */
export async function newThreads(channelId, afterId, firstRunCount) {
  const seen = new Map();

  // 진행 중 — 길드 전체에서 받아 이 채널 것만 걸러낸다
  if (DISCORD_GUILD_ID) {
    try {
      const active = await dc(`/guilds/${DISCORD_GUILD_ID}/threads/active`);
      for (const t of active.threads || []) {
        if (t.parent_id === channelId) seen.set(t.id, t);
      }
    } catch (e) {
      // 권한이 없으면 보관된 것만으로 진행한다
      console.warn('[discord] 진행 중 스레드 조회 실패:', e.message);
    }
  }

  // 보관됨 — 보관 시각 역순으로 최대 100개
  try {
    const archived = await dc(`/channels/${channelId}/threads/archived/public?limit=100`);
    for (const t of archived.threads || []) seen.set(t.id, t);
  } catch (e) {
    console.warn('[discord] 보관 스레드 조회 실패:', e.message);
  }

  let list = [...seen.values()].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  if (afterId) {
    list = list.filter((t) => BigInt(t.id) > BigInt(afterId));
  } else if (firstRunCount) {
    list = list.slice(-Math.min(Math.max(firstRunCount, 1), 100));
  }
  return list;
}

/**
 * 스레드의 첫 메시지 = 게시물 본문.
 * 포럼에서는 첫 메시지의 ID 가 스레드 ID 와 같다.
 */
export async function starterMessage(threadId) {
  try {
    return await dc(`/channels/${threadId}/messages/${threadId}`);
  } catch {
    // 첫 메시지가 지워졌으면 가장 오래된 메시지로 대신한다
    try {
      const list = await dc(`/channels/${threadId}/messages?after=0&limit=1`);
      return list[0] || null;
    } catch {
      return null;
    }
  }
}

/** 포럼 스레드 + 첫 메시지 → 게시글 */
export function threadToPost(thread, starter, boardSlug) {
  const content = (starter?.content || '').replace(/\r/g, '').trim();
  let title = String(thread.name || '').trim();
  if (title.length > LIMITS.titleChars) title = `${title.slice(0, LIMITS.titleChars).trimEnd()}…`;

  return {
    id: thread.id,
    board: boardSlug,
    title: title || '제목 없음',
    body: content,
    author: starter?.author?.global_name || starter?.author?.username || '알 수 없음',
    fromBot: Boolean(starter?.author?.bot),
    // 댓글을 이 스레드 안에 달기 위해 스레드 ID 를 채널로 쓴다
    channelId: thread.id,
    createdAt: thread.thread_metadata?.create_timestamp || starter?.timestamp || null,
    editedAt: starter?.edited_timestamp || null,
    reactions: (starter?.reactions || []).reduce((n, r) => n + (r.count || 0), 0),
    commentCount: Math.max(0, (thread.message_count || 0) - 1),
    images: [],
    pinned: Boolean(thread.flags & 2), // PINNED
    source: 'discord',
    kind: 'forum',
    discordId: thread.id,
  };
}

/** 포럼 채널에 새 게시물(스레드)을 만든다 */
export async function createForumPost(channelId, name, content) {
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/threads`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'squarevillage-portal',
    },
    body: JSON.stringify({
      name: name.slice(0, 100),
      auto_archive_duration: 10080,
      message: { content: content || '\u200b', allowed_mentions: { parse: [] } },
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const b = await res.text().catch(() => '');
    throw new Error(`포럼 게시물 생성 실패 ${res.status} ${b.slice(0, 200)}`);
  }
  return res.json();
}
