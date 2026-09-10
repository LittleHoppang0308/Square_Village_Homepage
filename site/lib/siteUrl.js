import { SITE_URL } from './env';

/**
 * OAuth 리다이렉트에 쓸 절대 주소.
 * SITE_URL 을 넣어두면 그것을 쓰고, 없으면 요청 헤더에서 유추한다.
 * (Vercel 미리보기 배포에서도 동작하도록)
 */
export function originOf(req) {
  if (SITE_URL) return SITE_URL;
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  return `${proto}://${host}`;
}
