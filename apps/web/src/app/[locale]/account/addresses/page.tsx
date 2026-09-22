"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type Address = { id: string; fullName: string; line1: string; phone: string };
type Province = { id: string; nameFa: string; nameEn: string; cities: { id: string; nameFa: string; nameEn: string }[] };

export default function AddressesPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [items, setItems] = useState<Address[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [form, setForm] = useState({ fullName: "", phone: "", provinceId: "", cityId: "", line1: "" });

  async function load() {
    setItems(await api<Address[]>("/users/me/addresses"));
  }
  useEffect(() => {
    load().catch(() => undefined);
    api<Province[]>("/shipping/provinces").then(setProvinces).catch(() => undefined);
  }, []);

  const cities = provinces.find((p) => p.id === form.provinceId)?.cities ?? [];

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api("/users/me/addresses", { method: "POST", body: JSON.stringify(form) });
    await load();
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-extrabold">{t("addresses")}</h1>
        <div className="mt-4 space-y-3">
          {items.map((a) => (
            <div key={a.id} className="card p-4">
              <p className="font-semibold">{a.fullName}</p>
              <p className="text-sm">{a.line1}</p>
            </div>
          ))}
        </div>
      </div>
      <form className="card space-y-3 p-5" onSubmit={submit}>
        <input className="input" placeholder="Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="input" placeholder="09..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className="input" value={form.provinceId} onChange={(e) => setForm({ ...form, provinceId: e.target.value, cityId: "" })}>
          <option value="">Province</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {locale === "fa" ? p.nameFa : p.nameEn}
            </option>
          ))}
        </select>
        <select className="input" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
          <option value="">City</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {locale === "fa" ? c.nameFa : c.nameEn}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
        <MotionButton className="btn btn-primary">Save</MotionButton>
      </form>
    </div>
  );
}
