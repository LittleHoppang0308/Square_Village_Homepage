import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { mutateData } from '@/lib/data';
import { fail, bad } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 관리자 페이지에서 편집할 수 있는 영역만 허용한다 (posts·comments·sync 는 제외) */
const EDITABLE = new Set(['banners', 'events', 'videos', 'guides', 'systems', 'settings']);

export async function PUT(req) {
  try {
    const user = await requireStaff();
    const input = await req.json().catch(() => ({}));
    const key = String(input.key || '');
    if (!EDITABLE.has(key)) throw bad('편집할 수 없는 항목입니다');

    if (key === 'settings') {
      if (!input.value || typeof input.value !== 'object' || Array.isArray(input.value)) {
        throw bad('설정 형식이 올바르지 않습니다');
      }
    } else if (!Array.isArray(input.value)) {
      throw bad('목록 형식이 올바르지 않습니다');
    }

    const size = JSON.stringify(input.value).length;
    if (size > 200_000) throw bad('내용이 너무 큽니다');

    await mutateData((data) => {
      data[key] = input.value;
    }, `chore(admin): ${key} 수정 — ${user.name}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
