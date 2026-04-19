import { Suspense } from "react";
import { AccountPlaceholder } from "@/components/account/AccountPlaceholder";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPlaceholder />
    </Suspense>
  );
}
