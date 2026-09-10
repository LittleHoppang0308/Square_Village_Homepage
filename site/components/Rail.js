import Link from 'next/link';
import Icon from './Icons';
import { boardName } from '@/lib/boards';

export default function Rail({ launcher, launcherUrl, discordInvite, channelPairs, syncedAgo }) {
  return (
    <div className="rail">
      <div className="launcher">
        <div className="lh">
          <h3>런처 다운로드</h3>
          {launcher.version ? <span className="ver">{launcher.version}</span> : null}
        </div>
        <p>모드와 자바 설치까지 런처가 처리합니다. 접속은 전용 런처로만 가능합니다.</p>
        <a className="btn-solid" href={launcherUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="github" size={15} />GitHub에서 받기
        </a>
        {(launcher.file || launcher.platform || launcher.releasedAt) ? (
          <ul className="lmeta">
            {launcher.file ? <li><span>파일</span><b>{launcher.file}</b></li> : null}
            {launcher.platform ? <li><span>플랫폼</span><b>{launcher.platform}</b></li> : null}
            {launcher.releasedAt ? <li><span>배포일</span><b>{launcher.releasedAt}</b></li> : null}
          </ul>
        ) : null}
      </div>

      <div className="login">
        <h3>디스코드로 시작하기</h3>
        <p>서버 디스코드 계정으로 로그인하면 게시판 작성과 내 캐릭터 정보 조회가 함께 열립니다.</p>
        <a
          className="btn-d"
          href={discordInvite || '#'}
          {...(discordInvite ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Icon name="discord" size={16} />디스코드 로그인
        </a>
        <Link className="alt" href="/board/qna">마인크래프트 닉네임으로 조회</Link>
      </div>

      <div className="dsync">
        <h3><Icon name="sync" size={14} />디스코드 → 게시판 연동</h3>
        <p>지정한 채널의 새 메시지를 읽어 게시판 글로 변환합니다. 첨부 이미지도 함께 가져옵니다.</p>
        {channelPairs.length ? (
          <ul className="maps">
            {channelPairs.map((slug) => (
              <li key={slug}>
                <code>#{slug}</code>
                <span>→</span>
                <b>{boardName(slug)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>
            <code>DISCORD_CHANNELS</code> 환경변수에 채널을 연결하면 여기에 표시됩니다.
          </p>
        )}
        <footer>
          <Icon name="clock" size={12} />
          {syncedAgo ? `5분마다 자동 갱신 · 마지막 ${syncedAgo}` : '5분마다 자동 갱신 · 아직 실행 전'}
        </footer>
      </div>
    </div>
  );
}
