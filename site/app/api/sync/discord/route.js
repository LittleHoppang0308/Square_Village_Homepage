import { NextResponse } from 'next/server';
import { channelMap } from '@/lib/boards';
import { readDataFresh, saveData } from '@/lib/data';
import { newMessages, recentMessages, toPost, fetchAttachments, LIMITS } from '@/lib/discord';
import { DISCORD_BOT_TOKEN, SYNC_SECRET, CRON_SECRET, hasGithub } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** 커서가 없는 채널의 첫 수집 건수 */
const FIRST_RUN_COUNT = 10;
/** 게시판마다 보관할 최대 글 수 (data.json 이 무한히 커지는 것을 막는다) */
const KEEP_PER_BOARD = 300;

function authorized(req) {
  const got = req.headers.get('authorization') || '';
  const token = got.replace(/^Bearer\s+/i, '').trim();
  if (SYNC_SECRET && token === SYNC_SECRET) return true;
  if (CRON_SECRET && token === CRON_SECRET) return true;
  return false;
}

export async function GET(req) {
  return run(req);
}
export async function POST(req) {
  return run(req);
}

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

  const data = await readDataFresh();
  const cursors = { ...(data.sync?.cursors || {}) };
  const known = new Set(data.posts.map((p) => `${p.board}:${p.id}`));

  const budget = { left: LIMITS.imagesPerRun };
  const imageFiles = [];
  const added = [];
  const report = {};

  for (const [slug, channelId] of entries) {
    try {
      const cursor = cursors[channelId];
      const msgs = cursor
        ? await newMessages(channelId, cursor)
        : await recentMessages(channelId, FIRST_RUN_COUNT);

      let count = 0;
      for (const msg of msgs) {
        cursors[channelId] = msg.id; // 실패한 글이 있어도 커서는 전진시켜 무한 재시도를 막는다
        if (known.has(`${slug}:${msg.id}`)) continue;

        const post = toPost(msg, slug);
        const { files, paths } = await fetchAttachments(msg, slug, budget);
        post.images = paths;
        imageFiles.push(...files);
        added.push(post);
        known.add(`${slug}:${msg.id}`);
        count += 1;
      }
      report[slug] = count;
    } catch (e) {
      report[slug] = `오류: ${e.message}`;
    }
  }

  if (!added.length) {
    // 커서만 움직였을 수도 있으니 변화가 있으면 저장한다
    const cursorsChanged = JSON.stringify(cursors) !== JSON.stringify(data.sync?.cursors || {});
    if (cursorsChanged) {
      data.sync = { lastRunAt: new Date().toISOString(), cursors };
      await saveData(data, 'chore(sync): 디스코드 커서 갱신');
    }
    return NextResponse.json({ ok: true, added: 0, report, at: new Date().toISOString() });
  }

  const merged = [...added, ...data.posts];
  data.posts = trim(merged);
  data.sync = { lastRunAt: new Date().toISOString(), cursors };

  const msg = `feat(sync): 디스코드 새 글 ${added.length}건` +
    (imageFiles.length ? ` · 이미지 ${imageFiles.length}장` : '');
  await saveData(data, msg, imageFiles);

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
