/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 이미지는 /api/img 프록시로 나가므로 next/image 최적화는 쓰지 않는다
  images: { unoptimized: true },
};
export default nextConfig;
