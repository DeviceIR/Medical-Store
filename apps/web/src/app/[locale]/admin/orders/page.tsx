"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/utils";

type Order = { id: string; number: string; status: string; total: number; guestPhone?: string | null };

export default function AdminOrders() {
  const [items, setItems] = useState<Order[]>([]);
  async function load() {
    setItems(await api<Order[]>("/admin/orders"));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function setStatus(id: string, status: string) {
    await api(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <div className="mt-6 space-y-3">
        {items.map((o) => (
          <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{o.number}</p>
              <p className="text-sm text-[var(--muted)]">{o.status}</p>
            </div>
            <select className="input w-auto" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
              {["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
