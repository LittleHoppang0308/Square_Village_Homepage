import { DISCORD_MIRROR } from './env';
import { channelMap } from './boards';
import { sendMessage, deleteMessage } from './discordApi';

/**
 * 웹에서 쓴 글·댓글을 연결된 디스코드 채널로 보낸다.
 * 보낸 메시지 ID 를 돌려주므로, 나중에 글을 지울 때 디스코드 쪽도 지울 수 있다.
 * 채널이 연결되지 않았거나 DISCORD_MIRROR 가 꺼져 있으면 조용히 건너뛴다.
 */
export async function mirrorPost({ board, title, body, author }) {
  const channelId = channelMap().bySlug[board];
  if (!DISCORD_MIRROR || !channelId) return null;

  const text = [`**${title}**`, body?.trim() ? `\n${body.trim()}` : '', `\n-# 홈페이지 · ${author}`]
    .filter(Boolean)
    .join('\n');

  try {
    const msg = await sendMessage(channelId, cut(text));
    return { channelId, messageId: msg.id };
  } catch (e) {
    console.error('[mirror] 글 전송 실패:', e.message);
    return null;
  }
}

export async function mirrorComment({ board, body, author, replyTo }) {
  const channelId = channelMap().bySlug[board];
  if (!DISCORD_MIRROR || !channelId) return null;

  try {
    const msg = await sendMessage(channelId, cut(`${body.trim()}\n-# 홈페이지 댓글 · ${author}`), replyTo);
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
