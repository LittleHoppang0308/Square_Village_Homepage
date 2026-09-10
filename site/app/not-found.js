import Link from 'next/link';

export const metadata = { title: '페이지를 찾을 수 없습니다' };

export default function NotFound() {
  return (
    <section>
      <div className="wrap">
        <div className="hint" style={{ maxWidth: 520, margin: '60px auto' }}>
          <b>페이지를 찾을 수 없습니다</b>
          주소가 바뀌었거나 글이 지워졌을 수 있습니다.
          <div style={{ marginTop: 16 }}>
            <Link className="btn-back" href="/">홈으로</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
