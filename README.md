# KyokkouPT · frontend

通用、可配置、可自部署的私有 PT 站引擎前端。**独立 Git 仓库**，只通过 HTTP API 访问后端。

- Next.js 16 App Router + React 19 + Tailwind v4 + TypeScript
- 端口：`31002`
- 本地开发：Next rewrites 把 `/api`、Tracker、RSS、下载转发到后端 `31001`
- 生产：前端 Nginx 直接反代这些路径，并注入 `X-Kyou-Secret`（后端 Nginx 校验）

> 当前处于 Phase 0：设计系统与骨架已从 `web/` v0 原型移植，业务页面按纵切逐个接到真实 API。

## 设计来源（只读）

UI 来自仓库外层的 `web/` v0 原型，**不复制进本仓库**：

- 已移植：`app/globals.css`（`@theme` token、polar/aurora 主题、抽屉动画、base 层）、`components/ui/*`、`lib/cn.ts`、`components/theme-switch.tsx`、`components/brand-mark.tsx`
- 未移植：`lib/site.ts`、`lib/me.ts`、`lib/staff.ts`、`lib/users.ts`、`lib/torrents.ts`、`lib/nav.ts` 等 fixture，以及依赖它们的业务页面
- 业务页面的视觉按原稿移植，但数据必须来自 API，不允许静默回退到假数据

## 启动

```bash
pnpm install
pnpm dev            # http://localhost:31002
```

后端在另一个仓库：`cd ../backend && pnpm install && pnpm dev`。

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
│   ├── layout.tsx      # 主题首帧脚本、字体、skip-link
│   ├── globals.css     # 设计 token + 主题覆盖
│   ├── page.tsx        # Phase 0 连通性页（真实调用 /api/v1/health）
│   └── error/not-found/loading.tsx
├── components/
│   ├── ui/             # button badge panel field switch stat avatar data-table…
│   ├── theme-switch.tsx
│   └── brand-mark.tsx
├── lib/
│   ├── api/server.ts   # serverFetch：Cookie、可选 X-Kyou-Secret、problem+json
│   └── cn.ts
├── vendor/contracts/   # 共享 DTO/zod（复制维护，与 backend 一致）
├── next.config.ts      # rewrites + transpilePackages
└── pnpm-workspace.yaml # 仅 pnpm 设置，不是工作区
```

## vendor 契约同步

- `vendor/contracts` 与 `backend/vendor/contracts` **内容必须一致**。
- 后端改 DTO 后复制到本仓库，两边各自 `pnpm typecheck`/`pnpm build` 再分别提交。
- 依赖写 `file:vendor/contracts`，禁止 `workspace:*`。
- `zod` 是直接依赖：契约包内部 `import "zod"` 需要从宿主仓库解析。

## 关于 `pnpm-workspace.yaml`

pnpm 11 只从 `pnpm-workspace.yaml` 读取 build scripts 严格度设置。本文件只有 `strictDepBuilds: false`，没有 `packages`/`catalog`，不构成工作区、不共享依赖；根目录仍然没有该文件。

## 待移植页面（按纵切）

登录/首页/壳（Phase 1）→ 浏览/详情/上传/审核 → 我的/做种/魔力值 → 求种/排行/通知/设置/站务 → 申诉/2FA。规范见仓库外 `docs/19-frontend-spec.md`。
