import './globals.css';

export const metadata = {
  title: { default: '스퀘어빌리지', template: '%s · 스퀘어빌리지' },
  description: '마인크래프트 RPG 서버 스퀘어빌리지 공식 홈페이지 — 공지사항, 업데이트, 커뮤니티, 런처 다운로드',
  openGraph: {
    title: '스퀘어빌리지',
    description: '마인크래프트 RPG 서버 스퀘어빌리지',
    type: 'website',
  },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
