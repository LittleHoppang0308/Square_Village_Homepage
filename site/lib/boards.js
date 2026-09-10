import { DISCORD_CHANNELS } from './env';

/** 게시판 정의. slug 는 URL(/board/<slug>) 이고 name 은 화면 표기. */
export const BOARDS = [
  { slug: 'notice',      name: '공지사항',   group: 'news',      staff: true  },
  { slug: 'update',      name: '업데이트',   group: 'news',      staff: true  },
  { slug: 'event',       name: '이벤트',     group: 'news',      staff: true  },
  { slug: 'patch',       name: '패치 노트',  group: 'news',      staff: true  },
  { slug: 'maintenance', name: '점검 안내',  group: 'news',      staff: true  },
  { slug: 'free',        name: '자유게시판', group: 'community', staff: false },
  { slug: 'qna',         name: '질문과 답변', group: 'community', staff: false },
  { slug: 'tip',         name: '공략게시판', group: 'community', staff: false },
  { slug: 'shot',        name: '스크린샷',   group: 'community', staff: false },
  { slug: 'guild',       name: '길드 모집',  group: 'community', staff: false },
  { slug: 'friend',      name: '친구 모집',  group: 'community', staff: false },
  { slug: 'fanart',      name: '2차 창작',   group: 'community', staff: false },
  { slug: 'suggest',     name: '건의사항',   group: 'community', staff: false },
];

const BY_SLUG = Object.fromEntries(BOARDS.map((b) => [b.slug, b]));

export function board(slug) {
  return BY_SLUG[slug] || null;
}
export function boardName(slug) {
  return BY_SLUG[slug]?.name || slug;
}
export function boardsOf(group) {
  return BOARDS.filter((b) => b.group === group);
}

/**
 * DISCORD_CHANNELS="notice:123,free:456" 를 파싱한다.
 * → { bySlug: { notice: '123' }, byChannel: { '123': 'notice' } }
 */
export function channelMap() {
  const bySlug = {};
  const byChannel = {};
  for (const pair of DISCORD_CHANNELS.split(',')) {
    const [slug, id] = pair.split(':').map((s) => (s || '').trim());
    if (!slug || !id || !BY_SLUG[slug] || !/^\d{5,25}$/.test(id)) continue;
    bySlug[slug] = id;
    byChannel[id] = slug;
  }
  return { bySlug, byChannel };
}
