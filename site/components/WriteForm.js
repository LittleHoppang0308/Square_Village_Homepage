'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WriteForm({ boards, initialBoard, mirrorOn }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialBoard);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const current = boards.find((b) => b.slug === slug);

  async function submit(e) {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: slug, title, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '올리지 못했습니다');
      router.push(json.href);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="write" onSubmit={submit}>
      <label className="wf">
        <span>게시판</span>
        <select id="write-board" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {boards.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </label>

      <label className="wf">
        <span>제목</span>
        <input
          id="write-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="한 줄로 요약해 주세요"
          autoComplete="off"
        />
      </label>

      <label className="wf">
        <span>본문</span>
        <textarea
          id="write-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          rows={14}
          placeholder="줄바꿈은 그대로 유지됩니다. 링크는 자동으로 눌리게 됩니다."
        />
      </label>

      <p className="wnote">
        {mirrorOn && current?.channel
          ? <>올리면 디스코드 <code>#{current.slug}</code> 채널에도 함께 올라갑니다.</>
          : '이 게시판은 디스코드 채널과 연결되지 않아 사이트에만 올라갑니다.'}
        {' '}이미지 첨부는 아직 디스코드에서만 됩니다.
      </p>

      {error ? <p className="cmt-err">{error}</p> : null}

      <div className="wactions">
        <span className="cmt-count num">{body.length} / 4000</span>
        <Link className="btn-quiet" href={`/board/${slug}`}>취소</Link>
        <button className="btn-green" disabled={busy || !title.trim()}>
          {busy ? '올리는 중…' : '올리기'}
        </button>
      </div>
    </form>
  );
}
