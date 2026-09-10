import { DISCORD_MIRROR } from './env';
import { channelMap } from './boards';
import { sendMessage, deleteMessage } from './discordApi';
import { channelKind, createForumPost, KIND } from './discord';

/**
 * 웹에서 쓴 글·댓글을 연결된 디스코드 채널로 보낸다.
 * 보낸 메시지 ID 를 돌려주므로, 나중에 글을 지울 때 디스코드 쪽도 지울 수 있다.
 * 채널이 연결되지 않았거나 DISCORD_MIRROR 가 꺼져 있으면 조용히 건너뛴다.
 */
export async function mirrorPost({ board, title, body, author }) {
  const channelId = channelMap().bySlug[board];
  if (!DISCORD_MIRROR || !channelId) return null;

  try {
    const kind = await channelKind(channelId);

    if (kind === KIND.FORUM) {
      // 포럼에서는 게시물(스레드)을 새로 만든다. 스레드 이름이 제목이 된다.
      const body2 = [body?.trim(), `-# 홈페이지 · ${author}`].filter(Boolean).join('\n\n');
      const thread = await createForumPost(channelId, title, cut(body2));
      // 댓글은 이 스레드 안에 달려야 하므로 스레드 ID 를 채널로 기록한다
      return { channelId: thread.id, messageId: thread.id, forum: true };
    }

    const text = [`**${title}**`, body?.trim() ? `\n${body.trim()}` : '', `\n-# 홈페이지 · ${author}`]
      .filter(Boolean)
      .join('\n');
    const msg = await sendMessage(channelId, cut(text));
    return { channelId, messageId: msg.id };
  } catch (e) {
    console.error('[mirror] 글 전송 실패:', e.message);
    return null;
  }
}

/**
 * 댓글은 글이 있는 곳으로 보낸다.
 * 포럼 글이면 postChannelId 가 스레드 ID 이므로 스레드 안에 달린다.
 * 텍스트 채널이면 원본 메시지의 답장으로 간다.
 */
export async function mirrorComment({ board, body, author, replyTo, postChannelId, isForum }) {
  const channelId = postChannelId || channelMap().bySlug[board];
  if (!DISCORD_MIRROR || !channelId) return null;

  try {
    const msg = await sendMessage(
      channelId,
      cut(`${body.trim()}\n-# 홈페이지 댓글 · ${author}`),
      isForum ? null : replyTo,
    );
    return { channelId, messageId: msg.id };
  } catch (e) {
    console.error('[mirror] 댓글 전송 실패:', e.message);
    return null;
  }
}

/** 저장 실패로 되돌릴 때, 또는 글이 지워질 때 봇이 보낸 메시지를 지운다 */
export async function unmirror(ref) {
  if (!ref?.channelId || !ref?.messageId) return;
  await deleteMessage(ref.channelId, ref.messageId);
}

/** 디스코드 메시지 길이 상한(2000자) */
function cut(text) {
  return text.length > 1990 ? `${text.slice(0, 1990)}…` : text;
}
