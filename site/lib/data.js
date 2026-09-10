import { unstable_cache, revalidateTag } from 'next/cache';
import { readJson, commitFiles } from './github';
import { hasGithub } from './env';
import { EMPTY, withDefaults } from './seed';

const TAG = 'portal-data';
export const DATA_PATH = 'data.json';

async function load() {
  if (!hasGithub) return loadLocal();
  try {
    return withDefaults(await readJson(DATA_PATH, EMPTY));
  } catch (e) {
    console.error('[data] 저장소를 읽지 못했습니다:', e.message);
    return loadLocal();
  }
}

/** 로컬 개발용 — 저장소 대신 한 단계 위의 data.json 을 읽는다 */
async function loadLocal() {
  try {
    const [{ readFile }, { join }] = await Promise.all([
      import('node:fs/promises'),
      import('node:path'),
    ]);
    const raw = await readFile(join(process.cwd(), '..', DATA_PATH), 'utf8');
    return withDefaults(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

/** 30초 캐시. 동기화가 끝나면 revalidateTag 로 즉시 무효화된다. */
export const getData = unstable_cache(load, [TAG], { revalidate: 30, tags: [TAG] });

/** 캐시를 거치지 않는 읽기 — 쓰기 직전에만 사용한다 */
export async function readDataFresh() {
  if (!hasGithub) return loadLocal();
  return withDefaults(await readJson(DATA_PATH, EMPTY));
}

/**
 * data.json 과 (있으면) 추가 파일을 커밋 하나로 저장한다.
 * extraFiles: [{ path, content: Buffer }]
 */
export async function saveData(data, message, extraFiles = []) {
  if (!hasGithub) throw new Error('GITHUB_TOKEN / GITHUB_REPO 가 설정되지 않았습니다');
  const files = [
    { path: DATA_PATH, content: JSON.stringify(data, null, 2) + '\n' },
    ...extraFiles,
  ];
  const sha = await commitFiles(files, message);
  revalidateTag(TAG);
  return sha;
}

/* ── 조회 헬퍼 ─────────────────────────────────────────── */

export function postsOf(data, slug, { limit } = {}) {
  const list = data.posts
    .filter((p) => p.board === slug)
    .sort((a, b) => (a.pinned === b.pinned ? cmpDate(a, b) : a.pinned ? -1 : 1));
  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

export function postsOfGroup(data, group, boards, { limit } = {}) {
  const set = new Set(boards.map((b) => b.slug));
  const list = data.posts.filter((p) => set.has(p.board)).sort(cmpDate);
  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

export function findPost(data, slug, id) {
  return data.posts.find((p) => p.board === slug && String(p.id) === String(id)) || null;
}

function cmpDate(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}
