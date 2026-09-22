"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type Product = { id: string; slug: string; translations: { locale: string; name: string }[]; variants: { sku: string; stock: number }[] };
type Category = { id: string; slug: string };

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({
    slug: "",
    categoryId: "",
    nameFa: "",
    nameEn: "",
    sku: "",
    priceIrr: 1000000,
    stock: 10,
  });

  async function load() {
    setItems(await api<Product[]>("/admin/products"));
    setCats(await api<Category[]>("/admin/categories"));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await api("/admin/products", {
      method: "POST",
      body: JSON.stringify({
        slug: form.slug,
        categoryId: form.categoryId,
        nameFa: form.nameFa,
        nameEn: form.nameEn,
        variants: [
          {
            sku: form.sku,
            titleFa: "استاندارد",
            titleEn: "Standard",
            priceIrr: form.priceIrr,
            priceUsd: Math.round(form.priceIrr / 65000),
            stock: form.stock,
          },
        ],
      }),
    });
    await load();
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-extrabold">Products</h1>
        <div className="mt-4 space-y-2">
          {items.map((p) => (
            <div key={p.id} className="card p-4 text-sm">
              {p.slug} · {p.translations.find((t) => t.locale === "fa")?.name} · {p.variants[0]?.stock}
            </div>
          ))}
        </div>
      </div>
      <form className="card space-y-3 p-5" onSubmit={submit}>
        <input className="input" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">category</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.slug}
            </option>
          ))}
        </select>
        <input className="input" placeholder="نام فارسی" value={form.nameFa} onChange={(e) => setForm({ ...form, nameFa: e.target.value })} />
        <input className="input" placeholder="English name" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        <input className="input" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input className="input" type="number" value={form.priceIrr} onChange={(e) => setForm({ ...form, priceIrr: Number(e.target.value) })} />
        <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <MotionButton className="btn btn-primary">Create</MotionButton>
      </form>
    </div>
  );
}
