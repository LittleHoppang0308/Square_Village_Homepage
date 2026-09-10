import { readFile } from '@/lib/github';
import { hasGithub } from '@/lib/env';

export const runtime = 'nodejs';

const TYPES = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
};

export async function GET(_req, { params }) {
  const { path: segs = [] } = await params;
  if (!segs.length || segs.some((s) => s === '..' || s.includes('\\') || s.startsWith('.'))) {
    return new Response('잘못된 경로', { status: 400 });
  }
  const ext = (segs[segs.length - 1].split('.').pop() || '').toLowerCase();
  const type = TYPES[ext];
  if (!type) return new Response('지원하지 않는 형식', { status: 400 });
  if (!hasGithub) return new Response('저장소 미설정', { status: 404 });

  try {
    const buf = await readFile(`images/${segs.join('/')}`);
    if (!buf) return new Response('없음', { status: 404 });
    return new Response(buf, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('[img]', e.message);
    return new Response('읽기 실패', { status: 502 });
  }
}
