import { DISCORD_API, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, staffRoleIds } from './env';

function botHeaders(extra) {
  return {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    'User-Agent': 'squarevillage-portal',
    ...extra,
  };
}

async function bot(path, init = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: botHeaders(init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Discord ${res.status} ${path} ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

/** 봇 자신의 사용자 ID. 봇이 보낸 메시지를 다시 수집하지 않기 위해 필요하다. */
let botIdCache = null;
export async function botUserId() {
  if (botIdCache) return botIdCache;
  try {
    const me = await bot('/users/@me');
    botIdCache = me.id;
    return botIdCache;
  } catch {
    return null;
  }
}

/**
 * 길드 멤버인지 확인하고 역할까지 돌려준다.
 * 멤버가 아니면 null — 로그인 차단에 쓴다.
 */
export async function guildMember(userId) {
  try {
    return await bot(`/guilds/${DISCORD_GUILD_ID}/members/${userId}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export function isStaff(member) {
  const staff = staffRoleIds();
  if (!staff.length) return false;
  const roles = member?.roles || [];
  return staff.some((r) => roles.includes(r));
}

/** 채널에 메시지를 보낸다. replyTo 를 주면 그 메시지의 답장으로 보낸다. */
export async function sendMessage(channelId, content, replyTo) {
  const body = { content, allowed_mentions: { parse: [] } };
  if (replyTo) {
    body.message_reference = { message_id: replyTo, fail_if_not_exists: false };
  }
  return bot(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(body) });
}

/** 봇이 보낸 메시지는 추가 권한 없이 지울 수 있다 */
export async function deleteMessage(channelId, messageId) {
  try {
    await bot(`/channels/${channelId}/messages/${messageId}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

/** OAuth2 코드 → 액세스 토큰 */
export async function exchangeCode(code, redirectUri, clientId, clientSecret) {
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`토큰 교환 실패 ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** 액세스 토큰으로 본인 정보 조회 */
export async function fetchMe(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`사용자 정보 조회 실패 ${res.status}`);
  return res.json();
}
