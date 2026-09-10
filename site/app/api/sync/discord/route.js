import { NextResponse } from 'next/server';
import { channelMap } from '@/lib/boards';
import { readDataFresh, mutateData } from '@/lib/data';
import { newMessages, recentMessages, toPost, fetchAttachments, LIMITS } from '@/lib/discord';
import { botUserId } from '@/lib/discordApi';
import { DISCORD_BOT_TOKEN, SYNC_SECRET, CRON_SECRET, SYNC_FIRST_RUN, hasGithub } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** 게시판마다 보관할 최대 글 수 (data.json 이 무한히 커지는 것을 막는다) */
const KEEP_PER_BOARD = 300;

function authorized(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (SYNC_SECRET && token === SYNC_SECRET) return true;
  if (CRON_SECRET && token === CRON_SECRET) return true;
  return false;
}

export async function GET(req) { return run(req); }
export async function POST(req) { return run(req); }

async function run(req) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: '인증 실패' }, { status: 401 });
  }
  if (!hasGithub) {
    return NextResponse.json({ ok: false, error: 'GITHUB_TOKEN / GITHUB_REPO 미설정' }, { status: 500 });
  }
  if (!DISCORD_BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'DISCORD_BOT_TOKEN 미설정' }, { status: 500 });
  }

  const { bySlug } = channelMap();
  const entries = Object.entries(bySlug);
  if (!entries.length) {
    return NextResponse.json({ ok: false, error: 'DISCORD_CHANNELS 매핑이 비어 있습니다' }, { status: 500 });
  }

  /* 우리 봇이 보낸 메시지는 다시 수집하지 않는다.
     웹에서 쓴 글을 봇이 디스코드로 보내는데, 그것을 되읽으면 글이 두 번 생긴다. */
  const selfId = await botUserId();

  const snapshot = await readDataFresh();
  const cursors = { ...(snapshot.sync?.cursors || {}) };
  const seen = new Set();
  for (const p of snapshot.posts) {
    seen.add(`${p.board}:${p.id}`);
    if (p.discordId) seen.add(`${p.board}:${p.discordId}`);
  }
  for (const c of snapshot.comments || []) {
    if (c.discordId) seen.add(`${c.board}:${c.discordId}`);
  }

  const budget = { left: LIMITS.imagesPerRun };
  const imageFiles = [];
  const added = [];
  const report = {};

  for (const [slug, channelId] of entries) {
    try {
      const cursor = cursors[channelId];
      const msgs = cursor
        ? await newMessages(channelId, cursor)
        : await recentMessages(channelId, SYNC_FIRST_RUN);

      let count = 0;
      for (const msg of msgs) {
        // 실패한 건이 있어도 커서는 전진시켜 같은 메시지를 무한히 다시 시도하지 않는다
        cursors[channelId] = msg.id;
        if (selfId && msg.author?.id === selfId) continue;
        if (seen.has(`${slug}:${msg.id}`)) continue;

        const post = toPost(msg, slug);
        const { files, paths } = await fetchAttachments(msg, slug, budget);
        post.images = paths;
        imageFiles.push(...files);
        added.push(post);
        seen.add(`${slug}:${msg.id}`);
        count += 1;
      }
      report[slug] = count;
    } catch (e) {
      report[slug] = `오류: ${e.message}`;
    }
  }

  const cursorsChanged = JSON.stringify(cursors) !== JSON.stringify(snapshot.sync?.cursors || {});
  if (!added.length && !cursorsChanged) {
    return NextResponse.json({ ok: true, added: 0, report, at: new Date().toISOString() });
  }

  await mutateData((data) => {
    // 다시 읽은 데이터 기준으로 중복을 걸러 낸다 (그 사이 웹에서 글이 올라왔을 수 있다)
    const have = new Set();
    for (const p of data.posts) {
      have.add(`${p.board}:${p.id}`);
      if (p.discordId) have.add(`${p.board}:${p.discordId}`);
    }
    const fresh = added.filter((p) => !have.has(`${p.board}:${p.id}`));
    data.posts = trim([...fresh, ...data.posts]);
    data.sync = { lastRunAt: new Date().toISOString(), cursors };
    return { files: imageFiles, addedCount: fresh.length };
  }, (r) => (r.addedCount
    ? `feat(sync): 디스코드 새 글 ${r.addedCount}건${imageFiles.length ? ` · 이미지 ${imageFiles.length}장` : ''}`
    : 'chore(sync): 디스코드 커서 갱신'));

  return NextResponse.json({
    ok: true,
    added: added.length,
    images: imageFiles.length,
    report,
    at: new Date().toISOString(),
  });
}

/** 게시판별로 최신 KEEP_PER_BOARD 건만 남긴다 */
function trim(posts) {
  const byBoard = new Map();
  for (const p of posts) {
    const arr = byBoard.get(p.board) || [];
    arr.push(p);
    byBoard.set(p.board, arr);
  }
  const out = [];
  for (const arr of byBoard.values()) {
    arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    out.push(...arr.slice(0, KEEP_PER_BOARD));
  }
  return out.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}
