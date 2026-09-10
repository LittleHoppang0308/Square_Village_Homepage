import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData, postsOf } from '@/lib/data';
import { board, boardsOf, channelMap } from '@/lib/boards';
import { buildMenu } from '@/lib/menu';
import { LAUNCHER_REPO } from '@/lib/env';
import { ago, isNew, isHot } from '@/lib/format';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Icon from '@/components/Icons';

export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const b = board(slug);
  return { title: b ? b.name : '게시판' };
}

export default async function BoardPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const b = board(slug);
  if (!b) notFound();

  const data = await getData();
  const all = postsOf(data, slug);
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const page = clamp(parseInt(sp?.page ?? '1', 10) || 1, 1, pages);
  const rows = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const siblings = boardsOf(b.group);
  const { bySlug } = channelMap();
  const launcherUrl = `https://github.com/${LAUNCHER_REPO}/releases/latest`;

  return (
    <>
      <SiteHeader menu={buildMenu(data, { pathname: `/board/${slug}` })} launcherUrl={launcherUrl} />

      <section>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">홈</Link>
            <Icon name="arrow" size={12} />
            <span>{b.group === 'news' ? '서버 소식' : '커뮤니티'}</span>
            <Icon name="arrow" size={12} />
            <span>{b.name}</span>
          </div>

          <div className="board-head">
            <h1>{b.name}</h1>
            <span className="cnt-all">{all.length}개의 글</span>
            {bySlug[slug] ? <span className="ch">#{slug} 채널에서 동기화</span> : null}
          </div>

          <nav className="boardnav">
            {siblings.map((s) => (
              <Link key={s.slug} href={`/board/${s.slug}`} aria-current={s.slug === slug ? 'page' : undefined}>
                {s.name}
              </Link>
            ))}
          </nav>

          {rows.length === 0 ? (
            <div className="hint">
              <b>아직 글이 없습니다</b>
              {bySlug[slug]
                ? '연결된 디스코드 채널에 새 글이 올라오면 자동으로 여기에 쌓입니다.'
                : <>이 게시판은 디스코드 채널과 연결되지 않았습니다. <code>DISCORD_CHANNELS</code> 에 <code>{slug}:채널ID</code> 를 추가하세요.</>}
            </div>
          ) : (
            <div className="rows">
              {rows.map((p) => (
                <Link className="row" href={`/board/${slug}/${p.id}`} key={p.id}>
                  <span className="rt">
                    {p.pinned ? <span className="pin">고정</span> : null}
                    {isHot(p) ? <span className="hot">HOT</span> : null}
                    <span className="tx">{p.title}</span>
                    {isNew(p.createdAt) ? <span className="new-badge">NEW</span> : null}
                    {p.images?.length ? (
                      <span className="imgmark"><Icon name="image" size={12} />{p.images.length}</span>
                    ) : null}
                  </span>
                  <span className="meta">
                    <b>{p.author}</b>
                    <span>{ago(p.createdAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <Pager page={page} pages={pages} slug={slug} />
        </div>
      </section>

      <SiteFooter
        serverVersion={data.settings.serverVersion}
        launcherUrl={launcherUrl}
        discordInvite={data.settings.discordInvite}
      />
    </>
  );
}

function Pager({ page, pages, slug }) {
  if (pages <= 1) return null;
  const nums = pageNumbers(page, pages);
  return (
    <nav className="pager" aria-label="페이지">
      {page > 1 ? (
        <Link href={href(slug, page - 1)} aria-label="이전 페이지">
          <Icon name="arrow" size={13} style={{ transform: 'rotate(180deg)' }} />
        </Link>
      ) : null}
      {nums.map((n, i) =>
        n === '…'
          ? <span className="gap" key={`gap-${i}`}>…</span>
          : n === page
            ? <span className="cur" key={n} aria-current="page">{n}</span>
            : <Link href={href(slug, n)} key={n}>{n}</Link>,
      )}
      {page < pages ? (
        <Link href={href(slug, page + 1)} aria-label="다음 페이지"><Icon name="arrow" size={13} /></Link>
      ) : null}
    </nav>
  );
}

function href(slug, page) {
  return page === 1 ? `/board/${slug}` : `/board/${slug}?page=${page}`;
}

function pageNumbers(page, pages) {
  const out = new Set([1, pages, page, page - 1, page + 1]);
  const list = [...out].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const withGaps = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) withGaps.push('…');
    withGaps.push(n);
  });
  return withGaps;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
