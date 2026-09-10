import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData } from '@/lib/data';
import { buildMenu } from '@/lib/menu';
import { getSession } from '@/lib/session';
import { findDoc, docsOf, GROUPS } from '@/lib/guides';
import { LAUNCHER_REPO, hasAuth } from '@/lib/env';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import DocBody from '@/components/DocBody';
import Icon from '@/components/Icons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getData();
  const doc = findDoc(data, slug);
  return { title: doc ? doc.name : '문서', description: doc?.summary || undefined };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getData(), getSession()]);
  const doc = findDoc(data, slug);
  if (!doc) notFound();

  const group = doc.group || 'guide';
  const siblings = docsOf(data, group);
  const launcherUrl = LAUNCHER_REPO ? `https://github.com/${LAUNCHER_REPO}/releases/latest` : '#';

  return (
    <>
      <SiteHeader
        menu={buildMenu(data, { pathname: `/guide/${slug}` })}
        launcherUrl={launcherUrl}
        user={user}
        authEnabled={hasAuth}
      />
      <section>
        <div className="wrap">
          <div className="crumb">
            <Link href="/">홈</Link>
            <Icon name="arrow" size={12} />
            <Link href="/guide">{GROUPS[group]?.label || '가이드'}</Link>
            <Icon name="arrow" size={12} />
            <span>{doc.name}</span>
          </div>

          <div className="docrow">
            <nav className="docnav" aria-label={`${GROUPS[group]?.label} 목록`}>
              <b>{GROUPS[group]?.label || '가이드'}</b>
              <ul>
                {siblings.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guide/${g.slug}`} aria-current={g.slug === slug ? 'page' : undefined}>
                      {g.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <article className="article doc-article">
              <h1>{doc.name}</h1>
              {doc.summary ? <p className="doc-sum">{doc.summary}</p> : null}
              <DocBody text={doc.body} />
              {user?.staff ? (
                <footer>
                  <span className="back"><Link className="btn-quiet" href="/admin">운영에서 수정</Link></span>
                </footer>
              ) : null}
            </article>
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
