"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type Province = { id: string; nameFa: string; shippingRates: { priceIrr: number }[] };

export default function AdminShipping() {
  const [items, setItems] = useState<Province[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [priceIrr, setPriceIrr] = useState(50000);
  async function load() {
    setItems(await api<Province[]>("/shipping/provinces"));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await api("/admin/shipping", { method: "POST", body: JSON.stringify({ provinceId, priceIrr, priceUsd: 8, priceEur: 7 }) });
    await load();
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Shipping</h1>
      <form className="card mt-6 max-w-md space-y-3 p-5" onSubmit={submit}>
        <select className="input" value={provinceId} onChange={(e) => setProvinceId(e.target.value)}>
          <option value="">province</option>
          {items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameFa} ({p.shippingRates[0]?.priceIrr ?? "-"})
            </option>
          ))}
        </select>
        <input className="input" type="number" value={priceIrr} onChange={(e) => setPriceIrr(Number(e.target.value))} />
        <MotionButton className="btn btn-primary">Save</MotionButton>
      </form>
    </div>
  );
}
