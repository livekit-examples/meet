<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# LiveKit Meet

<p>
  <a href="https://meet.livekit.io"><strong>在线演示</strong></a>
  •
  <a href="https://github.com/livekit/components-js">LiveKit Components</a>
  •
  <a href="https://docs.livekit.io/">LiveKit 文档</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
  •
  <a href="https://blog.livekit.io/">博客</a>
</p>

<br>

LiveKit Meet 是一个基于 [LiveKit Components](https://github.com/livekit/components-js)、[LiveKit Cloud](https://cloud.livekit.io/) 和 Next.js 构建的开源视频会议应用。它使用全新的组件库从头重新设计。

![LiveKit Meet 截图](./.github/assets/livekit-meet.jpg)

## 技术栈

- 基于 [Next.js](https://nextjs.org/) 项目，使用 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 初始化。
- 应用使用 [@livekit/components-react](https://github.com/livekit/components-js/) 库构建。

## 演示

访问 https://meet.livekit.io 在线体验。

## 开发环境搭建

本地开发环境搭建步骤：

1. 运行 `pnpm install` 安装所有依赖。
2. 将项目根目录下的 `.env.example` 复制并重命名为 `.env.local`。
3. 更新新创建的 `.env.local` 文件中缺失的环境变量。
4. 运行 `pnpm dev` 启动开发服务器，访问 [http://localhost:3000](http://localhost:3000) 查看结果。
5. 开始开发 🎉
