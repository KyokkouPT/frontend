# KyokkouPT · frontend

通用、可配置、可自部署的私有 PT 站引擎前端。**独立 Git 仓库**，只通过 HTTP API 访问后端。

- Next.js 16 App Router + React 19 + Tailwind v4 + TypeScript
- 端口：`31002`
- 本地开发：Next rewrites 把 `/api`、Tracker、RSS、下载转发到后端 `31001`
- 生产：前端 Nginx 直接反代这些路径，并注入 `X-Kyou-Secret`（后端 Nginx 校验）

> 当前进度：Phase 4 纵切（社区：邀请注册 + 求种 + 排行榜 + 用户主页）。登录、首页、规则、我的概览、浏览、详情、上传、审核台、通知、做种/下载/魔力值/RSS、注册、邀请、求种、排行、用户主页已接真实 API；2FA、账号设置与 Staff 其余页面按下一轮接入。

## 设计来源（只读）

UI 来自仓库外层的 `web/` v0 原型，**不复制 fixture 进本仓库**：

- 已移植：`app/globals.css`（`@theme` token、polar/aurora 主题、抽屉动画、base 层）、`components/ui/*`、`theme-switch`、`brand-mark`、`back-to-top`、`notice`、`ratio-ring`、`promo-badge`、`page-header`、shell 组件（`app-shell`/`top-bar`/`sidebar`/`site-footer`/`mobile-nav`/`mobile-tab-bar`/`user-menu`/`auth-shell`）与 `torrent-row`
- 已适配：导航、站点名、页脚、计数、当前用户全部来自 `/api/v1/bootstrap`；删除了硬编码的 `SITE_NAV`、`ME`、`SITE`、`STATS`、`AD_SLOTS` 等 fixture
- 未移植：`lib/site.ts`、`lib/me.ts`、`lib/staff.ts`、`lib/users.ts`、`lib/torrents.ts` 以及依赖它们的业务页面（按纵切逐个接 API）

## 页面（Phase 4）

| 路由 | 说明 | 数据来源 |
| --- | --- | --- |
| `/` | 首页：问候、统计、最新发布、公告、分区、促销、我的待办 | `/api/v1/home` + bootstrap |
| `/rules` | 注册、审核、Tracker、H&R、分区规范 | `/api/v1/rules` |
| `/login` | 登录（真实表单 + CSRF） | `/api/v1/auth/csrf`、`/api/v1/auth/login` |
| `/me` | 我的概览（登录守卫；未登录跳 `/login?next=/me`） | `/api/v1/me` |
| `/browse` | 浏览：分区/分类/促销/字段/搜索/排序/加载更多 | `/api/v1/torrents` |
| `/t/[id]` | 种子详情：规格、文件树、描述、相关版本、下载 | `/api/v1/torrents/:id` |
| `/upload` | 发布：文件、分区字段、promo、标签（登录守卫） | `POST /api/v1/torrents` |
| `/staff/review` | 审核台：队列、通过/驳回/退回（staff.review） | `/api/v1/staff/review` |
| `/notifications` | 站内通知：未读、单条/全部已读 | `/api/v1/notifications` |
| `/me/seeding` | 做种列表：上传/下载/分享率/做种时长 | `/api/v1/me` |
| `/me/leeching` | 正在下载：状态与做种义务提示 | `/api/v1/me` |
| `/me/bonus` | 魔力值：余额、每小时产出、账本、兑换、冻结提示 | `/api/v1/me/bonus` |
| `/me/rss` | 个人 RSS 地址与复制 | `/api/v1/me/rss` |
| `/signup` | 注册：邀请码、规则确认、自动登录 | `/api/v1/auth/signup` |
| `/me/invite` | 邀请码列表/生成/复制 | `/api/v1/me/invites` |
| `/requests` | 求种列表、发布（冻结悬赏）、取消、Staff 结算 | `/api/v1/requests` |
| `/top` | 用户与种子榜单（上传/魔力/做种/种子表现） | `/api/v1/top` |
| `/u/[name]` | 公开用户主页与最近发布 | `/api/v1/users/:name` |

空状态、错误状态、加载状态均已实现：API 失败时显示 problem+json 文案与排查提示，不静默回退到假数据。

## 数据流

- 页面默认 server component；`(site)/layout.tsx` 在服务端 `getBootstrap()`，通过 `BootstrapProvider` 给客户端壳。
- 服务端请求：`lib/api/server.ts` 的 `serverFetch`（转发 Cookie、生产可选 `X-Kyou-Secret`、`no-store`、problem+json 抛错）。
- 浏览器写请求：`lib/api/client.ts` 的 `apiFetch`/`apiPost`（Cookie + `x-csrf-token`）；登录页先 `ensureCsrf`。
- 登录成功 `router.replace(next)` + `router.refresh()`；登出是认证边界，使用整页导航重建 bootstrap。
- bootstrap 失败时壳仍可渲染：站点名/导航有中性 fallback，页面显示错误状态。
- 下载：列表/详情使用后端返回的 `download_url`（`/t/:id/download`）作为 `<a>`；未登录时指向 `/login?next=/t/:id`，不做假按钮。
- 上传：`apiUpload` 发送 `FormData`（浏览器生成 multipart boundary），字段来自分区配置；成功后跳 `/me?uploaded=…` 显示提示。
- 本地 rewrite 只代理 `/t/:id/download`，不能把 `/t/[id]` 页面路由代理到后端。
- 兑换：`apiPost` 带 `Idempotency-Key`，成功后 `router.refresh()` 重新拉余额与账本；冻结/余额不足展示 problem+json 文案。
- RSS 说明页在 `/me/rss`；后端 RSS 端点是 `/rss`、`/rss.xml`。**本地 next rewrite 会破坏 announce 的二进制 query**，Tracker 验收请直连后端 31001。

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
│   ├── (site)/             # 站点壳：首页 / 浏览 / 详情 / 上传 / 规则 / 我的 / 通知
│   ├── (auth)/             # 认证壳：登录
│   ├── (staff)/            # 站务壳：审核台
│   └── error/not-found/loading.tsx
├── components/
│   ├── ui/                 # button badge panel field stat avatar data-table…
│   ├── providers/          # bootstrap context
│   ├── browse-explorer.tsx upload-form.tsx review-queue.tsx notifications-list.tsx
│   ├── snatch-table.tsx bonus-exchange.tsx rss-copy.tsx
│   ├── login-form.tsx
│   └── shell 组件（app-shell/staff-shell/top-bar/sidebar/footer/mobile-*）
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

2FA/账号设置、Staff 举报/反作弊/审计/申诉，以及 SMTP 邮件偏好。规范见仓库外 `docs/19-frontend-spec.md`。
