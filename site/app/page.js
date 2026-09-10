import { getData } from '@/lib/data';
import { boardsOf, boardName, channelMap } from '@/lib/boards';
import { buildMenu } from '@/lib/menu';
import { LAUNCHER_REPO } from '@/lib/env';
import { ago } from '@/lib/format';

import SiteHeader from '@/components/SiteHeader';
import Hero from '@/components/Hero';
import { NewsPanel, CommunityPanel } from '@/components/Panels';
import Rail from '@/components/Rail';
import { Events, Systems, Media, Guides } from '@/components/Sections';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getData();
  const newsBoards = boardsOf('news');
  const communityBoards = boardsOf('community');
  const launcherUrl = `https://github.com/${LAUNCHER_REPO}/releases/latest`;
  const { bySlug } = channelMap();
  const syncedAgo = data.sync?.lastRunAt ? ago(data.sync.lastRunAt) : '';

  const withName = (list) => list.map((p) => ({ ...p, boardName: boardName(p.board) }));
  const pick = (boards, limit) => {
    const set = new Set(boards.map((b) => b.slug));
    return withName(
      data.posts
        .filter((p) => set.has(p.board))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit),
    );
  };

  return (
    <>
      <div className="utilbar">
        <div className="wrap">
          <span className="brandline">SQUAREVILLAGE NETWORK</span>
          <nav>
            <a href={launcherUrl} target="_blank" rel="noopener noreferrer">런처 다운로드</a>
            <a href="/board/notice">서버 규칙</a>
            <a href="/board/suggest">건의</a>
            <a href="/board/qna">문의</a>
            {data.settings.discordInvite
              ? <a href={data.settings.discordInvite} target="_blank" rel="noopener noreferrer">디스코드</a>
              : null}
          </nav>
        </div>
      </div>

      <SiteHeader menu={buildMenu(data, { pathname: '/' })} launcherUrl={launcherUrl} />

      <Hero banners={data.banners} />

      <section id="news">
        <div className="wrap">
          <div className="mainrow">
            <NewsPanel boards={newsBoards} posts={pick(newsBoards, 20)} syncedAgo={syncedAgo} />
            <CommunityPanel boards={communityBoards.slice(0, 4)} posts={pick(communityBoards, 24)} />
            <Rail
              launcher={data.settings.launcher}
              launcherUrl={launcherUrl}
              discordInvite={data.settings.discordInvite}
              channelPairs={Object.keys(bySlug)}
              syncedAgo={syncedAgo}
            />
          </div>
        </div>
      </section>

      <Events events={data.events} />
      <Systems systems={data.systems} />
      <Media videos={data.videos} />
      <Guides guides={data.guides} />

      <SiteFooter
        serverVersion={data.settings.serverVersion}
        launcherUrl={launcherUrl}
        discordInvite={data.settings.discordInvite}
      />
    </>
  );
}
