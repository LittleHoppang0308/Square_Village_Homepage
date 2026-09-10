'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PostActions({ board, id }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/posts/${board}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '지우지 못했습니다');
      router.push(`/board/${board}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      setConfirming(false);
    }
  }

  if (error) return <span className="cmt-err">{error}</span>;
  if (!confirming) {
    return <button className="btn-quiet" onClick={() => setConfirming(true)}>삭제</button>;
  }
  return (
    <span className="confirm">
      정말 지울까요?
      <button className="btn-danger" onClick={remove} disabled={busy}>{busy ? '지우는 중…' : '삭제'}</button>
      <button className="btn-quiet" onClick={() => setConfirming(false)}>취소</button>
    </span>
  );
}
