import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Phase 0：站点名先用产品默认值，Phase 1 接入 bootstrap 后由 /api/v1/site
 * 与 generateMetadata 驱动，不在客户端堆站点常量。
 */
export const metadata: Metadata = {
  title: {
    default: "KyokkouPT",
    template: "%s — KyokkouPT",
  },
  description: "通用、可配置、可自部署的私有种子站引擎",
};

/**
 * 首帧前确定主题，避免闪白/闪黑。
 * 默认固定浅色（极昼 polar），只有用户手动切过才使用 localStorage 记录值。
 * 与服务端渲染的 data-theme="polar" 一致，脚本在首帧前改写，避免水合不一致。
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("kp-theme");document.documentElement.dataset.theme=(t==="aurora"?"aurora":"polar");}catch(e){document.documentElement.dataset.theme="polar";}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="polar" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 用 <link> 而不是 next/font：构建期不联网也能 build，加载失败自动回退系统字体 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body id="top">
        <a className="skip-link" href="#main">
          跳到主内容
        </a>
        {children}
      </body>
    </html>
  );
}
