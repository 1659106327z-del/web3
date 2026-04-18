# 操作系统进程调度算法可视化演示系统

基于 Web 的进程调度算法可视化教学工具，覆盖 FCFS、SJF、SRTF、RR、优先级调度（PSA）与多级反馈队列（MFQ）六种经典调度算法。通过甘特图与动态舞台动画直观呈现调度流程，并提供双算法并排对比、系统化的算法介绍，以及账号登录后的跨设备用例同步能力。

## 功能概览

- 六种调度算法的事件驱动仿真，支持播放 / 暂停 / 单步 / 重置 / 倍速
- Canvas 甘特图实时绘制 CPU 占用情况
- SVG 调度舞台：进程在就绪队列、CPU、阻塞队列、完成队列之间动态迁移
- 同一组进程在两种算法下并排对比甘特图及平均周转时间
- 每个算法独立的专题介绍页（发展脉络 / 原理 / 伪代码 / 优劣势）
- 登录 / 注册（bcrypt 密码哈希 + HTTP-Only Cookie 会话），保存与加载个人用例
- 进程数量上限 6，支持手动添加或随机生成测试用例

## 技术栈

- Next.js 14 App Router + React 18 + TypeScript
- Tailwind CSS（Glassmorphism 暖色调令牌）+ `tailwindcss-animate`
- Zustand（播放与仿真状态）
- Framer Motion（SVG 过渡动画）
- Lucide React（图标）
- Prisma + SQLite（账号与用例持久化）
- jose（JWT 签发 / 校验）+ bcryptjs（密码哈希）
- 字体：Fira Sans（正文）/ Fira Code（数据与伪代码）

## 快速开始

```bash
# 1. 安装依赖（会自动 prisma generate）
npm install

# 2. 准备环境变量
cp .env.example .env
#   ⚠️ 将 AUTH_SECRET 替换为一段至少 32 字节的随机字符串
#   生成示例：node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 3. 创建本地 SQLite 数据库
npm run db:push

# 4. 启动开发服务器
npm run dev
```

访问 <http://localhost:3000> 即可打开可视化主页。

可用脚本：

- `npm run dev` — 启动开发服务器
- `npm run build` — 生产构建
- `npm run start` — 运行生产构建
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript 类型检查
- `npm run db:generate` — 生成 Prisma Client
- `npm run db:push` — 根据 schema 创建或更新本地数据库
- `npm run db:studio` — 打开 Prisma Studio 可视化管理数据库

## 目录结构

```text
app/
  api/auth/        // 登录 / 注册 / 退出 / me 路由
  api/presets/     // 用例 CRUD
  visualize/       // 算法可视化
  comparison/      // 双算法对比
  intro/           // 算法介绍
  account/         // 登录注册页
components/        // UI、布局、调度相关组件
lib/scheduler/     // 六种调度算法的仿真引擎
lib/auth.ts        // 密码哈希、JWT、Cookie 辅助
lib/db.ts          // Prisma 客户端单例
prisma/schema.prisma
store/             // Zustand 状态仓库
```

## 数据模型

```prisma
User {
  id, username(unique), email?(unique), passwordHash, createdAt, updatedAt
}

Preset {
  id, userId, name, algorithm, processes(JSON), config(JSON), createdAt, updatedAt
}
```

会话使用 HS256 JWT 存储于 `os_sched_session` Cookie（HTTP-Only、SameSite=Lax，
生产环境追加 Secure），有效期 30 天；不同设备登录同一账号即可共享用例。

## 部署提示

- 生产环境务必替换 `.env` 中的 `AUTH_SECRET`
- SQLite 在单机部署下无需额外服务；多实例或更大规模部署可将
  `schema.prisma` 中 `provider` 改为 `postgresql` 并执行 `prisma migrate deploy`
