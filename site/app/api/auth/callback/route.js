import { NextResponse } from 'next/server';
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, hasAuth } from '@/lib/env';
import { COOKIE, STATE_COOKIE, cookieOptions, sign } from '@/lib/auth';
import { exchangeCode, fetchMe, guildMember, isStaff } from '@/lib/discordApi';
import { originOf } from '@/lib/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const origin = originOf(req);
  const fail = (reason) => NextResponse.redirect(`${origin}/login-failed?reason=${encodeURIComponent(reason)}`);

  if (!hasAuth) return fail('로그인이 아직 설정되지 않았습니다');

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const saved = req.cookies.get(STATE_COOKIE)?.value;

  if (url.searchParams.get('error')) return fail('디스코드에서 로그인이 취소되었습니다');
  if (!code) return fail('인증 코드가 없습니다');
  if (!state || !saved || state !== saved) return fail('요청이 위조되었을 수 있습니다. 다시 시도해 주세요');

  const next = state.split('|')[1] || '/';

  try {
    const token = await exchangeCode(
      code, `${origin}/api/auth/callback`, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET,
    );
    const me = await fetchMe(token.access_token);

    // 스퀘어빌리지 디스코드 멤버만 로그인할 수 있다
    const member = await guildMember(me.id);
    if (!member) return fail('스퀘어빌리지 디스코드에 먼저 참여해 주세요');

    const user = {
      id: me.id,
      name: member.nick || me.global_name || me.username,
      avatar: me.avatar || '',
      staff: isStaff(member),
    };

    const res = NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/'}`);
    res.cookies.set(COOKIE, await sign(user), cookieOptions);
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (e) {
    console.error('[auth]', e.message);
    return fail('로그인 처리 중 문제가 생겼습니다');
  }
}
