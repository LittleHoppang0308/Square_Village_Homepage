const P = {
  sword: 'M14.5 2H20v5.5l-7.3 7.3 2.1 2.1-1.4 1.4-2.1-2.1-1.8 1.8 2.1 2.1-1.4 1.4-2.1-2.1-2.6 2.6-1.4-1.4 2.6-2.6-2.1-2.1 1.4-1.4 2.1 2.1 1.8-1.8-2.1-2.1 1.4-1.4 2.1 2.1L14.5 2Z',
  dagger: 'M7 2 4 5l8 8 3-3-8-8Zm10 2-2 2 3 3 2-2-3-3ZM3 15l6 6 2-2-6-6-2 2Zm14-1-2 2 4 4 2-2-4-4Z',
  play: 'M8 5.5v13l11-6.5L8 5.5Z',
  book: 'M4 3h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4V3Zm16 0h-7a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h7V3Z',
  anvil: 'M3 7h7l3 3h8v3a5 5 0 0 1-5 5h-3l2 3H7l2-3H6a3 3 0 0 1-3-3V7Z',
  gem: 'M8 2h8l4 6-8 14L4 8l4-6Zm.6 2L6 8h12l-2.6-4H8.6Z',
  map: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Zm0 2.2 4 1.3v12.3l-4-1.3V5.2Z',
  flag: 'M5 2h2v20H5V2Zm3 1h11l-2.5 4L19 11H8V3Z',
  arrow: 'M9 5l7 7-7 7-1.4-1.4L13.2 12 7.6 6.4 9 5Z',
  download: 'M12 3v10.2l3.6-3.6L17 11l-5 5-5-5 1.4-1.4L12 13.2V3ZM5 19h14v2H5v-2Z',
  sync: 'M12 4V1L8 5l4 4V6a6 6 0 0 1 6 6c0 1-.3 2-.8 2.8l1.5 1.5A8 8 0 0 0 12 4Zm-6.7 3.7A8 8 0 0 0 12 20v3l4-4-4-4v3a6 6 0 0 1-6-6c0-1 .3-2 .8-2.8L5.3 7.7Z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v5.6l4 2.3-1 1.7-5-2.9V7h2Z',
  search: 'M10 3a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c4 0 8 2 8 4.5V21H4v-2.5C4 16 8 14 12 14Z',
  menu: 'M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z',
  pause: 'M7 4h4v16H7V4Zm6 0h4v16h-4V4Z',
  image: 'M4 4h16v16H4V4Zm2 2v8.6l3.4-3.4 3 3L15 11l3 3V6H6Zm2.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z',
  github: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z',
  discord: 'M19.3 5.3A16 16 0 0 0 15.4 4l-.3.6a12 12 0 0 1 3.4 1.6 11.4 11.4 0 0 0-9-.5A11.7 11.7 0 0 0 8.9 4.6L8.6 4a16 16 0 0 0-3.9 1.3C2.2 9 1.5 12.6 1.9 16.2A16 16 0 0 0 6.7 18l.6-1a10 10 0 0 1-1.7-.8l.4-.3a11.4 11.4 0 0 0 9.9 0l.4.3a10 10 0 0 1-1.7.8l.6 1a16 16 0 0 0 4.8-1.8c.5-4.2-.6-7.8-2.7-10.9ZM8.5 13.9c-1 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9c1 0 1.8.9 1.7 1.9 0 1-.8 1.9-1.7 1.9Zm7 0c-1 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9c1 0 1.8.9 1.7 1.9 0 1-.8 1.9-1.7 1.9Z',
};

export default function Icon({ name, size = 16, className, style }) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      className={className} style={style} aria-hidden="true" focusable="false"
    >
      <path fill="currentColor" d={d} />
    </svg>
  );
}

/** 히어로 배경의 복셀 실루엣. 색은 슬라이드가 CSS 변수로 넘긴다. */
export function Scene() {
  return (
    <svg className="scene" viewBox="0 0 960 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="#fff" opacity=".4">
        <rect x="86" y="52" width="4" height="4" /><rect x="188" y="94" width="4" height="4" />
        <rect x="286" y="40" width="5" height="5" /><rect x="392" y="82" width="4" height="4" />
        <rect x="520" y="46" width="4" height="4" /><rect x="608" y="104" width="4" height="4" />
        <rect x="880" y="70" width="5" height="5" /><rect x="932" y="132" width="4" height="4" />
      </g>
      <polygon fill="var(--hill3)" points="0,400 0,300 80,300 80,280 160,280 160,300 240,300 240,270 320,270 320,290 400,290 400,262 480,262 480,286 560,286 560,268 640,268 640,292 720,292 720,274 800,274 800,296 880,296 880,280 960,280 960,400" />
      <polygon fill="var(--hill2)" points="0,400 0,336 60,336 60,320 140,320 140,344 220,344 220,312 300,312 300,332 380,332 380,308 460,308 460,340 540,340 540,318 620,318 620,342 700,342 700,314 780,314 780,336 860,336 860,322 960,322 960,400" />
      <g>
        <rect x="416" y="258" width="72" height="14" fill="var(--roof)" />
        <rect x="424" y="272" width="56" height="36" fill="var(--wood)" />
        <rect x="440" y="282" width="13" height="13" fill="var(--orb)" />
      </g>
      <g>
        <rect x="536" y="268" width="64" height="14" fill="var(--roof)" />
        <rect x="544" y="282" width="48" height="36" fill="var(--wood)" />
        <rect x="560" y="292" width="11" height="11" fill="var(--orb)" />
      </g>
      <g>
        <rect x="604" y="158" width="152" height="10" fill="var(--leafc)" />
        <rect x="604" y="168" width="152" height="16" fill="var(--hill1)" />
        <rect x="620" y="184" width="120" height="14" fill="var(--hill2)" />
        <rect x="644" y="198" width="72" height="12" fill="var(--hill2)" />
        <rect x="662" y="210" width="34" height="10" fill="var(--hill3)" />
        <rect x="620" y="116" width="38" height="28" fill="var(--leafc)" />
        <rect x="632" y="144" width="14" height="14" fill="var(--wood)" />
        <rect x="708" y="130" width="28" height="20" fill="var(--leafc)" />
        <rect x="717" y="150" width="10" height="8" fill="var(--wood)" />
      </g>
      <polygon fill="var(--hill1)" points="0,400 0,372 90,372 90,356 180,356 180,378 270,378 270,352 360,352 360,370 450,370 450,348 540,348 540,374 630,374 630,358 720,358 720,380 810,380 810,360 900,360 900,376 960,376 960,400" />
      <g>
        <rect x="106" y="286" width="58" height="40" fill="var(--leafc)" /><rect x="128" y="326" width="14" height="34" fill="var(--wood)" />
        <rect x="314" y="300" width="42" height="30" fill="var(--leafc)" /><rect x="330" y="330" width="10" height="26" fill="var(--wood)" />
        <rect x="826" y="290" width="58" height="40" fill="var(--leafc)" /><rect x="848" y="330" width="14" height="34" fill="var(--wood)" />
      </g>
    </svg>
  );
}
