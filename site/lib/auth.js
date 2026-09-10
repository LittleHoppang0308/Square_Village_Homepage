import { AUTH_SECRET } from './env';

/**
 * 세션은 서버에 저장하지 않는다. 사용자 정보를 HMAC 으로 서명한 쿠키 하나로 끝낸다.
 * Web Crypto 만 쓰므로 미들웨어(Edge)와 라우트 핸들러(Node) 양쪽에서 동작한다.
 */
export const COOKIE = 'sv_session';
export const STATE_COOKIE = 'sv_oauth_state';
export const MAX_AGE = 7 * 24 * 3600; // 7일

const encoder = new TextEncoder();

function b64u(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) a[i] = s.charCodeAt(i);
  return a;
}

async function hmacKey() {
  if (!AUTH_SECRET) throw new Error('AUTH_SECRET 이 설정되지 않았습니다');
  return crypto.subtle.importKey(
    'raw', encoder.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
  );
}

/** user: { id, name, avatar, staff } → 서명된 토큰 */
export async function sign(user) {
  const payload = {
    i: user.id, n: user.name, a: user.avatar || '',
    s: user.staff ? 1 : 0, e: Date.now() + MAX_AGE * 1000,
  };
  const body = b64u(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(body));
  return `${body}.${b64u(new Uint8Array(sig))}`;
}

/** 토큰 → { id, name, avatar, staff } / 실패하면 null */
export async function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), unb64u(sig), encoder.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    if (!p || typeof p.e !== 'number' || p.e < Date.now()) return null;
    return { id: String(p.i), name: String(p.n), avatar: p.a || '', staff: p.s === 1 };
  } catch {
    return null;
  }
}

export function avatarUrl(user, size = 64) {
  if (!user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};
