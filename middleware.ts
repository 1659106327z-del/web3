import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-edge";

// 强制登录：除登录页和 auth API 外，所有路由都要求会话有效
const PUBLIC_PREFIXES = ["/account", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 静态资源、Next.js 内部、图标等放行
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (session) return NextResponse.next();

  // 未登录 → 跳到 /account 并把原路径作为 next 参数带回去
  // 对 /api/* 接口直接返回 401 JSON，便于前端处理
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/account";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  const response = NextResponse.redirect(url);
  // 明确禁止浏览器/CDN 缓存未登录重定向，避免登录后仍从缓存拿到旧 302
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export const config = {
  matcher: [
    // 所有页面 + API（排除 _next 静态资源）
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
