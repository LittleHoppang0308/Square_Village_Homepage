import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getData } from '@/lib/data';
import { board, BOARDS, channelMap } from '@/lib/boards';
import { buildMenu } from '@/lib/menu';
import { getSession } from '@/lib/session';
import { LAUNCHER_REPO, hasAuth, DISCORD_MIRROR } from '@/lib/env';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import WriteForm from '@/components/WriteForm';
import Icon from '@/components/Icons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const b = board(slug);
  return { title: b ? `${b.name} 글쓰기` : '글쓰기' };
}

export default async function WritePage({ params }) {
  const { slug } = await params;
  const b = board(slug);
  if (!b) notFound();

  const user = await getSession();
  if (!user) redirect(`/api/auth/login?next=/board/${slug}/write`);
  if (b.staff && !user.staff) {
    redirect(`/login-failed?reason=${encodeURIComponent(`${b.name} 은 운영진만 작성할 수 있습니다`)}`);
  }

  const data = await getData();
  const { bySlug } = channelMap();
  const launcherUrl = LAUNCHER_REPO ? `https://github.com/${LAUNCHER_REPO}/releases/latest` : '#';

  // 운영진 전용 게시판은 운영진에게만 선택지로 보인다
  const options = BOARDS
    .filter((x) => !x.staff || user.staff)
    .map((x) => ({ slug: x.slug, name: x.name, channel: Boolean(bySlug[x.slug]) }));

  return (
    <>
      <SiteHeader
        menu={buildMenu(data, { pathname: `/board/${slug}` })}
        launcherUrl={launcherUrl}
        user={user}
        authEnabled={hasAuth}
      />
      <section>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">홈</Link>
            <Icon name="arrow" size={12} />
            <Link href={`/board/${slug}`}>{b.name}</Link>
            <Icon name="arrow" size={12} />
            <span>글쓰기</span>
          </div>
          <div className="board-head">
            <h1>글쓰기</h1>
            <span className="cnt-all">{user.name} 님으로 작성</span>
          </div>
          <div className="article">
            <WriteForm boards={options} initialBoard={slug} mirrorOn={DISCORD_MIRROR} />
          </div>
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
