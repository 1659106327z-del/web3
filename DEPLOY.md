# Railway 部署指南

本项目使用 Next.js + Prisma + SQLite，可零改动部署到 [Railway](https://railway.app/)。

## 前置条件

- 已把代码推到 GitHub（仓库地址：<https://github.com/1659106327z-del/web3>）
- 准备一个 Railway 账号（直接 GitHub 一键登录）

## 步骤

### 1. 登录 Railway

打开 <https://railway.app/>，点 **Login → Continue with GitHub** 授权。

### 2. 创建项目

- 顶部菜单 **+ New** → **Deploy from GitHub repo**
- 第一次需要安装 Railway 的 GitHub App，授权选 `1659106327z-del/web3` 仓库
- 选择本仓库，Railway 会自动识别为 Next.js 工程并开始构建

### 3. 添加持久化卷（Volume）

SQLite 文件需要持久化目录，否则每次重新部署都会清空账号数据。

- 进入项目页 → 点击你的服务卡片 → 顶部 **Volumes** 标签
- 点 **+ Add Volume**
- Mount Path 填：`/data`
- Size 默认 1 GB（足够，可后续扩容）

### 4. 设置环境变量

- 进入服务 → **Variables** 标签
- 添加如下两条（**必填**）：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:/data/prod.db` |
| `AUTH_SECRET` | 至少 32 字节随机字符串（见下） |

`AUTH_SECRET` 生成方法（PowerShell 任意终端）：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

将输出结果粘到 `AUTH_SECRET` 即可。

### 5. 触发首次部署

设置完变量后，Railway 会自动重新部署。在 **Deployments** 标签可看到日志：

1. 安装依赖（`npm install`）
2. `prisma generate`（postinstall 自动执行）
3. `npm run build`（编译 Next.js）
4. `npm run start` 启动时会先执行 `prisma db push`，
   在 `/data/prod.db` 创建 SQLite 库结构，再启动 Next.js 服务

部署成功后状态会变为 **Active**。

### 6. 拿到公网域名

- 在服务页 → **Settings** 标签 → **Networking** 区域
- 点 **Generate Domain**，几秒后会得到一个 `https://xxx.up.railway.app` 网址
- 任何设备打开此网址即可访问，**电脑关机也无影响**

## 常见问题

### Q: 部署后访问 500 错误，日志显示 `AUTH_SECRET 未设置`

- 检查 Variables 标签的 `AUTH_SECRET` 是否填了，长度至少 16 字节

### Q: 登录后再部署一次，账号数据消失

- 检查是否在第 3 步挂载了 Volume 到 `/data`
- 检查 `DATABASE_URL` 是否指向 `/data/...`

### Q: 想后续切换到 PostgreSQL

- Railway 项目内 + New → Database → Postgres
- 把 `DATABASE_URL` 改为 Postgres 提供的连接串
- 修改 `prisma/schema.prisma` 第 9 行 `provider = "postgresql"`
- 本地执行 `npm run db:generate` 后提交推送

## 后续更新

每次 `git push` 到 main 分支，Railway 会自动重新部署。
