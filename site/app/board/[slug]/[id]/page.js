import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData, findPost, postsOf } from '@/lib/data';
import { board, channelMap } from '@/lib/boards';
import { buildMenu } from '@/lib/menu';
import { LAUNCHER_REPO } from '@/lib/env';
import { ymdhm, toBlocks } from '@/lib/format';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Icon from '@/components/Icons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug, id } = await params;
  const data = await getData();
  const post = findPost(data, slug, id);
  return {
    title: post ? post.title : '글',
    description: post ? String(post.body || '').slice(0, 140) : undefined,
  };
}

export default async function PostPage({ params }) {
  const { slug, id } = await params;
  const b = board(slug);
  if (!b) notFound();

  const data = await getData();
  const post = findPost(data, slug, id);
  if (!post) notFound();

  const list = postsOf(data, slug);
  const idx = list.findIndex((p) => String(p.id) === String(id));
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  const { bySlug } = channelMap();
  const launcherUrl = `https://github.com/${LAUNCHER_REPO}/releases/latest`;
  const blocks = toBlocks(post.body);

  return (
    <>
      <SiteHeader menu={buildMenu(data, { pathname: `/board/${slug}` })} launcherUrl={launcherUrl} />

      <section>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">홈</Link>
            <Icon name="arrow" size={12} />
            <Link href={`/board/${slug}`}>{b.name}</Link>
          </div>

          <article className="article">
            <h1>{post.title}</h1>
            <div className="amet">
              <b>{post.author}</b>
              <span>{ymdhm(post.createdAt)}</span>
              {post.editedAt ? <span>수정됨</span> : null}
              {bySlug[slug] ? <span className="ch">#{slug}</span> : null}
              {post.images?.length ? <span>이미지 {post.images.length}장</span> : null}
            </div>

            <div className="body">
              {blocks.map((line, i) => (
                <p key={i}>
                  {line.length === 0 ? ' ' : line.map((part, j) =>
                    part.t === 'link' ? (
                      <a key={j} href={part.v} target="_blank" rel="noopener noreferrer nofollow">{part.v}</a>
                    ) : (
                      <span key={j}>{part.v}</span>
                    ),
                  )}
                </p>
              ))}
            </div>

            {post.images?.length ? (
              <div className="shots">
                {post.images.map((rel) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={rel} src={`/api/img/${rel}`} alt="" loading="lazy" />
                ))}
              </div>
            ) : null}

            <footer>
              {prev ? <Link href={`/board/${slug}/${prev.id}`}>← 다음 글</Link> : null}
              {next ? <Link href={`/board/${slug}/${next.id}`}>이전 글 →</Link> : null}
              <span className="back">
                <Link className="btn-back" href={`/board/${slug}`}>목록으로</Link>
              </span>
            </footer>
          </article>
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
