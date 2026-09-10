import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { board } from '@/lib/boards';
import { mutateData, newId, readDataFresh } from '@/lib/data';
import { mirrorComment, unmirror } from '@/lib/mirror';
import { fail, bad } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BODY_MAX = 1000;
const COOLDOWN_MS = 8 * 1000;

export async function POST(req) {
  let mirrored = null;
  try {
    const user = await requireUser();
    const input = await req.json().catch(() => ({}));

    const slug = String(input.board || '').trim();
    if (!board(slug)) throw bad('없는 게시판입니다');
    const postId = String(input.postId || '').trim();
    const body = String(input.body || '').replace(/\r/g, '').trim();
    if (!body) throw bad('내용을 입력해 주세요');
    if (body.length > BODY_MAX) throw bad(`댓글은 ${BODY_MAX}자까지입니다`);

    const snapshot = await readDataFresh();
    const post = snapshot.posts.find((p) => p.board === slug && String(p.id) === String(postId));
    if (!post) throw bad('없는 글입니다', 404);

    // 원본 메시지의 답장으로 보낸다 (디스코드에서 온 글이든 웹에서 쓴 글이든 ID 가 있다)
    mirrored = await mirrorComment({
      board: slug, body, author: user.name, replyTo: post.discordId || null,
    });

    const comment = {
      id: newId('c'),
      board: slug,
      postId,
      body,
      author: user.name,
      authorId: user.id,
      authorAvatar: user.avatar || '',
      createdAt: new Date().toISOString(),
      channelId: mirrored?.channelId || '',
      discordId: mirrored?.messageId || '',
    };

    await mutateData((data) => {
      const recent = (data.comments || []).find(
        (c) => c.authorId === user.id && Date.now() - new Date(c.createdAt || 0) < COOLDOWN_MS,
      );
      if (recent) throw bad('잠시 뒤에 다시 시도해 주세요', 429);
      data.comments = [...(data.comments || []), comment];
    }, `feat(web): 댓글 — ${user.name}`);

    return NextResponse.json({ ok: true, comment });
  } catch (e) {
    await unmirror(mirrored);
    return fail(e);
  }
}
