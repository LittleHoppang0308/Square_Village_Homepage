import { boardsOf } from './boards';
import { docsOf } from './guides';

const DAY = 24 * 3600 * 1000;

/**
 * 메가 메뉴는 전부 실제로 존재하는 페이지만 가리킨다.
 * 게시판은 /board/<slug>, 가이드·소개 문서는 /guide/<slug>.
 */
export function buildMenu(data, { pathname = '/' } = {}) {
  const now = Date.now();
  const fresh = new Set(
    data.posts.filter((p) => now - new Date(p.createdAt || 0) < DAY).map((p) => p.board),
  );
  const b = (slug, name) => ({
    label: name,
    href: `/board/${slug}`,
    dot: fresh.has(slug),
    current: pathname.startsWith(`/board/${slug}`),
  });
  const d = (doc) => ({
    label: doc.name,
    href: `/guide/${doc.slug}`,
    current: pathname === `/guide/${doc.slug}`,
  });

  const news = boardsOf('news').map((x) => b(x.slug, x.name));
  const community = boardsOf('community').map((x) => b(x.slug, x.name));
  const intro = docsOf(data, 'intro').map(d);
  const guides = docsOf(data, 'guide').map(d);

  const columns = [
    {
      label: '서버 소식',
      href: '/board/notice',
      dot: news.some((x) => x.dot),
      current: news.some((x) => x.current),
      items: news,
    },
    {
      label: '게임 소개',
      href: intro.length ? intro[0].href : '/#systems',
      current: intro.some((x) => x.current),
      items: [...intro, { label: '콘텐츠 · 시스템', href: '/#systems' }],
    },
    {
      label: '커뮤니티',
      href: '/board/free',
      dot: community.some((x) => x.dot),
      current: community.some((x) => x.current),
      items: community,
    },
    {
      label: '시스템',
      href: '/#systems',
      items: (data.systems || []).map((s) => ({ label: s.name, href: `/#sys-${s.code}` })),
    },
    {
      label: '미디어',
      href: '/#media',
      items: [
        { label: '공식 영상', href: '/#media' },
        { label: '스크린샷', href: '/board/shot' },
        { label: '2차 창작', href: '/board/fanart' },
      ],
    },
    {
      label: '가이드',
      href: '/guide',
      current: pathname === '/guide' || guides.some((x) => x.current),
      items: [
        ...guides.slice(0, 8),
        { label: '질문과 답변', href: '/board/qna' },
      ],
    },
  ];

  return columns.filter((c) => c.items.length > 0);
}
