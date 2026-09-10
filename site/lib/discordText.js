/**
 * 디스코드 메시지 본문을 사이트에서 읽을 수 있게 정리한다.
 * 멘션·커스텀 이모지·타임스탬프는 디스코드 안에서만 의미가 있는 표기라
 * 동기화할 때 사람이 읽는 형태로 바꿔 저장한다.
 */

/**
 * @param text 원문
 * @param ctx { roles: Map<id,name>, channels: Map<id,name>, mentions: 메시지의 mentions 배열 }
 */
export function cleanContent(text, ctx = {}) {
  let out = String(text || '').replace(/\r/g, '');
  const roles = ctx.roles || new Map();
  const channels = ctx.channels || new Map();
  const users = new Map((ctx.mentions || []).map((u) => [u.id, u.global_name || u.username]));

  // 역할 멘션 <@&123>
  out = out.replace(/<@&(\d+)>/g, (_, id) => `@${roles.get(id) || '역할'}`);
  // 사용자 멘션 <@123> / <@!123>
  out = out.replace(/<@!?(\d+)>/g, (_, id) => `@${users.get(id) || '사용자'}`);
  // 채널 멘션 <#123>
  out = out.replace(/<#(\d+)>/g, (_, id) => `#${channels.get(id) || '채널'}`);
  // 커스텀 이모지 <:name:123> / <a:name:123>
  out = out.replace(/<a?:(\w+):\d+>/g, ':$1:');
  // 타임스탬프 <t:1700000000:R>
  out = out.replace(/<t:(\d+)(?::[a-zA-Z])?>/g, (_, sec) => {
    const d = new Date(Number(sec) * 1000);
    return Number.isNaN(+d) ? '' : new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d).replace(/\.\s?/g, '.').replace(/\.$/, '');
  });
  // 작은 글씨 표기 -# 는 기호만 떼고 내용을 남긴다
  out = out.replace(/^-#\s+/gm, '');
  // 스포일러 ||텍스트||
  out = out.replace(/\|\|(.+?)\|\|/gs, '$1');
  // 링크를 감싸는 <> 는 제거
  out = out.replace(/<(https?:\/\/[^\s>]+)>/g, '$1');

  return out.trim();
}

/** 길드의 역할·채널 이름표. 동기화 한 번에 한 번만 받아 온다. */
export async function guildLookups(dcFetch, guildId) {
  const empty = { roles: new Map(), channels: new Map() };
  if (!guildId) return empty;
  try {
    const [roles, channels] = await Promise.all([
      dcFetch(`/guilds/${guildId}/roles`).catch(() => []),
      dcFetch(`/guilds/${guildId}/channels`).catch(() => []),
    ]);
    return {
      roles: new Map((roles || []).map((r) => [r.id, r.name])),
      channels: new Map((channels || []).map((c) => [c.id, c.name])),
    };
  } catch {
    return empty;
  }
}
