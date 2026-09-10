import { NextResponse } from 'next/server';
import { DISCORD_CLIENT_ID, hasAuth } from '@/lib/env';
import { STATE_COOKIE } from '@/lib/auth';
import { originOf } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!hasAuth) {
    return NextResponse.json({ ok: false, error: '로그인이 아직 설정되지 않았습니다' }, { status: 503 });
  }
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  const state = `${crypto.randomUUID()}|${next.startsWith('/') ? next : '/'}`;

  const authorize = new URL('https://discord.com/oauth2/authorize');
  authorize.searchParams.set('client_id', DISCORD_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${originOf(req)}/api/auth/callback`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', 'identify');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('prompt', 'none');

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: 600,
  });
  return res;
}
