"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api, formatMoney } from "@/lib/utils";
import { PageHeader, Stagger, StaggerItem } from "@/components/motion";
import { MotionLink } from "@/components/Button";

type Order = {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: "IRR" | "USD" | "EUR";
  createdAt: string;
};

export default function OrdersPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    api<Order[]>("/orders")
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  return (
    <div className="container-page py-10">
      <PageHeader title={t("orders")} />
      <Stagger className="space-y-3">
        {(orders ?? []).map((o) => (
          <StaggerItem key={o.id}>
            <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{o.number}</p>
                <p className="text-sm text-[var(--muted)]">{o.status}</p>
              </div>
              <p>{formatMoney(o.total, o.currency, locale)}</p>
              <MotionLink href={`/account/orders/${o.id}/invoice`} className="btn btn-ghost">
                {t("invoice")}
              </MotionLink>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
