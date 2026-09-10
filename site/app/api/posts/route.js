import { NextResponse } from 'next/server';
import { requireUser, requireStaff } from '@/lib/session';
import { board } from '@/lib/boards';
import { mutateData, newId } from '@/lib/data';
import { mirrorPost, unmirror } from '@/lib/mirror';
import { fail, bad } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TITLE_MAX = 120;
const BODY_MAX = 4000;
/** 같은 사람이 연달아 도배하는 것을 막는 최소 간격 */
const COOLDOWN_MS = 20 * 1000;

export async function POST(req) {
  let mirrored = null;
  try {
    const user = await requireUser();
    const input = await req.json().catch(() => ({}));

    const slug = String(input.board || '').trim();
    const b = board(slug);
    if (!b) throw bad('없는 게시판입니다');
    if (b.staff) await requireStaff();

    const title = String(input.title || '').trim().replace(/\s+/g, ' ');
    const body = String(input.body || '').replace(/\r/g, '').trim();
    if (!title) throw bad('제목을 입력해 주세요');
    if (title.length > TITLE_MAX) throw bad(`제목은 ${TITLE_MAX}자까지입니다`);
    if (body.length > BODY_MAX) throw bad(`본문은 ${BODY_MAX}자까지입니다`);

    // 디스코드로 먼저 보내고 그 메시지 ID 를 글에 함께 저장한다.
    // 저장이 끝까지 실패하면 보낸 메시지를 지워 되돌린다.
    mirrored = await mirrorPost({ board: slug, title, body, author: user.name });

    const post = {
      id: newId('w'),
      board: slug,
      title,
      body,
      author: user.name,
      authorId: user.id,
      authorAvatar: user.avatar || '',
      createdAt: new Date().toISOString(),
      editedAt: null,
      images: [],
      reactions: 0,
      pinned: false,
      source: 'web',
      channelId: mirrored?.channelId || '',
      discordId: mirrored?.messageId || '',
    };

    await mutateData((data) => {
      const recent = data.posts.find(
        (p) => p.authorId === user.id && Date.now() - new Date(p.createdAt || 0) < COOLDOWN_MS,
      );
      if (recent) throw bad('잠시 뒤에 다시 시도해 주세요', 429);
      data.posts.unshift(post);
    }, `feat(web): ${b.name} 새 글 — ${user.name}`);

    return NextResponse.json({ ok: true, id: post.id, href: `/board/${slug}/${post.id}` });
  } catch (e) {
    await unmirror(mirrored);
    return fail(e);
  }
}
