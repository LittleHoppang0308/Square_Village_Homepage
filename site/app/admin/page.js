import Link from 'next/link';
import { getData } from '@/lib/data';
import { buildMenu } from '@/lib/menu';
import { getSession } from '@/lib/session';
import { LAUNCHER_REPO, hasAuth, hasGithub } from '@/lib/env';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AdminEditor from '@/components/AdminEditor';
import Icon from '@/components/Icons';

export const metadata = { title: '운영' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // 미들웨어가 이미 막지만, 직접 접근에도 안전하도록 한 번 더 확인한다
  const user = await getSession();
  const [data] = await Promise.all([getData()]);
  const launcherUrl = LAUNCHER_REPO ? `https://github.com/${LAUNCHER_REPO}/releases/latest` : '#';

  if (!user?.staff) {
    return (
      <>
        <SiteHeader menu={buildMenu(data)} launcherUrl={launcherUrl} user={user} authEnabled={hasAuth} />
        <section>
          <div className="wrap">
            <div className="hint" style={{ maxWidth: 520, margin: '40px auto' }}>
              <b>운영진만 접근할 수 있습니다</b>
              디스코드에서 운영진 역할을 가진 계정으로 로그인해 주세요.
              <div style={{ marginTop: 16 }}><Link className="btn-back" href="/">홈으로</Link></div>
            </div>
          </div>
        </section>
        <SiteFooter serverVersion={data.settings.serverVersion} launcherUrl={launcherUrl} />
      </>
    );
  }

  return (
    <>
      <SiteHeader menu={buildMenu(data)} launcherUrl={launcherUrl} user={user} authEnabled={hasAuth} />
      <section>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">홈</Link>
            <Icon name="arrow" size={12} />
            <span>운영</span>
          </div>
          <div className="board-head">
            <h1>운영</h1>
            <span className="cnt-all">{user.name} 님 · 저장하면 저장소에 커밋됩니다</span>
          </div>

          {!hasGithub ? (
            <div className="hint" style={{ marginBottom: 16 }}>
              <b>저장소가 연결되지 않았습니다</b>
              <code>GITHUB_TOKEN</code> · <code>GITHUB_REPO</code> 를 설정해야 저장할 수 있습니다.
            </div>
          ) : null}

          <div className="article">
            <AdminEditor data={data} />
          </div>

          <p className="admin-foot">
            게시판 글과 댓글은 여기서 다루지 않습니다. 글은 각 글 페이지에서 지울 수 있고,
            디스코드에서 온 글은 <code>data.json</code> 을 직접 고쳐 내립니다.
          </p>
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
