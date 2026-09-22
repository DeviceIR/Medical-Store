import { Suspense } from "react";
import CallbackInner from "./callback-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="container-page py-16">...</div>}>
      <CallbackInner />
    </Suspense>
  );
}
