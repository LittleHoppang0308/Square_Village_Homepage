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

/** 30초 캐시. 쓰기가 끝나면 revalidateTag 로 즉시 무효화된다. */
export const getData = unstable_cache(load, [TAG], { revalidate: 30, tags: [TAG] });

/** 캐시를 거치지 않는 읽기 — 쓰기 직전에만 사용한다 */
export async function readDataFresh() {
  if (!hasGithub) return loadLocal();
  return withDefaults(await readJson(DATA_PATH, EMPTY));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 읽기 → 수정 → 커밋. 그 사이 다른 사람이 커밋했으면 처음부터 다시 한다.
 *
 * 여러 사람이 동시에 글을 써도 서로의 글을 덮어쓰지 않는 유일한 방법이다.
 * apply(data) 는 data 를 직접 수정하고, 필요하면
 * { files: [{path, content}] } 를 돌려 이미지 등을 같은 커밋에 함께 넣을 수 있다.
 * { skip: true } 를 돌려주면 커밋하지 않는다.
 */
export async function mutateData(apply, message, { attempts = 4 } = {}) {
  if (!hasGithub) throw new Error('GITHUB_TOKEN / GITHUB_REPO 가 설정되지 않았습니다');

  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    const data = await readDataFresh();
    const result = (await apply(data)) || {};
    if (result.skip) return result;

    const files = [
      { path: DATA_PATH, content: `${JSON.stringify(data, null, 2)}\n` },
      ...(result.files || []),
    ];
    try {
      const sha = await commitFiles(files, typeof message === 'function' ? message(result) : message);
      revalidateTag(TAG);
      return { ...result, sha };
    } catch (e) {
      const conflict = e.status === 409 || e.status === 422;
      if (!conflict || i === attempts - 1) throw e;
      lastError = e;
      await sleep(150 * (i + 1));
    }
  }
  throw lastError || new Error('저장에 실패했습니다');
}

/* ── 조회 헬퍼 ─────────────────────────────────────────── */

export function postsOf(data, slug, { limit } = {}) {
  const list = data.posts
    .filter((p) => p.board === slug)
    .sort((a, b) => (a.pinned === b.pinned ? cmpDate(a, b) : a.pinned ? -1 : 1));
  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

export function findPost(data, slug, id) {
  return data.posts.find((p) => p.board === slug && String(p.id) === String(id)) || null;
}

export function commentsOf(data, slug, postId) {
  return (data.comments || [])
    .filter((c) => c.board === slug && String(c.postId) === String(postId))
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

export function commentCount(data, slug, postId) {
  return (data.comments || []).filter(
    (c) => c.board === slug && String(c.postId) === String(postId),
  ).length;
}

/** 목록에 댓글 수를 채워 넣는다 */
export function withCounts(data, posts) {
  return posts.map((p) => ({ ...p, commentCount: commentCount(data, p.board, p.id) }));
}

function cmpDate(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

export function newId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
