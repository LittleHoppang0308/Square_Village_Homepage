import { NextResponse } from 'next/server';
import { COOKIE, verify } from '@/lib/auth';

/** /admin 은 운영진만. 미들웨어(Edge)에서 쿠키 서명만 확인한다. */
export async function middleware(req) {
  const user = await verify(req.cookies.get(COOKIE)?.value);
  if (!user) {
    const to = new URL('/api/auth/login', req.url);
    to.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(to);
  }
  if (!user.staff) {
    return NextResponse.redirect(new URL('/login-failed?reason=' + encodeURIComponent('운영진만 접근할 수 있습니다'), req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
