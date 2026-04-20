"""第 5 章 系统实现与关键技术"""


def write(doc, api):
    api["h1"](doc, "5  系统实现与关键技术")

    api["h2"](doc, "5.1  开发环境")
    api["para"](
        doc,
        "整套系统在 Windows 10 64 位环境下完成主开发，运行时核心依赖如下："
        "Node.js 22 LTS、Next.js 14.2.35、React 18.3.1、TypeScript 5.6.3、"
        "Tailwind CSS 3.4.14、Zustand 4.5.5、Framer Motion 11.11.9、Prisma 6.18.0、jose 6.2.2、bcryptjs 3.0.3。"
        "包管理使用 npm；版本控制使用 Git，远端托管在 GitHub 上；"
        "生产部署到 Railway 平台，借助其 Nixpacks 自动识别 Next.js 工程并完成构建。"
    )

    api["h2"](doc, "5.2  核心调度算法的实现")
    api["para"](
        doc,
        "六种算法都遵循 4.2 节定义的统一接口，把仿真过程抽象成「时间游标 + 事件流」两件事。"
        "下面挑选最有代表性的两个算法，把核心实现展开来讲。"
    )

    api["h3"](doc, "5.2.1  最短剩余时间优先（SRTF）")
    api["para"](
        doc,
        "SRTF 的难点在于「事件粒度」的把控。"
        "教材里 SRTF 通常被描述为「每个时刻都重新比较」，但工程上不可能真的每 1 ms 检查一遍。"
        "本实现采取折中策略：在「下一个进程到达」与「当前进程完成」这两个事件之间，"
        "可以安全地认为剩余时间最短的进程不会改变；据此推进时间游标到下一个事件，再重新决策。"
    )

    api["code"](
        doc,
        """// lib/scheduler/srtf.ts （核心循环节选）
while (done.size < n) {
  const ready = processes.filter(
    (p) => p.arrival <= t && !done.has(p.id) && (remaining.get(p.id) ?? 0) > 0
  );
  if (!ready.length) {
    t = Math.min(...processes
      .filter(p => !done.has(p.id) && p.arrival > t)
      .map(p => p.arrival));
    continue;
  }
  ready.sort((a, b) =>
    (remaining.get(a.id)! - remaining.get(b.id)!) ||
    a.arrival - b.arrival || a.id.localeCompare(b.id)
  );
  const pick = ready[0];
  if (running !== pick.id) {
    if (running) events.push({ t, type: "preempt", pid: running, reason: "shorter" });
    events.push({ t, type: "dispatch", pid: pick.id });
    running = pick.id;
  }
  const futureArrivals = processes
    .filter(p => !done.has(p.id) && p.arrival > t)
    .map(p => p.arrival);
  const nextEvent = futureArrivals.length ? Math.min(...futureArrivals) : Infinity;
  const runUntil = Math.min(t + (remaining.get(pick.id) ?? 0), nextEvent);
  segs.push({ pid: pick.id, start: t, end: runUntil });
  remaining.set(pick.id, (remaining.get(pick.id) ?? 0) - (runUntil - t));
  t = runUntil;
  if ((remaining.get(pick.id) ?? 0) <= 1e-9) {
    events.push({ t, type: "complete", pid: pick.id });
    done.add(pick.id);
    running = null;
  }
}""",
    )
    api["caption"](doc, "代码 5-1  SRTF 核心调度循环")

    api["h3"](doc, "5.2.2  多级反馈队列（MFQ）")
    api["para"](
        doc,
        "MFQ 在 SRTF 之上增加了三件事：多个就绪队列、用满时间片自动降级、高级队列非空时立即抢占。"
        "实现时把就绪队列建模为按优先级排序的数组：每次循环找出最高级非空队列的队首，"
        "运行 `min(quantum[level], remaining)` 这么长，然后判断它是「跑完」「降级」还是「被抢占」。"
        "如果在运行期间有更高级队列接收了新到进程，就需要把当前进程截短并退回原级队首，"
        "等待下一轮调度——这是一个工程上的细节，但在演示场景中非常关键。"
    )

    api["h2"](doc, "5.3  动态甘特图")
    api["para"](
        doc,
        "Canvas 渲染的关键在于设备像素比（DPR）适配。"
        "现代显示器的物理像素与 CSS 像素不再是 1:1，如果不做 DPR 缩放，"
        "高分屏上画的色块和文字会出现明显锯齿。"
        "实现里通过 `devicePixelRatio` 把 canvas 的物理尺寸放大到 CSS 尺寸的 dpr 倍，"
        "再用 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` 让所有绘图坐标继续使用 CSS 像素。"
        "时间轴的刻度按总时长智能选择步长（1/2/5），避免刻度过密；"
        "当前播放时刻则画一根带圆点的橙色虚线游标，与 SVG 舞台保持视觉一致。"
    )

    api["h2"](doc, "5.4  SVG 调度舞台与自适应布局")
    api["para"](
        doc,
        "舞台被划分为五个区域：待到达、就绪队列、CPU、阻塞队列、完成队列。"
        "每个进程是一个 `<motion.g>`，初始位置由「当前所在区域 + 区域内序号」决定。"
        "Framer Motion 接管位置变化的过渡动画——当 `currentTime` 推进、进程从就绪流入 CPU 时，"
        "组件不需要写任何 keyframe，只要给 motion.g 一个新的 `{x, y}`，"
        "底层会自动以 spring 物理模型补出中间帧。"
    )
    api["para"](
        doc,
        "舞台一个被反复打磨的细节是「进程过多时不溢出」。"
        "早期实现把就绪队列高度写死为 200 px，结果在 6 进程全部堆在就绪队列时画面会被裁切。"
        "改进版本根据进程总数计算卡片尺寸（1 个 78×48、6 个 48×32 等阶梯），"
        "再根据每个区域当前的进程数计算所需行数，整体 viewBox 高度由各区域所需高度动态相加，"
        "确保任何输入下舞台都能完整呈现。MFQ 设计器中的多层队列采用同样的策略，"
        "每个 Q 行高度独立扩展，最后再把多余高度回填到最低优先级队列以保持左右对齐。"
    )

    api["h2"](doc, "5.5  播放引擎")
    api["para"](
        doc,
        "Zustand 维护的全局 store 持有 `currentTime`、`playing`、`speed` 三个核心状态。"
        "`PlaybackControls` 组件在 `useEffect` 里启动一个 `requestAnimationFrame` 循环：每帧根据"
        "时间差与倍速推进 `currentTime`，到达 `makespan` 时自动停止并把 `playing` 置 false。"
        "「单步」的实现并没有用「推进固定 1 ms」这种粗暴方式，"
        "而是在 store 里查找下一个 `t > currentTime` 的事件，把 `currentTime` 直接跳到该事件时刻。"
        "这样无论倍速多大、用户是否在播放中，单步永远等价于「跳到下一个发生有意义动作的瞬间」。"
    )

    api["h2"](doc, "5.6  鉴权链路")
    api["para"](
        doc,
        "鉴权由四层协作完成。"
        "`POST /api/auth/register` 校验用户名密码格式，bcrypt 哈希后写入 SQLite，"
        "签发 JWT 并以 HTTP-Only Cookie 写回响应；"
        "`POST /api/auth/login` 比较哈希值后同样签发 Cookie；"
        "`GET /api/auth/me` 读取 Cookie 还原用户信息，供前端显示头像与用户名；"
        "`POST /api/auth/logout` 把 Cookie 标记为过期。"
        "拦截层的核心是 `middleware.ts`：它运行在 Edge Runtime，对每个请求"
        "调用 `verifySessionToken` 校验 JWT，未通过的浏览器请求被 302 跳转到登录页，未通过的 API 请求直接返回 401。"
        "由于 Edge Runtime 不支持 bcryptjs 的 Node 原生绑定，项目专门拆出了一份"
        "`lib/session-edge.ts`，仅依赖 jose 实现纯 ES 模块的 JWT 校验，"
        "保证中间件在生产环境也能正常打包。"
    )

    api["code"](
        doc,
        """// middleware.ts 节选
const PUBLIC_PREFIXES = ["/account", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/account";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}""",
    )
    api["caption"](doc, "代码 5-2  Edge 中间件实现强制登录")

    api["h2"](doc, "5.7  MFQ 设计器与五维评分")
    api["para"](
        doc,
        "MFQ 设计器把队列层数、每级时间片、降级策略等参数从源代码里释放到界面控件，"
        "让使用者无需改代码就能尝试自己的方案。"
        "界面上提供三种快速预设：等差递增（如 [2, 4, 6, 8]）、"
        "等比递增（如 [1, 2, 4, 8]）与教材常用配置（如 [2, 4, 8]）。"
        "每次修改后系统会立即重新仿真，并校验时间片单调性——"
        "如果出现「Q1 时间片小于 Q0」这种违背 MFQ 设计原则的情况，"
        "面板顶部会浮起一个琥珀色提示，但仍允许继续仿真，"
        "让学习者亲眼看到这种配置的负面后果。"
    )
    api["para"](
        doc,
        "评分系统由五个维度加权而成。"
        "短作业友好度衡量短作业平均周转相对长作业平均周转的优势；"
        "长作业完成保障度量长作业平均周转相对总完成时间的占比，越接近 1 表示长作业没有被无限期推迟；"
        "CPU 利用率使用算法本身计算出的值；"
        "切换开销控制以「上下文切换次数 / 6n」做基准（n 为进程数），切换越少得分越高；"
        "高优先级命中率统计在 Q0 与 Q1 完成的进程占比。"
        "五项分别按 25%、20%、20%、15%、20% 加权汇总到 0–100 的总分，"
        "并以一个圆环可视化呈现，配合每项的子分数让使用者一眼看出短板。"
        "同时系统始终在后台跑一组默认 [2, 4, 8] 的基线，"
        "每个指标旁边都标记出与基线的差值与方向，红色↑ / 绿色↓直接反映改进或退步。"
    )
