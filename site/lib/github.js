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
 * data.json 과 첨부 이미지를 함께 넣어도 원자적으로 반영된다.
 *
 * files: [{ path, content: Buffer | string }]
 */
export async function commitFiles(files, message) {
  if (!files.length) return null;

  const ref = await (await gh(`/git/ref/heads/${encodeURIComponent(GITHUB_BRANCH)}`)).json();
  const parentSha = ref.object.sha;
  const parentCommit = await (await gh(`/git/commits/${parentSha}`)).json();

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
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: blobs }),
    })
  ).json();

  const commit = await (
    await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
    })
  ).json();

  /* force:false 이므로 그 사이 다른 커밋이 들어왔으면 422/409 로 실패한다.
     여기서 재시도하면 오래된 내용으로 덮어쓰게 되므로, 재시도는
     "다시 읽어서 다시 반영"할 수 있는 호출자(lib/data.js 의 mutateData)가 맡는다. */
  await gh(`/git/refs/heads/${encodeURIComponent(GITHUB_BRANCH)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return commit.sha;
}
