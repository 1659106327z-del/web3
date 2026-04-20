import { Suspense } from "react";
import { AccountPlaceholder } from "@/components/account/AccountPlaceholder";

// 客户端组件自己用 useSearchParams，Suspense 边界已足够；不再强制 dynamic
// 以减小 App Router 在跨 force-dynamic / 静态 页面导航时的边界情况。

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPlaceholder />
    </Suspense>
  );
}
