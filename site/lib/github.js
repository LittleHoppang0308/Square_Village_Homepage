import { GITHUB_API, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } from './env';

function headers(extra) {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'squarevillage-portal',
    ...extra,
  };
}

async function gh(path, init = {}) {
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}${path}`, {
    ...init,
    headers: headers(init.headers),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`GitHub ${res.status} ${path} ${body.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  return res;
}

/**
 * 파일 내용을 그대로 읽는다. 없으면 null.
 * raw 미디어 타입은 100MB까지 지원하므로 이미지에도 쓸 수 있다.
 */
export async function readFile(path) {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${encodePath(path)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const res = await fetch(url, {
    headers: headers({ Accept: 'application/vnd.github.raw' }),
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub read ${res.status} ${path} ${body.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function readJson(path, fallback = null) {
  const buf = await readFile(path);
  if (!buf) return fallback;
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return fallback;
  }
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/**
 * 여러 파일을 커밋 하나로 쓴다 (Git Data API).
 * data.json 과 첨부 이미지를 함께 넣어도 원자적으로 반영되고,
 * 파일마다 sha 를 맞출 필요가 없어 충돌 처리가 단순하다.
 *
 * files: [{ path, content: Buffer | string }]
 */
export async function commitFiles(files, message, attempt = 0) {
  if (!files.length) return null;

  const refRes = await gh(`/git/ref/heads/${encodeURIComponent(GITHUB_BRANCH)}`);
  const ref = await refRes.json();
  const parentSha = ref.object.sha;

  const parentCommit = await (await gh(`/git/commits/${parentSha}`)).json();
  const baseTree = parentCommit.tree.sha;

  const blobs = [];
  for (const f of files) {
    const buf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(String(f.content), 'utf8');
    const blob = await (
      await gh('/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }),
      })
    ).json();
    blobs.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const tree = await (
    await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTree, tree: blobs }),
    })
  ).json();

  const commit = await (
    await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
    })
  ).json();

  try {
    await gh(`/git/refs/heads/${encodeURIComponent(GITHUB_BRANCH)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch (e) {
    // 그 사이 다른 커밋이 들어왔으면 부모를 다시 잡아 한 번 재시도한다
    if (attempt < 3 && (e.status === 422 || e.status === 409)) {
      return commitFiles(files, message, attempt + 1);
    }
    throw e;
  }
  return commit.sha;
}
