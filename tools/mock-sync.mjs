/**
 * 디스코드 동기화를 실제 서비스 없이 시험하기 위한 가짜 서버.
 *
 *   node tools/mock-sync.mjs            # 4400 포트에서 대기
 *
 * 다른 창에서:
 *   cd site
 *   GITHUB_API_URL=http://127.0.0.1:4400/gh \
 *   DISCORD_API_URL=http://127.0.0.1:4400/dc \
 *   GITHUB_TOKEN=t GITHUB_REPO=me/repo GITHUB_BRANCH=main \
 *   DISCORD_BOT_TOKEN=t DISCORD_CHANNELS=free:100000000000000111,shot:100000000000000222 \
 *   SYNC_SECRET=s npm run dev
 *
 *   curl -H 'Authorization: Bearer s' -X POST localhost:3000/api/sync/discord
 *
 * 커밋된 파일 목록과 data.json 내용은 이 서버가 콘솔에 찍는다.
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 4400);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DAAAADAAEAAQAA//8=',
  'base64',
);

let store = {
  'data.json': JSON.stringify({ settings: {}, posts: [], sync: { cursors: {} } }, null, 2),
};
const blobs = new Map();
let refSha = 'sha-root';
let sentCount = 0;
let lastCode = '';
const BOT_ID = '999999999999999999';
const USER_ID = '111111111111111111';
const STAFF_ROLE = '222222222222222222';

const now = Date.now();
const messages = {
  '100000000000000111': [
    msg('9001', '오늘 보스 같이 도실 분\n9시에 모입니다', '야채호빵', 5),
    msg('9002', '**돌파력** 균등하게 올리세요\n한 스탯만 올리면 막힙니다', '하늘', 30),
  ],
  '100000000000000222': [
    { ...msg('9101', '', '모카', 90), attachments: [
      { id: 'a1', filename: '스크린샷 2026-09-10.png', content_type: 'image/png', size: PNG.length, url: `http://127.0.0.1:${PORT}/cdn/a1.png` },
    ] },
  ],
};

function msg(id, content, name, minsAgo) {
  return {
    id, type: 0, content, channel_id: '0',
    author: { username: name, global_name: name, bot: false },
    timestamp: new Date(now - minsAgo * 60000).toISOString(),
    edited_timestamp: null, attachments: [], reactions: [], pinned: false,
  };
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const body = await read(req);
  const json = (o, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(o));
  };

  // ── 첨부 CDN ──
  if (p.startsWith('/cdn/')) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(PNG);
  }

  // ── 디스코드 OAuth2 · 봇 ──
  if (p === '/dc/oauth2/token' && req.method === 'POST') {
    // code 를 'stranger' 로 주면 길드 멤버가 아닌 사용자로 흉내낸다 (로그인 차단 시험용)
    lastCode = new URLSearchParams(body).get('code') || '';
    console.log(`OAuth 토큰 교환 (code=${lastCode})`);
    return json({ access_token: 'mock-access-token', token_type: 'Bearer', expires_in: 604800 });
  }
  if (p === '/dc/users/@me') {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bot ')) return json({ id: BOT_ID, username: 'squarevillage-bot', bot: true });
    if (lastCode === 'stranger') {
      return json({ id: '777777777777777777', username: 'stranger', global_name: '지나가던사람', avatar: '' });
    }
    return json({ id: USER_ID, username: 'hoppang0308', global_name: '야채호빵', avatar: 'avatarhash' });
  }
  const mem = p.match(/^\/dc\/guilds\/(\d+)\/members\/(\d+)$/);
  if (mem) {
    if (mem[2] !== USER_ID) return json({ message: 'Unknown Member' }, 404);
    console.log('길드 멤버 확인 → 운영진 역할 있음');
    return json({ nick: null, roles: [STAFF_ROLE] });
  }
  const send = p.match(/^\/dc\/channels\/(\d+)\/messages$/);
  if (send && req.method === 'POST') {
    const sent = JSON.parse(body);
    sentCount += 1;
    console.log(`→ 디스코드 전송 (채널 ${send[1]})${sent.message_reference ? ' [답장]' : ''}`);
    console.log(`   ${sent.content.replace(/\n/g, ' / ')}`);
    return json({ id: `sent${sentCount}`, channel_id: send[1] });
  }
  const rm = p.match(/^\/dc\/channels\/(\d+)\/messages\/(\w+)$/);
  if (rm && req.method === 'DELETE') {
    console.log(`← 디스코드 메시지 삭제 (${rm[2]})`);
    res.writeHead(204);
    return res.end();
  }

  // ── 디스코드 ──
  let m = p.match(/^\/dc\/channels\/(\d+)\/messages$/);
  if (m) {
    const after = url.searchParams.get('after');
    let list = messages[m[1]] || [];
    if (after) list = list.filter((x) => BigInt(x.id) > BigInt(after));
    return json([...list].reverse()); // 디스코드는 최신순으로 준다
  }

  // ── GitHub ──
  m = p.match(/^\/gh\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
  if (m) {
    const file = decodeURIComponent(m[1]);
    if (!(file in store)) return json({ message: 'Not Found' }, 404);
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    return res.end(store[file]);
  }
  if (/\/git\/ref\/heads\//.test(p)) return json({ object: { sha: refSha } });
  if (/\/git\/commits\/sha-/.test(p)) return json({ tree: { sha: 'tree-1' } });
  if (p.endsWith('/git/blobs') && req.method === 'POST') {
    const { content } = JSON.parse(body);
    const sha = `blob-${blobs.size + 1}`;
    blobs.set(sha, Buffer.from(content, 'base64'));
    return json({ sha });
  }
  if (p.endsWith('/git/trees') && req.method === 'POST') {
    const { tree } = JSON.parse(body);
    console.log('\n── 커밋에 담긴 파일 ──');
    for (const t of tree) {
      const buf = blobs.get(t.sha);
      console.log(` ${t.path}  (${buf?.length ?? 0} bytes)`);
      if (t.path === 'data.json') store['data.json'] = buf.toString('utf8');
    }
    return json({ sha: 'tree-2' });
  }
  if (p.endsWith('/git/commits') && req.method === 'POST') {
    console.log('메시지:', JSON.parse(body).message);
    return json({ sha: `sha-${Date.now()}` });
  }
  if (/\/git\/refs\/heads\//.test(p) && req.method === 'PATCH') {
    refSha = JSON.parse(body).sha;
    const d = JSON.parse(store['data.json']);
    console.log(`글 ${d.posts.length}건 · 커서`, d.sync?.cursors);
    for (const post of d.posts) console.log(`  [${post.board}] ${post.title}  ← ${post.author}  이미지 ${post.images.length}`);
    return json({});
  }

  return json({ message: `모의 서버가 모르는 경로: ${req.method} ${p}` }, 404);
}).listen(PORT, () => console.log(`모의 서버 대기 중 http://127.0.0.1:${PORT}`));

function read(req) {
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => { s += c; });
    req.on('end', () => resolve(s));
  });
}
