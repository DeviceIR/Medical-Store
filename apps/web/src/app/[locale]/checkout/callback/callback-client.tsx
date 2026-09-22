"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/utils";
import { MotionLink } from "@/components/Button";

export default function CallbackInner() {
  const t = useTranslations("checkout");
  const sp = useSearchParams();
  const [ok, setOk] = useState<boolean | null>(null);
  const [number, setNumber] = useState("");

  useEffect(() => {
    const authority = sp.get("Authority") ?? sp.get("authority");
    const status = sp.get("Status") ?? sp.get("status") ?? "OK";
    const provider = sp.get("provider") ?? "ZARINPAL";
    if (!authority) {
      setOk(false);
      return;
    }
    api<{ number: string }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify({ authority, status, provider }),
    })
      .then((order) => {
        setOk(true);
        setNumber(order.number);
      })
      .catch(() => setOk(false));
  }, [sp]);

  return (
    <div className="container-page py-16 text-center">
      {ok === null ? <p>...</p> : null}
      {ok === true ? (
        <div className="card mx-auto max-w-md p-8">
          <h1 className="text-2xl font-bold">{t("success")}</h1>
          <p className="mt-2">{number}</p>
          <MotionLink href="/account/orders" className="btn btn-primary mt-6">
            Orders
          </MotionLink>
        </div>
      ) : null}
      {ok === false ? <p className="text-[var(--danger)]">{t("failed")}</p> : null}
    </div>
  );
}
