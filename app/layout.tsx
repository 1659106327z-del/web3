import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SessionProvider } from "@/components/layout/SessionProvider";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "进程调度算法可视化演示系统",
  description:
    "面向教学的操作系统进程调度算法可视化平台，涵盖 FCFS、SJF、SRTF、RR、优先级调度与多级反馈队列。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${firaSans.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
          <ToastProvider>
            <div className="relative z-10 flex min-h-screen w-full">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <TopBar />
                <main className="flex-1 px-4 py-6 md:pl-6 md:pr-6 lg:pr-10 lg:py-8">
                  {children}
                </main>
              </div>
            </div>
          </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
