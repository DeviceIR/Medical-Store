"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type User = { id: string; email?: string | null; phone?: string | null; role: string; wallet?: { balanceIrr: number } | null };

export default function AdminUsers() {
  const [items, setItems] = useState<User[]>([]);
  useEffect(() => {
    api<User[]>("/admin/users").then(setItems).catch(() => undefined);
  }, []);

  async function credit(id: string) {
    await api(`/admin/users/${id}/wallet`, { method: "PATCH", body: JSON.stringify({ amount: 100000, currency: "IRR" }) });
    setItems(await api<User[]>("/admin/users"));
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Users</h1>
      <div className="mt-6 space-y-3">
        {items.map((u) => (
          <div key={u.id} className="card flex items-center justify-between p-4">
            <div>
              <p>{u.email || u.phone}</p>
              <p className="text-sm text-[var(--muted)]">{u.role} · wallet {u.wallet?.balanceIrr ?? 0}</p>
            </div>
            <MotionButton className="btn btn-ghost" onClick={() => credit(u.id)}>
              +100k
            </MotionButton>
          </div>
        ))}
      </div>
    </div>
  );
}
