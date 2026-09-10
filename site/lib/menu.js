import { boardsOf } from './boards';

const DAY = 24 * 3600 * 1000;

/**
 * 메가 메뉴를 데이터에서 만든다.
 * 아직 페이지가 없는 항목은 soon: true — 링크 대신 흐린 글자로 표시된다.
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

  const news = boardsOf('news').map((x) => b(x.slug, x.name));
  const community = boardsOf('community').map((x) => b(x.slug, x.name));

  return [
    {
      label: '서버 소식',
      href: '/board/notice',
      dot: news.some((x) => x.dot),
      current: news.some((x) => x.current),
      items: news,
    },
    {
      label: '게임 소개',
      href: '/#systems',
      items: [
        { label: '콘텐츠 소개', href: '/#systems' },
        { label: '서버 이야기', soon: true },
        { label: '지역 안내', soon: true },
        { label: '주요 NPC', soon: true },
        { label: '시작 가이드', soon: true },
      ],
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
        { label: '배경음악', soon: true },
        { label: '배포 자료', soon: true },
      ],
    },
    {
      label: '가이드',
      href: '/#guide',
      items: [
        ...(data.guides || []).slice(0, 6).map((g) => ({ label: g.name, href: g.href || '/board/tip' })),
        { label: 'FAQ', href: '/board/qna' },
      ],
    },
  ];
}
