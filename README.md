# KyokkouPT · frontend

通用、可配置、可自部署的私有 PT 站引擎前端。**独立 Git 仓库**，只通过 HTTP API 访问后端。

- Next.js 16 App Router + React 19 + Tailwind v4 + TypeScript
- 端口：`31002`
- 本地开发：Next rewrites 把 `/api`、Tracker、RSS、下载转发到后端 `31001`
- 生产：前端 Nginx 直接反代这些路径，并注入 `X-Kyou-Secret`（后端 Nginx 校验）

> 当前进度：Phase 1 纵切（bootstrap + auth + shell）。登录、首页、规则、我的概览已接真实 API；目录、上传、Tracker、经济、社区、Staff 按后续纵切接入。

## 设计来源（只读）

UI 来自仓库外层的 `web/` v0 原型，**不复制 fixture 进本仓库**：

- 已移植：`app/globals.css`（`@theme` token、polar/aurora 主题、抽屉动画、base 层）、`components/ui/*`、`theme-switch`、`brand-mark`、`back-to-top`、`notice`、`ratio-ring`、`promo-badge`、`page-header`、shell 组件（`app-shell`/`top-bar`/`sidebar`/`site-footer`/`mobile-nav`/`mobile-tab-bar`/`user-menu`/`auth-shell`）与 `torrent-row`
- 已适配：导航、站点名、页脚、计数、当前用户全部来自 `/api/v1/bootstrap`；删除了硬编码的 `SITE_NAV`、`ME`、`SITE`、`STATS`、`AD_SLOTS` 等 fixture
- 未移植：`lib/site.ts`、`lib/me.ts`、`lib/staff.ts`、`lib/users.ts`、`lib/torrents.ts` 以及依赖它们的业务页面（按纵切逐个接 API）

## 页面（Phase 1）

| 路由 | 说明 | 数据来源 |
| --- | --- | --- |
| `/` | 首页：问候、统计、最新发布、公告、分区、促销、我的待办 | `/api/v1/home` + bootstrap |
| `/rules` | 注册、审核、Tracker、H&R、分区规范 | `/api/v1/rules` |
| `/login` | 登录（真实表单 + CSRF） | `/api/v1/auth/csrf`、`/api/v1/auth/login` |
| `/me` | 我的概览（登录守卫；未登录跳 `/login?next=/me`） | `/api/v1/me` |

空状态、错误状态、加载状态均已实现：API 失败时显示 problem+json 文案与排查提示，不静默回退到假数据。

## 数据流

- 页面默认 server component；`(site)/layout.tsx` 在服务端 `getBootstrap()`，通过 `BootstrapProvider` 给客户端壳。
- 服务端请求：`lib/api/server.ts` 的 `serverFetch`（转发 Cookie、生产可选 `X-Kyou-Secret`、`no-store`、problem+json 抛错）。
- 浏览器写请求：`lib/api/client.ts` 的 `apiFetch`/`apiPost`（Cookie + `x-csrf-token`）；登录页先 `ensureCsrf`。
- 登录成功 `router.replace(next)` + `router.refresh()`；登出是认证边界，使用整页导航重建 bootstrap。
- bootstrap 失败时壳仍可渲染：站点名/导航有中性 fallback，页面显示错误状态。

## 启动

```bash
pnpm install
pnpm dev            # http://localhost:31002
```

后端在另一个仓库：`cd ../backend && pnpm install && pnpm migrate && pnpm seed && pnpm dev`。

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | Next dev（31002） |
| `pnpm build` | 生产构建（Turbopack） |
| `pnpm start` | 运行构建产物（31002） |
| `pnpm typecheck` | `tsc --noEmit` |

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `API_ORIGIN` | `http://127.0.0.1:31001` | rewrites 的后端地址 |
| `BACKEND_API_ORIGIN` | 同 `API_ORIGIN` | 服务端 RSC `serverFetch` 的后端地址 |
| `BACKEND_SECRET` | 空 | 仅生产：作为 `X-Kyou-Secret` 发给后端 Nginx。**不要加 `NEXT_PUBLIC_`，不要进客户端组件** |

## `X-Kyou-Secret` 规则

- 本地直连：不配置、不发送、不校验。
- 生产：前端 Nginx 对 `/api`、`/announce`、`/scrape`、`/rss`、`/t/` 注入 `proxy_set_header X-Kyou-Secret "<shared-secret>";`，后端 Nginx 校验；**后端 Node 本身不校验**。
- 它只是服务间共享 header，不是唯一安全边界；生产仍需防火墙/内网限制。

## 目录

```text
frontend/
├── app/
│   ├── layout.tsx          # 主题首帧脚本、字体、skip-link
│   ├── globals.css         # 设计 token + 主题覆盖
│   ├── (site)/             # 站点壳路由组：首页 / 规则 / 我的
│   ├── (auth)/             # 认证壳路由组：登录
│   └── error/not-found/loading.tsx
├── components/
│   ├── ui/                 # button badge panel field stat avatar data-table…
│   ├── providers/          # bootstrap context
│   ├── login-form.tsx
│   └── shell 组件（app-shell/top-bar/sidebar/footer/mobile-*）
├── lib/
│   ├── api/{server,client}.ts
│   ├── bootstrap.ts  nav.ts  nav-icons.ts  nav-store.ts  format.ts  cn.ts
├── vendor/contracts/       # 共享 DTO/zod（复制维护，与 backend 一致）
└── pnpm-workspace.yaml     # 仅 pnpm 设置，不是工作区
```

## vendor 契约同步

- `vendor/contracts` 与 `backend/vendor/contracts` **内容必须一致**。
- 后端改 DTO 后复制到本仓库，两边各自 `pnpm install && pnpm typecheck`，再分别提交。
- `file:` 目录依赖是复制（不是链接），**改完契约必须重新 `pnpm install`**。
- 依赖写 `file:vendor/contracts`，禁止 `workspace:*`；`zod` 是直接依赖（契约包内部 `import "zod"` 需要宿主解析）。
- 当前契约 `@kyokkou/contracts@0.1.0`。

## 关于 `pnpm-workspace.yaml`

pnpm 11 只从 `pnpm-workspace.yaml` 读取 build scripts 严格度设置。本文件只有 `strictDepBuilds: false`，没有 `packages`/`catalog`，不构成工作区、不共享依赖；根目录仍然没有该文件。

## 待移植页面（按纵切）

浏览/详情/上传/审核 → 我的做种/下载/魔力值 → 求种/排行/通知/设置/站务 → 申诉/2FA。规范见仓库外 `docs/19-frontend-spec.md`。
