'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icons';
import { ago, ymd, isNew, isHot } from '@/lib/format';

const THUMB_ICON = {
  notice: 'book', update: 'gem', event: 'flag', patch: 'anvil', maintenance: 'clock',
};

/** 소식 패널 — 썸네일 + 제목 두 줄 */
export function NewsPanel({ boards, posts, syncedAgo }) {
  const [f, setF] = useState('all');
  const shown = f === 'all' ? posts : posts.filter((p) => p.board === f);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>스퀘어빌리지 소식</h3>
        {syncedAgo ? <span className="sync"><i />디스코드 동기화 · {syncedAgo}</span> : null}
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={f === 'all'} onClick={() => setF('all')}>전체</button>
        {boards.map((b) => (
          <button key={b.slug} role="tab" aria-selected={f === b.slug} onClick={() => setF(b.slug)}>
            {b.name}
          </button>
        ))}
      </div>
      <ul className="newslist">
        {shown.length === 0 ? (
          <li className="empty">아직 글이 없습니다</li>
        ) : shown.slice(0, 5).map((p) => (
          <li key={`${p.board}-${p.id}`}>
            <Link href={`/board/${p.board}/${p.id}`}>
              <span className="thumb"><Icon name={THUMB_ICON[p.board] || 'book'} size={26} /></span>
              <span className="news-body">
                <span className="kicker">
                  <span className="cat">{p.boardName}</span>
                  <span className="num">{ymd(p.createdAt)}</span>
                </span>
                <h4>
                  {p.title}
                  {isNew(p.createdAt) ? <span className="new-badge">NEW</span> : null}
                </h4>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 커뮤니티 패널 — 채널 칩 + 제목 한 줄 + 경과 시간 */
export function CommunityPanel({ boards, posts }) {
  const [f, setF] = useState('all');
  const shown = f === 'all' ? posts : posts.filter((p) => p.board === f);

  return (
    <div className="panel" id="community">
      <div className="panel-head">
        <h3>커뮤니티</h3>
        <span className="sync"><i />디스코드에서 수집</span>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={f === 'all'} onClick={() => setF('all')}>전체</button>
        {boards.map((b) => (
          <button key={b.slug} role="tab" aria-selected={f === b.slug} onClick={() => setF(b.slug)}>
            {b.name}
          </button>
        ))}
      </div>
      <ul className="postlist">
        {shown.length === 0 ? (
          <li className="empty">아직 글이 없습니다</li>
        ) : shown.slice(0, 6).map((p) => (
          <li key={`${p.board}-${p.id}`}>
            <Link href={`/board/${p.board}/${p.id}`}>
              <span className="ch">#{p.boardName}</span>
              <span className="t">
                {isHot(p) ? <span className="hot">HOT</span> : null}
                {p.title}
              </span>
              {p.commentCount ? <span className="cnt num">{p.commentCount}</span> : null}
              <span className="when">{ago(p.createdAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
