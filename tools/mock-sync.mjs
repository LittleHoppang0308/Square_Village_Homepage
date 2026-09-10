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
const now = Date.now();
const BOT_ID = '999999999999999999';
const USER_ID = '111111111111111111';
const STAFF_ROLE = '222222222222222222';
const FORUM_ID = '100000000000000333';
const GUILD_ID = '555555555555555555';
// 포럼 스레드 = 게시물 하나. id 는 첫 메시지 id 와 같다.
const threads = [
  { id: '9201', parent_id: FORUM_ID, name: '[2026.06.04] 위키 공개 안내', message_count: 1, flags: 0,
    thread_metadata: { create_timestamp: new Date(now - 40 * 86400000).toISOString(), archived: true } },
  { id: '9202', parent_id: FORUM_ID, name: '[2026.09.08] 돌파력 시스템 오픈', message_count: 3, flags: 2,
    thread_metadata: { create_timestamp: new Date(now - 2 * 86400000).toISOString(), archived: false } },
];
const starters = {
  '9201': { id: '9201', type: 0, content: '안녕하세요.\n2026.06.04 리뉴얼 위키가 공개되었습니다.', channel_id: '9201',
    author: { username: 'hoppang0308', global_name: '야채호빵', bot: false },
    timestamp: new Date(now - 40 * 86400000).toISOString(), edited_timestamp: null,
    attachments: [{ id: 'w1', filename: 'wiki.png', content_type: 'image/png', size: 68, url: `http://127.0.0.1:${PORT}/cdn/w1.png` }],
    reactions: [{ count: 9 }], pinned: false },
  '9202': { id: '9202', type: 0, content: '공격력·방어력·체력을 각 30레벨까지 올리면 돌파 단계가 +1 오릅니다.', channel_id: '9202',
    author: { username: 'hoppang0308', global_name: '야채호빵', bot: false },
    timestamp: new Date(now - 2 * 86400000).toISOString(), edited_timestamp: null,
    attachments: [], reactions: [], pinned: true },
};

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

  // ── 포럼 ──
  const chInfo = p.match(/^\/dc\/channels\/(\d+)$/);
  if (chInfo && req.method === 'GET') {
    const id = chInfo[1];
    return json({ id, type: id === FORUM_ID ? 15 : 0, name: id === FORUM_ID ? '공지사항' : '자유수다' });
  }
  if (p === `/dc/guilds/${GUILD_ID}/threads/active`) {
    return json({ threads: threads.filter((t) => !t.thread_metadata.archived), members: [] });
  }
  const arch = p.match(/^\/dc\/channels\/(\d+)\/threads\/archived\/public$/);
  if (arch) {
    return json({ threads: threads.filter((t) => t.parent_id === arch[1] && t.thread_metadata.archived), has_more: false });
  }
  const starter = p.match(/^\/dc\/channels\/(\d+)\/messages\/(\d+)$/);
  if (starter && req.method === 'GET' && starters[starter[2]]) {
    return json(starters[starter[2]]);
  }
  const mkThread = p.match(/^\/dc\/channels\/(\d+)\/threads$/);
  if (mkThread && req.method === 'POST') {
    const b = JSON.parse(body);
    sentCount += 1;
    console.log(`→ 포럼 게시물 생성 (채널 ${mkThread[1]})`);
    console.log(`   제목: ${b.name}`);
    console.log(`   본문: ${(b.message?.content || '').replace(/\n/g, ' / ')}`);
    return json({ id: `thread${sentCount}`, name: b.name, parent_id: mkThread[1] });
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
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
    let list = messages[m[1]] || [];
    if (after) list = list.filter((x) => BigInt(x.id) > BigInt(after));
    // 디스코드는 최신순으로 주고, limit 만큼만 준다
    return json([...list].reverse().slice(0, limit));
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
