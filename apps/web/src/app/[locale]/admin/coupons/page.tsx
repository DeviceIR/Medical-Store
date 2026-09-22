"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type Coupon = { code: string; percentOff?: number | null; amountIrr?: number | null; active: boolean };

export default function AdminCoupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", percentOff: 10 });
  async function load() {
    setItems(await api<Coupon[]>("/admin/coupons"));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await api("/admin/coupons", { method: "POST", body: JSON.stringify(form) });
    await load();
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Coupons</h1>
      <form className="card mt-6 max-w-md space-y-3 p-5" onSubmit={submit}>
        <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" />
        <input className="input" type="number" value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: Number(e.target.value) })} />
        <MotionButton className="btn btn-primary">Save</MotionButton>
      </form>
      <ul className="mt-6 space-y-2">
        {items.map((c) => (
          <li key={c.code} className="card p-3">
            {c.code} · {c.percentOff}% · {c.active ? "on" : "off"}
          </li>
        ))}
      </ul>
    </div>
  );
}
