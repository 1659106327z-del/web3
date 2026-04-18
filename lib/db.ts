import { PrismaClient } from "@prisma/client";

// 复用同一个 Prisma 实例，避免 Next.js 热更新期间产生过多连接
declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaClient = prisma;
}
