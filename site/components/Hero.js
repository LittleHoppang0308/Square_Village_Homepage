'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon, { Scene } from './Icons';

/** 슬라이드마다 쓰는 저채도 색 조합. 배너의 theme 값으로 고른다. */
export const THEMES = {
  dusk:  { '--sky1': '#2A3138', '--sky2': '#5E6E70', '--orb': '#E8DCC0', '--hill1': '#1A1F23', '--hill2': '#232A2E', '--hill3': '#2E373C', '--leafc': '#4A6350', '--wood': '#4A4038', '--roof': '#6B4F45' },
  night: { '--sky1': '#1F2733', '--sky2': '#4A5A70', '--orb': '#EFE6C8', '--hill1': '#141A22', '--hill2': '#1C2430', '--hill3': '#26303D', '--leafc': '#40584A', '--wood': '#443A32', '--roof': '#5E4A50' },
  sand:  { '--sky1': '#2E2A26', '--sky2': '#7A6A52', '--orb': '#E6D2A8', '--hill1': '#1C1A17', '--hill2': '#26231F', '--hill3': '#332E28', '--leafc': '#4E5B44', '--wood': '#4A3E33', '--roof': '#6E5344' },
  teal:  { '--sky1': '#23302E', '--sky2': '#4E7068', '--orb': '#E4E6D6', '--hill1': '#16201F', '--hill2': '#1E2A28', '--hill3': '#283735', '--leafc': '#47624F', '--wood': '#453B31', '--roof': '#5C4B44' },
};

const ROTATE_MS = 6500;

export default function Hero({ banners }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);
  const n = banners.length;

  useEffect(() => {
    if (!playing || n < 2) return undefined;
    timer.current = setInterval(() => setI((v) => (v + 1) % n), ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [playing, n, i]);

  if (!n) return null;
  const go = (next) => setI(((next % n) + n) % n);

  return (
    <div className="hero">
      <div className="wrap">
        <div className="stage">
          <div className="slides">
            {banners.map((b, k) => (
              <div
                className={`slide${k === i ? ' on' : ''}`}
                key={b.id || k}
                style={THEMES[b.theme] || THEMES.dusk}
                aria-hidden={k === i ? undefined : 'true'}
              >
                <Scene />
                <div className="slide-copy">
                  {b.tag ? <span className={`chip${b.chip === 'quiet' ? ' quiet' : ''}`}>{b.tag}</span> : null}
                  <h2>
                    {String(b.title).split('//').map((part, k, arr) => (
                      <span key={k}>
                        {part.trim()}
                        {k < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </h2>
                  {b.desc ? <p>{b.desc}</p> : null}
                  {b.href ? (
                    <SlideLink href={b.href} label={b.cta || '자세히 보기'} icon={b.icon} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="stage-ctrl">
            <button onClick={() => go(i - 1)} aria-label="이전 배너">
              <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? '자동 넘김 정지' : '자동 넘김 시작'}
            >
              <Icon name={playing ? 'pause' : 'play'} size={13} />
            </button>
            <button onClick={() => go(i + 1)} aria-label="다음 배너"><Icon name="arrow" size={15} /></button>
          </div>

          <div className="segnav" role="tablist" aria-label="메인 배너">
            {banners.map((b, k) => (
              <button
                key={b.id || k}
                role="tab"
                aria-selected={k === i}
                onClick={() => { go(k); }}
              >
                {b.navLabel || b.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideLink({ href, label, icon }) {
  const inner = (
    <>
      {label} <Icon name={icon === 'download' ? 'download' : 'arrow'} size={14} />
    </>
  );
  if (/^https?:/.test(href)) {
    return <a className="go" href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return <Link className="go" href={href}>{inner}</Link>;
}
