import { Suspense } from "react";
import WalletClient from "./wallet-client";

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">...</div>}>
      <WalletClient />
    </Suspense>
  );
}
