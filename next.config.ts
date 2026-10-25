import type { NextConfig } from "next";

/**
 * 本地开发：浏览器只访问 Next（31002），
 * /api、Tracker、RSS、下载由 rewrites 转发到后端（31001）。
 * 生产由前端 Nginx 直接反代这些路径，不依赖 rewrites。
 *
 * 这里不发送 X-Kyou-Secret：本地直连模式不需要它。
 */
const apiOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:31001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // vendor/contracts 以 file: 符号链接引入，Turbopack 需要显式转译其中的 TS。
  transpilePackages: ["@kyokkou/contracts"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/announce", destination: `${apiOrigin}/announce` },
      { source: "/announce/:passkey", destination: `${apiOrigin}/announce/:passkey` },
      { source: "/scrape", destination: `${apiOrigin}/scrape` },
      { source: "/scrape/:passkey", destination: `${apiOrigin}/scrape/:passkey` },
      { source: "/rss", destination: `${apiOrigin}/rss` },
      { source: "/rss.xml", destination: `${apiOrigin}/rss.xml` },
      { source: "/t/:path*", destination: `${apiOrigin}/t/:path*` },
    ];
  },
};

export default nextConfig;
