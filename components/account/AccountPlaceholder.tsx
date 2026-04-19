"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Info,
  User,
  Lock,
  Mail,
  LogOut,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/components/layout/SessionProvider";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

export function AccountPlaceholder() {
  const { user, loading, refresh, logout } = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const nextRaw = search?.get("next");
  // 仅当 URL 上明确带 ?next=（来自鉴权跳转）时才自动回跳；
  // 用户主动点侧栏「账户」时 next 为空，应留在账户页查看资料
  const explicitNext =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.startsWith("/account")
      ? nextRaw
      : null;

  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    if (user && !loading && explicitNext) {
      router.replace(explicitNext);
    }
  }, [user, loading, explicitNext, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const url = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          ...(tab === "register" && email ? { email: email.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        push(data.error ?? "操作失败，请稍后重试", "error");
        return;
      }
      push(tab === "login" ? "登录成功" : "账户创建成功，已自动登录");
      await refresh();
      setPassword("");
      router.replace(explicitNext ?? "/visualize/fcfs");
    } catch {
      push("网络异常，请检查服务器是否运行", "error");
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-ink-soft">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在加载会话…
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <div className="text-lg font-semibold text-ink dark:text-ink-inverse">
                你好，{user.username}
              </div>
              <div className="text-xs text-ink-soft">
                已登录 · 会话在 30 天内有效，刷新或在其他设备访问时会保持登录
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 bg-white/40 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <Field label="用户名">
              <span className="font-mono text-sm text-ink dark:text-ink-inverse">
                {user.username}
              </span>
            </Field>
            <Field label="用户 ID">
              <span className="font-mono text-xs text-ink-soft">{user.id}</span>
            </Field>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                push("已退出登录");
              }}
            >
              <LogOut className="h-4 w-4" /> 退出登录
            </Button>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-brand/5 via-transparent to-accent/5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <div className="text-sm font-semibold">账户能做什么</div>
          </div>
          <ul className="space-y-2 text-sm leading-6 text-ink-soft">
            <li>在「算法可视化」页侧栏保存与加载自定义进程用例</li>
            <li>跨设备同步：多终端登录同一账号即可共享已保存用例</li>
            <li>删除旧用例只作用于本账号，其他账户不受影响</li>
          </ul>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={cn(
              "cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium",
              tab === "login"
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-ink/5 dark:hover:bg-white/5"
            )}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={cn(
              "cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium",
              tab === "register"
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-ink/5 dark:hover:bg-white/5"
            )}
          >
            注册
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <InputField
            icon={User}
            label="用户名"
            value={username}
            onChange={setUsername}
            placeholder="2-30 位字母、数字、汉字、下划线或连字符"
            autoComplete="username"
            required
          />
          {tab === "register" && (
            <InputField
              icon={Mail}
              label="电子邮箱（可选）"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          )}
          <InputField
            icon={Lock}
            label="密码"
            value={password}
            onChange={setPassword}
            placeholder="至少 6 位"
            type="password"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            required
          />
          <Button variant="primary" className="mt-2" type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "login" ? "登录" : "创建账户"}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-xs leading-relaxed text-ink-soft dark:border-white/10 dark:bg-white/[0.03]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            账户数据存储在本地 SQLite 数据库，密码以 bcrypt（10 轮）哈希后保存。会话通过 HTTP-Only
            Cookie 管理，有效期 30 天，可在多台设备共享同一账号。
          </p>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-brand/5 via-transparent to-accent/5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand" />
          <div className="text-sm font-semibold">为什么需要账户</div>
        </div>
        <ul className="space-y-2 text-sm leading-6 text-ink-soft">
          <li>保存自定义进程与算法配置，随时恢复上次演示场景</li>
          <li>跨设备同步：课堂讲解与个人复习共享同一组用例</li>
          <li>导出历史对比结果，辅助撰写实验报告</li>
        </ul>
        <div className="mt-4 rounded-xl border border-ink/10 bg-white/50 p-3 text-xs text-ink-soft backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          无账户也能完整体验所有可视化与对比功能。
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-soft">
      <span>{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white/50 px-3 backdrop-blur-sm focus-within:border-brand dark:border-white/10 dark:bg-white/5">
        <Icon className="h-4 w-4 text-ink-faint" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint dark:text-ink-inverse"
        />
      </div>
    </label>
  );
}
