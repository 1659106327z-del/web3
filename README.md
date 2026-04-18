# 操作系统进程调度算法可视化演示系统

基于 Web 的进程调度算法可视化教学工具，覆盖 FCFS、SJF、SRTF、RR、优先级调度（PSA）与多级反馈队列（MFQ）六种经典调度算法。通过甘特图与动态舞台动画直观呈现调度流程，并提供双算法并排对比与系统化的算法介绍。

## 功能概览

- 六种调度算法的事件驱动仿真，支持播放 / 暂停 / 单步 / 重置 / 倍速
- Canvas 甘特图实时绘制 CPU 占用情况
- SVG 调度舞台：进程在就绪队列、CPU、阻塞队列、完成队列之间动态迁移
- 同一组进程在两种算法下并排对比甘特图及平均周转时间
- 每个算法独立的专题介绍页（发展脉络 / 原理 / 伪代码 / 优劣势）
- 进程数量上限 6，支持手动添加或随机生成测试用例

## 技术栈

- Next.js 14 App Router + React 18 + TypeScript
- Tailwind CSS（自定义设计令牌）+ `tailwindcss-animate`
- Zustand（播放与仿真状态）
- Framer Motion（SVG 过渡动画）
- Lucide React（图标）
- 字体：Fira Sans（正文）/ Fira Code（数据与伪代码）

## 快速开始

```bash
npm install
npm run dev
```

访问 <http://localhost:3000> 即可打开可视化主页。

可用脚本：

- `npm run dev` — 启动开发服务器
- `npm run build` — 生产构建
- `npm run start` — 运行生产构建
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript 类型检查

## 目录结构

```text
app/                // Next.js 路由与页面
components/         // UI 组件、布局与调度相关组件
lib/scheduler/      // 六种调度算法的仿真引擎
store/              // Zustand 状态仓库
```

## 路线图

- 阶段一（当前）：算法仿真、可视化、对比、介绍等纯前端能力
- 阶段二：登录注册与用例持久化（Prisma + SQLite + NextAuth）
