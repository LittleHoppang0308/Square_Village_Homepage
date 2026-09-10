'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './Icons';

/** GNB 우측 — 로그인 전에는 버튼, 로그인 후에는 아바타 + 드롭다운 */
export default function UserMenu({ user, authEnabled }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('click', away);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  if (!user) {
    if (!authEnabled) {
      return (
        <span className="icon-btn" title="로그인이 아직 설정되지 않았습니다" aria-hidden="true">
          <Icon name="user" size={18} />
        </span>
      );
    }
    return (
      <a className="icon-btn" href="/api/auth/login" aria-label="디스코드로 로그인" title="디스코드로 로그인">
        <Icon name="user" size={18} />
      </a>
    );
  }

  return (
    <div className="umenu" ref={box}>
      <button
        className="uavatar"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="내 메뉴"
      >
        {user.avatar
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`} alt="" />
          : <span className="uinitial">{user.name.slice(0, 1)}</span>}
      </button>
      {open ? (
        <div className="udrop" role="menu">
          <div className="uhead">
            <b>{user.name}</b>
            {user.staff ? <span className="ustaff">운영진</span> : null}
          </div>
          <Link href="/board/free/write" onClick={() => setOpen(false)}>글쓰기</Link>
          {user.staff ? <Link href="/admin" onClick={() => setOpen(false)}>운영</Link> : null}
          <a href="/api/auth/logout">로그아웃</a>
        </div>
      ) : null}
    </div>
  );
}
