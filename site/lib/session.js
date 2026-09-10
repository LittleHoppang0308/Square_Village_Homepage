import { cookies } from 'next/headers';
import { COOKIE, verify } from './auth';

/** 서버 컴포넌트·라우트 핸들러에서 현재 로그인 사용자를 읽는다 */
export async function getSession() {
  const jar = await cookies();
  return verify(jar.get(COOKIE)?.value);
}

export async function requireUser() {
  const user = await getSession();
  if (!user) {
    const e = new Error('로그인이 필요합니다');
    e.status = 401;
    throw e;
  }
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!user.staff) {
    const e = new Error('운영진만 가능합니다');
    e.status = 403;
    throw e;
  }
  return user;
}
