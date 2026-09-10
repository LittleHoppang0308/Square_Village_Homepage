import { NextResponse } from 'next/server';

export function fail(e) {
  const status = e?.status || 500;
  if (status >= 500) console.error('[api]', e?.message || e);
  return NextResponse.json({ ok: false, error: e?.message || '처리하지 못했습니다' }, { status });
}

export function bad(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}
