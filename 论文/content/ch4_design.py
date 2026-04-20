"""第 4 章 系统设计"""


def write(doc, api):
    api["h1"](doc, "4  系统设计")

    api["h2"](doc, "4.1  总体架构")
    api["para"](
        doc,
        "系统采用前后端一体化的 Next.js 全栈架构，整体分为四个层次。"
        "最外层是浏览器中的 React 客户端组件，承载页面渲染、动画与用户输入；"
        "向内一层是运行在 Edge Runtime 上的中间件，负责会话校验与未登录跳转；"
        "再向内是 Node.js 运行时下的 API Routes，处理认证、用例 CRUD 等业务请求；"
        "最底层是基于 Prisma ORM 操作的 SQLite 数据库，"
        "在生产环境通过持久化卷挂载到 `/data/prod.db`。"
    )
    api["figure_placeholder"](doc, "图 4-1  系统总体分层架构")

    api["para"](
        doc,
        "横向上看，前端依据职责被进一步切分。布局组件（Sidebar、TopBar、ThemeProvider、SessionProvider）"
        "维护全局壳；调度页面组件（visualize、designer、comparison、intro）承载具体业务；"
        "调度核心库（lib/scheduler/*）负责算法仿真，与 UI 完全解耦，便于在测试用例中复用。"
    )

    api["h2"](doc, "4.2  事件驱动仿真引擎契约")
    api["para"](
        doc,
        "整套仿真引擎围绕一份统一的接口约定展开，强调「同一份事实，多种视图」。"
        "每个调度算法实现成一个纯函数，接收进程列表与算法配置，"
        "返回一份完整的事件序列、甘特段记录与统计指标。"
        "Canvas 甘特图、SVG 调度舞台与统计表格三处视图都直接消费这同一份输出，"
        "避免出现「图上画的」和「表里写的」对不上号的尴尬。"
    )

    api["code"](
        doc,
        """interface Process {
  id: string;
  name: string;
  arrival: number;
  burst: number;
  priority?: number;
  colorIndex?: number;
}

type EventType = "arrive" | "dispatch" | "preempt" | "complete" | "demote";

interface TimelineEvent {
  t: number;
  type: EventType;
  pid: string;
  reason?: "quantum" | "priority" | "shorter" | "demote" | "manual";
  toLevel?: number;
  fromLevel?: number;
}

interface GanttSegment {
  pid: string;
  start: number;
  end: number;
  level?: number;
}

interface SimulationResult {
  events: TimelineEvent[];
  segments: GanttSegment[];
  stats: RunStats;
  makespan: number;
}

interface Scheduler {
  key: AlgorithmKey;
  run(processes: Process[], config: AlgoConfig): SimulationResult;
}""",
    )
    api["caption"](doc, "代码 4-1  统一的调度器接口约定（lib/scheduler/types.ts 节选）")

    api["para"](
        doc,
        "事件序列里 `type` 字段覆盖了进程从生成到完成的全部状态迁移：到达、被派发到 CPU、被抢占、降级、运行结束。"
        "甘特段则是从事件中派生出的「连续 CPU 占用区间」，方便甘特图直接绘制。"
        "`level` 字段对 MFQ 算法是必不可少的，对其他算法可以省略，留给调用者按需读取。"
    )

    api["h2"](doc, "4.3  播放引擎与状态派生")
    api["para"](
        doc,
        "播放控制层并不真正「重新跑算法」，而是只维护一个 `currentTime` 时间游标。"
        "当用户点击播放时，浏览器的 `requestAnimationFrame` 循环按照倍速推进时间；"
        "「单步」则跳到下一个事件时刻。"
        "调度舞台与甘特图都根据 `currentTime` 派生当前应该展示的画面状态——"
        "甘特图绘制 0 到 `currentTime` 之间的所有色块；舞台通过比较 `currentTime` "
        "与每个进程的 arrive、dispatch、preempt、complete 事件时刻，决定它当前位于哪个区域。"
    )

    api["h2"](doc, "4.4  数据模型设计")
    api["para"](
        doc,
        "Prisma schema 定义了两张表，关系简洁。"
        "User 表存放账户信息，username 设为唯一索引以支持登录时的快速查找；"
        "passwordHash 存放 bcrypt 哈希值，绝不存原始密码。"
        "Preset 表通过 userId 外键挂在 User 上，删除用户时级联清空其用例。"
        "processes 与 config 两个 JSON 字段以 SQLite 的 TEXT 形态存储——"
        "调度仿真涉及的进程数与配置项数量都很有限，序列化为 JSON 既简单又便于跨语言读写。"
    )

    api["code"](
        doc,
        """model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String?  @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  presets      Preset[]
}

model Preset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  algorithm String   // fcfs / sjf / srtf / rr / psa / mfq
  processes String   // JSON: Process[]
  config    String   // JSON: AlgoConfig
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId, createdAt])
}""",
    )
    api["caption"](doc, "代码 4-2  Prisma 数据库模型定义")

    api["h2"](doc, "4.5  界面流程")
    api["para"](
        doc,
        "未登录用户访问任何受保护路由都会被中间件拦截并跳转到 `/account?next=<原路径>`。"
        "登录成功后，前端会读取 URL 上的 `next` 参数把用户送回原本想去的页面；"
        "若用户主动从侧栏点击「账户」，由于 URL 上没有 `next`，则停留在账户资料页，避免被强制弹走。"
        "整个过程对用户而言只有「登录界面 → 我刚才点的那一页」一次跳转。"
    )

    api["h2"](doc, "4.6  设计系统：暖色玻璃拟态")
    api["para"](
        doc,
        "为了让一个偏理论的工具型应用在视觉上不至于过分严肃，本项目刻意避开了"
        "技术教学网站常见的蓝紫渐变与发光元素，转而采用一套相对克制的暖色玻璃拟态："
        "茶绿主色（#0F766E）做品牌强调，琥珀辅色（#B45309）做主要操作按钮，"
        "底色采用米色（#FAF6EE）配合三处低饱和度的环境光斑做装饰，"
        "卡片与侧栏统一使用 `backdrop-blur` 配合 `rgba(255,255,255,0.68)` 的玻璃面板，"
        "深色模式下切换为「近黑色 + 浅灰文字」的对应主题。"
        "字体方面，正文使用 Fira Sans 提升可读性，数据与代码使用 Fira Code 等宽字体，"
        "整体观感偏「工具型 Dashboard」而非「营销页 Hero」。"
    )
    api["figure_placeholder"](doc, "图 4-2  调度可视化页主界面")
