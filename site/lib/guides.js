/** 가이드·소개 문서는 게시판 글이 아니라 독립 문서다. group 으로 메뉴 위치가 갈린다. */
export const GROUPS = {
  intro: { key: 'intro', label: '게임 소개' },
  guide: { key: 'guide', label: '가이드' },
};

export function docsOf(data, group) {
  return (data.guides || [])
    .filter((g) => g.slug && (group ? (g.group || 'guide') === group : true));
}

export function findDoc(data, slug) {
  return (data.guides || []).find((g) => g.slug === slug) || null;
}

export function docHref(g) {
  return `/guide/${g.slug}`;
}
