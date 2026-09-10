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
    const { id } = await params;

    let toUnmirror = null;
    await mutateData((data) => {
      const list = data.comments || [];
      const i = list.findIndex((c) => String(c.id) === String(id));
      if (i < 0) throw bad('없는 댓글입니다', 404);
      const c = list[i];
      if (c.authorId !== user.id && !user.staff) throw bad('내가 쓴 댓글만 지울 수 있습니다', 403);
      if (c.discordId) toUnmirror = { channelId: c.channelId, messageId: c.discordId };
      list.splice(i, 1);
      data.comments = list;
    }, `chore(web): 댓글 삭제 — ${user.name}`);

    await unmirror(toUnmirror);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
