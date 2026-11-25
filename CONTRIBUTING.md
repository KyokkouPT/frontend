# frontend 贡献指南

这是前端仓库。通用规则（CLA、提交规范、安全、跨仓库约定）见 [组织级贡献指南](https://github.com/KyokkouPT/.github/blob/main/CONTRIBUTING.md)。

## 环境

- Node.js 24+ 与 pnpm
- 本地开发需要后端运行在 `31001`

## 启动

```bash
pnpm install
cp .env.development.example .env
pnpm dev
```

打开 <http://127.0.0.1:31002>。`/api`、`/rss`、下载、`/announce`、`/scrape` 由 Next rewrites 与 `server.mjs` 转发到后端。

## 目录

```text
app/                  App Router 页面（(auth) / (site) / (staff) 分组）
components/           页面组件与 ui 基础组件
lib/                  API 客户端、bootstrap、格式化
vendor/contracts/     与后端一致的共享类型
server.mjs            自定义 Next server，转发 Tracker 原始请求
```

## 提交前检查

```bash
pnpm typecheck && pnpm build
```

## 页面约定

- 默认 server component，只有交互或状态才加 `"use client"`；
- 空状态、错误状态、加载状态必须实现，不静默回退到假数据；
- 站点名、导航、分区、页脚、计数来自 `/api/v1/bootstrap`，不要写死；
- 服务端请求走 `serverFetch`，浏览器请求走 `apiFetch` / `apiPost`。

## 界面改动

- PR 附截图，明暗主题各一张；
- 桌面与移动端至少各检查一次；
- 颜色使用 `@theme` 里的 token，不写死色值。

## 不要提交

`node_modules/`、`.next/`、`.env`、`dist/`。
