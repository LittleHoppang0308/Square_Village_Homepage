import Link from 'next/link';
import { getData } from '@/lib/data';
import { buildMenu } from '@/lib/menu';
import { getSession } from '@/lib/session';
import { docsOf, GROUPS } from '@/lib/guides';
import { LAUNCHER_REPO, hasAuth } from '@/lib/env';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Icon from '@/components/Icons';

export const metadata = { title: '가이드' };
export const dynamic = 'force-dynamic';

export default async function GuideIndex() {
  const [data, user] = await Promise.all([getData(), getSession()]);
  const launcherUrl = LAUNCHER_REPO ? `https://github.com/${LAUNCHER_REPO}/releases/latest` : '#';

  return (
    <>
      <SiteHeader
        menu={buildMenu(data, { pathname: '/guide' })}
        launcherUrl={launcherUrl}
        user={user}
        authEnabled={hasAuth}
      />
      <section>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">홈</Link>
            <Icon name="arrow" size={12} />
            <span>가이드</span>
          </div>

          {['guide', 'intro'].map((g) => {
            const list = docsOf(data, g);
            if (!list.length) return null;
            return (
              <div key={g} style={{ marginBottom: 30 }}>
                <div className="board-head">
                  <h1 style={{ fontSize: 21 }}>{GROUPS[g].label}</h1>
                  <span className="cnt-all">{list.length}개의 문서</span>
                </div>
                <div className="doccards">
                  {list.map((d) => (
                    <Link className="doccard" href={`/guide/${d.slug}`} key={d.slug}>
                      <span className="dcicon"><Icon name={d.icon || 'book'} size={22} /></span>
                      <b>{d.name}</b>
                      {d.summary ? <span>{d.summary}</span> : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
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
