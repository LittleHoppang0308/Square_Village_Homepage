'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './Icons';

/**
 * 메가 드롭다운 GNB.
 * 하위 목록은 각 열 안에 absolute 로 놓고 폭을 열 폭에 고정(width:100%)한다.
 * 폭을 내용에 맡기면 옆 열과 겹치므로 이 규칙은 바꾸지 말 것.
 */
export default function SiteHeader({ menu, launcherUrl }) {
  const gnbRef = useRef(null);
  const subRefs = useRef([]);
  const openT = useRef(null);
  const closeT = useRef(null);
  const measured = useRef(false);

  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(-1);
  const [drawer, setDrawer] = useState(false);
  const [stuck, setStuck] = useState(false);

  const wide = () => typeof window !== 'undefined' && window.matchMedia('(min-width:901px)').matches;

  /** 가장 긴 하위 목록 높이를 재서 모든 열과 배경 패널 높이를 맞춘다 */
  const measure = useCallback(() => {
    const gnb = gnbRef.current;
    if (!gnb) return;
    let tallest = 0;
    for (const el of subRefs.current) {
      if (el && el.offsetHeight > tallest) tallest = el.offsetHeight;
    }
    const foot = gnb.querySelector('.megafoot');
    gnb.style.setProperty('--sub-h', `${tallest}px`);
    gnb.style.setProperty('--mega-h', `${tallest + 10 + (foot ? foot.offsetHeight : 0)}px`);
    measured.current = true;
  }, []);

  const doOpen = useCallback((instant) => {
    if (!wide()) return;
    clearTimeout(closeT.current);
    const go = () => {
      if (!measured.current) measure();
      setOpen(true);
    };
    if (instant) go();
    else {
      clearTimeout(openT.current);
      openT.current = setTimeout(go, 90);
    }
  }, [measure]);

  const doClose = useCallback((instant) => {
    clearTimeout(openT.current);
    const go = () => { setOpen(false); setHl(-1); };
    if (instant) go();
    else {
      clearTimeout(closeT.current);
      closeT.current = setTimeout(go, 140);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const onKey = (e) => { if (e.key === 'Escape') { doClose(true); setDrawer(false); } };
    window.addEventListener('keydown', onKey);

    const onResize = () => {
      measured.current = false;
      if (wide()) setDrawer(false);
      else doClose(true);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      clearTimeout(openT.current);
      clearTimeout(closeT.current);
    };
  }, [doClose]);

  const cls = ['gnb', open && 'open', drawer && 'mobile-open', stuck && 'stuck']
    .filter(Boolean).join(' ');

  return (
    <>
      <header
        className={cls}
        ref={gnbRef}
        onMouseEnter={() => clearTimeout(closeT.current)}
        onMouseLeave={() => doClose()}
        onFocus={(e) => { if (e.target.closest('.gnb-menu')) doOpen(true); }}
        onBlur={(e) => { if (!gnbRef.current?.contains(e.relatedTarget)) doClose(true); }}
      >
        <div className="wrap">
          <Link className="logo" href="/">
            <span className="logo-mark">🫐</span>
            <span className="logo-txt">
              <strong>스퀘어빌리지</strong>
              <span>SQUAREVILLAGE RPG</span>
            </span>
          </Link>

          <nav className="gnb-menu" aria-label="주 메뉴" onMouseEnter={() => doOpen()}>
            {menu.map((col, i) => (
              <div
                className={`col${hl === i ? ' hl' : ''}`}
                key={col.label}
                onMouseEnter={() => setHl(i)}
                onFocus={() => setHl(i)}
              >
                <Link className="top" href={col.href} aria-current={col.current ? 'page' : undefined}>
                  {col.label}
                  {col.dot ? <i className="nd" title="새 글 있음" /> : null}
                </Link>
                <ul className="sub" ref={(el) => { subRefs.current[i] = el; }}>
                  {col.items.map((it) => (
                    <li key={it.label}>
                      {it.soon ? (
                        <span className="soon" title="준비 중">{it.label}</span>
                      ) : (
                        <Link href={it.href} aria-current={it.current ? 'page' : undefined}>
                          {it.label}
                          {it.dot ? <i className="nd" /> : null}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="gnb-right">
            <button
              className="icon-btn burger"
              aria-label={drawer ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={drawer}
              onClick={() => setDrawer((v) => !v)}
            >
              <Icon name="menu" size={20} />
            </button>
            <button className="icon-btn" aria-label="검색"><Icon name="search" size={18} /></button>
            <button className="icon-btn" aria-label="내 정보"><Icon name="user" size={18} /></button>
            <a className="cta" href={launcherUrl} target="_blank" rel="noopener noreferrer">런처 받기</a>
          </div>
        </div>

        <div className="megabg">
          <div className="megafoot">
            <div className="wrap">
              <span className="lg"><i className="nd" /> 표시는 최근 24시간 내 새 글</span>
              <span className="rt">
                <a href={launcherUrl} target="_blank" rel="noopener noreferrer">런처 다운로드</a>
                <Link href="/board/notice">공지사항</Link>
                <Link href="/board/free">자유게시판</Link>
              </span>
            </div>
          </div>
        </div>
      </header>
      <div className={`dim${open ? ' on' : ''}`} onClick={() => doClose(true)} />
    </>
  );
}
