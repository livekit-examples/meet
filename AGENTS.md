# AGENTS.md

## 项目概述

LiveKit Meet — 基于 Next.js 15 (App Router) + @livekit/components-react 的开源视频会议应用。单包仓库，非 monorepo。

## 开发命令

- 包管理器: **pnpm** (packageManager 字段锁定版本，勿用 npm/yarn)
- `pnpm dev` — 启动开发服务器 (localhost:3000)
- `pnpm build` — 生产构建
- `pnpm lint` — ESLint (next/core-web-vitals)
- `pnpm lint:fix` — 自动修复 lint
- `pnpm format:check` — Prettier 检查
- `pnpm format:write` — Prettier 自动格式化
- `pnpm test` — vitest run (无 watch 模式)

CI 顺序: lint → format:check → test。提交前应按此顺序验证。

## 测试

- 框架: vitest，无独立配置文件，使用默认配置
- 目前仅一个测试文件: `lib/getLiveKitURL.test.ts`
- 运行单个测试: `pnpm test -- getLiveKitURL` (vitest 文件名过滤)

## 代码风格

- Prettier: singleQuote, trailingComma: all, semi: true, tabWidth: 2, printWidth: 100
- 路径别名: `@/*` 映射到项目根目录 `./*`
- TypeScript strict 模式

## 架构要点

### 路由结构

- `/` — 首页，两个 tab: DemoMeeting / CustomConnection
- `/rooms/[roomName]` — 主要会议页面 (动态路由)
- `/custom` — 自定义服务器连接 (传入 liveKitUrl + token)
- `/api/connection-details` — 服务端生成 participant token (GET)
- `/api/record/start`, `/api/record/stop` — 录制控制 (GET)

### 服务端 vs 客户端

- `app/rooms/[roomName]/page.tsx` 是 Server Component，解析 searchParams 后传给 `PageClientImpl`
- `PageClientImpl.tsx` 标记 `'use client'`，处理 Room 连接和 UI
- API route `connection-details/route.ts` 使用 `livekit-server-sdk` 的 AccessToken 在服务端签发 JWT

### E2EE (端到端加密)

- passphrase 通过 URL hash fragment 传递 (非 searchParams)
- `lib/useSetupE2EE.ts` 从 `location.hash` 读取 passphrase
- 需要 Web Worker: `livekit-client/e2ee-worker`
- next.config.js 设置 COOP/COEP header 以支持 SharedArrayBuffer (E2EE Worker 必需)
- E2EE 启用时，av1/vp9 codec 会被降级为 undefined

### 环境变量

必需 (`.env.local`):
- `LIVEKIT_API_KEY` — LiveKit API 密钥
- `LIVEKIT_API_SECRET` — LiveKit API 密钥
- `LIVEKIT_URL` — LiveKit 服务器 URL (wss://...)

可选:
- `NEXT_PUBLIC_SHOW_SETTINGS_MENU=true` — 启用设置菜单 (含 Krisp 降噪)
- `NEXT_PUBLIC_LK_RECORD_ENDPOINT=/api/record` — 启用录制功能
- `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT` — 自定义连接详情端点 (默认 `/api/connection-details`)
- `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` / `NEXT_PUBLIC_DATADOG_SITE` — Datadog 日志
- `S3_KEY_ID`, `S3_KEY_SECRET`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION` — 录制存储

### 录制安全警告

`app/api/record/start/route.ts` 和 `stop/route.ts` **无身份验证**，任何知道 roomName 的人都可启停录制。代码中有明确注释 "DO NOT USE THIS FOR PRODUCTION PURPOSES AS IS"。

### LiveKit Cloud 区域路由

`lib/getLiveKitURL.ts` 处理区域 URL 重写: `myproject.livekit.cloud` → `myproject.{region}.production.livekit.cloud`。staging 环境不插入 `production` 段。

## LiveKit 文档

LiveKit 是快速迭代的项目，始终参考最新文档。LiveKit 提供 MCP server: `https://docs.livekit.io/mcp`

关键工具:
- `get_docs_overview`, `get_pages` — 浏览文档结构
- `docs_search` — 搜索文档 (优于 code_search)
- `get_changelog` — 查看变更日志
- `get_pricing_info` — 定价信息

优先使用浏览类工具获取上下文，搜索类工具作为补充。

## 部署

- sandbox-production 分支通过 `sync-to-production.yaml` workflow 手动同步
- 使用 `livekit-examples/sandbox-deploy-action@v1`
