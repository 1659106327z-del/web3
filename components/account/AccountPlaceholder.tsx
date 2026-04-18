"use client";

import { useState } from "react";
import { ShieldCheck, Info, User, Lock, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

export function AccountPlaceholder() {
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { push } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    push("账户模块将在阶段二接入数据库后启用", "warn");
  };

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
                : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
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
                : "text-ink-soft hover:bg-surface-muted dark:hover:bg-surface-dark-muted"
            )}
          >
            注册
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Field
            icon={User}
            label="用户名"
            value={username}
            onChange={setUsername}
            placeholder="请输入用户名"
            autoComplete="username"
          />
          {tab === "register" && (
            <Field
              icon={Mail}
              label="电子邮箱"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          )}
          <Field
            icon={Lock}
            label="密码"
            value={password}
            onChange={setPassword}
            placeholder="至少 8 位字符"
            type="password"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />
          <Button variant="primary" className="mt-2" type="submit">
            {tab === "login" ? "登录" : "创建账户"}
          </Button>
        </form>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <div className="mb-1 flex items-center gap-1.5 font-medium">
            <Info className="h-3.5 w-3.5" />
            阶段说明
          </div>
          此页面为登录注册界面的 UI 占位。账户数据库、会话管理、多设备同步将在阶段二接入 Prisma + SQLite，并通过 NextAuth 提供服务端验证。
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
        <div className="mt-4 rounded-xl border border-line bg-surface p-3 text-xs text-ink-soft dark:border-line-dark dark:bg-surface-dark">
          无账户也能完整体验所有可视化与对比功能。
        </div>
      </Card>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-soft">
      <span>{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-brand dark:border-line-dark dark:bg-surface-dark">
        <Icon className="h-4 w-4 text-ink-faint" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint dark:text-ink-inverse"
        />
      </div>
    </label>
  );
}
