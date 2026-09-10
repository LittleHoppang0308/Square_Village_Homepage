import Link from 'next/link';

export default function SiteFooter({ serverVersion, launcherUrl, discordInvite }) {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#DDDBD6', fontWeight: 600, fontSize: 15 }}>
              <span>🫐</span><span>스퀘어빌리지</span>
            </div>
            <p style={{ margin: '7px 0 0', fontSize: 12, fontWeight: 300 }}>
              마인크래프트 RPG 서버 · {serverVersion}
            </p>
          </div>
          <nav>
            <Link href="/guide/rules">서버 규칙</Link>
            <Link href="/guide">가이드</Link>
            <Link href="/board/suggest">건의하기</Link>
            <Link href="/board/qna">문의하기</Link>
            <a href={launcherUrl} target="_blank" rel="noopener noreferrer">런처 다운로드</a>
            {discordInvite ? <a href={discordInvite} target="_blank" rel="noopener noreferrer">디스코드</a> : null}
          </nav>
        </div>
        <p className="fine">
          스퀘어빌리지는 개인이 운영하는 비영리 마인크래프트 서버입니다. Minecraft는 Mojang Studios의 상표이며 본 사이트는 Mojang Studios 및 Microsoft와 제휴 관계가 없습니다.<br />
          제작 <b>야채호빵 (hoppang0308)</b> · portfolio.hoppang.kr · © {new Date().getFullYear()} SquareVillage Network
        </p>
      </div>
    </footer>
  );
}
