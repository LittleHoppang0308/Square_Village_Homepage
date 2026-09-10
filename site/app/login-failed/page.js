import Link from 'next/link';

export const metadata = { title: '로그인하지 못했습니다' };
export const dynamic = 'force-dynamic';

export default async function LoginFailed({ searchParams }) {
  const sp = await searchParams;
  const reason = typeof sp?.reason === 'string' ? sp.reason : '알 수 없는 이유로 실패했습니다';
  return (
    <section>
      <div className="wrap">
        <div className="hint" style={{ maxWidth: 520, margin: '60px auto' }}>
          <b>로그인하지 못했습니다</b>
          {reason}
          <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <a className="btn-back" href="/api/auth/login">다시 시도</a>
            <Link className="btn-back" href="/">홈으로</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
