import Link from 'next/link';
import Icon from './Icons';

export function Events({ events }) {
  if (!events.length) return null;
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="events">
          {events.slice(0, 2).map((e, i) => (
            <Anchor className={`ev ${i === 0 ? 'a' : 'b'}`} href={e.href} key={e.id || i}>
              <span className="tex" />
              <span className={`chip${i === 0 ? '' : ' quiet'}`} style={{ alignSelf: 'flex-start' }}>{e.tag}</span>
              <h3>{e.title}</h3>
              <p>{e.desc}</p>
            </Anchor>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Systems({ systems }) {
  if (!systems.length) return null;
  return (
    <div className="dark" id="systems">
      <div className="wrap">
        <div className="sec-head">
          <h2>콘텐츠 &amp; 시스템</h2>
          <span className="note">서버에 실제로 들어가 있는 기능들</span>
          <Link className="more" href="/board/tip">가이드에서 자세히 <Icon name="arrow" size={13} /></Link>
        </div>
        <div className="sys">
          {systems.map((s) => (
            <article key={s.code} id={`sys-${s.code}`}>
              <span className="no">{s.code}</span>
              <h4>{s.star ? <span className="star">★</span> : null}{s.name}</h4>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Media({ videos }) {
  if (!videos.length) return null;
  return (
    <section id="media">
      <div className="wrap">
        <div className="sec-head">
          <h2>공식 영상</h2>
          <Link className="more" href="/board/fanart">채널 가기 <Icon name="arrow" size={13} /></Link>
        </div>
        <div className="vids">
          {videos.map((v, i) => (
            <Anchor className="vid" href={v.href} key={v.id || i}>
              <span className="cap">
                <Icon name="play" size={34} />
                {v.duration ? <span className="dur">{v.duration}</span> : null}
              </span>
              <p>{v.title}</p>
            </Anchor>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Guides({ guides }) {
  if (!guides.length) return null;
  return (
    <section id="guide" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2>가이드 둘러보기</h2>
          <Link className="more" href="/board/tip">전체 가이드 <Icon name="arrow" size={13} /></Link>
        </div>
        <div className="guides">
          {guides.map((g, i) => (
            <Anchor href={g.href} key={g.id || i}>
              <span className="circ"><Icon name={g.icon || 'book'} size={32} /></span>
              <b>{g.name}</b>
            </Anchor>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 내부 경로는 Link, 외부 URL 은 새 탭 */
function Anchor({ href, className, children }) {
  if (!href) return <div className={className}>{children}</div>;
  if (/^https?:/.test(href)) {
    return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link className={className} href={href}>{children}</Link>;
}
