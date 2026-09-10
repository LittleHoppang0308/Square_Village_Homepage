'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ago } from '@/lib/format';

export default function Comments({ board, postId, initial, user, authEnabled }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, postId, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '등록하지 못했습니다');
      setList((v) => [...v, json.comment]);
      setText('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setError('');
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '지우지 못했습니다');
      setList((v) => v.filter((c) => c.id !== id));
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="cmt">
      <h2>댓글 <span className="num">{list.length}</span></h2>

      {list.length === 0 ? (
        <p className="cmt-none">첫 댓글을 남겨 보세요.</p>
      ) : (
        <ul className="cmt-list">
          {list.map((c) => (
            <li key={c.id}>
              <div className="cmt-top">
                <b>{c.author}</b>
                <span className="when">{ago(c.createdAt)}</span>
                {user && (user.id === c.authorId || user.staff) ? (
                  <button className="cmt-del" onClick={() => remove(c.id)}>삭제</button>
                ) : null}
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className="cmt-form" onSubmit={submit}>
          <textarea
            id={`cmt-${board}-${postId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 입력하세요. 디스코드 채널에도 함께 올라갑니다."
            maxLength={1000}
            rows={3}
          />
          <div className="cmt-actions">
            <span className="cmt-count num">{text.length} / 1000</span>
            <button className="btn-green" disabled={busy || !text.trim()}>
              {busy ? '등록 중…' : '댓글 등록'}
            </button>
          </div>
        </form>
      ) : (
        <p className="cmt-none">
          {authEnabled
            ? <a href={`/api/auth/login?next=/board/${board}/${postId}`}>디스코드로 로그인</a>
            : '로그인이 아직 설정되지 않았습니다'}
          {authEnabled ? ' 하면 댓글을 쓸 수 있습니다.' : ''}
        </p>
      )}

      {error ? <p className="cmt-err">{error}</p> : null}
    </section>
  );
}
