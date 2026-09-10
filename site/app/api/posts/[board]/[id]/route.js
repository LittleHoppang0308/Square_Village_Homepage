import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { mutateData } from '@/lib/data';
import { unmirror } from '@/lib/mirror';
import { fail, bad } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req, { params }) {
  try {
    const user = await requireUser();
    const { board: slug, id } = await params;

    let toUnmirror = null;
    await mutateData((data) => {
      const i = data.posts.findIndex((p) => p.board === slug && String(p.id) === String(id));
      if (i < 0) throw bad('없는 글입니다', 404);
      const post = data.posts[i];
      if (post.authorId !== user.id && !user.staff) throw bad('내가 쓴 글만 지울 수 있습니다', 403);

      // 웹에서 쓴 글은 봇이 보낸 것이므로 디스코드 쪽도 지운다.
      // 디스코드에서 온 글은 주민의 메시지라 건드리지 않는다.
      if (post.source === 'web' && post.discordId) {
        toUnmirror = { channelId: post.channelId, messageId: post.discordId };
      }
      data.posts.splice(i, 1);
      data.comments = (data.comments || []).filter(
        (c) => !(c.board === slug && String(c.postId) === String(id)),
      );
    }, `chore(web): 글 삭제 — ${user.name}`);

    await unmirror(toUnmirror);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
