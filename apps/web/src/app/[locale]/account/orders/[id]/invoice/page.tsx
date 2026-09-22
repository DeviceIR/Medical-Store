"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { api, formatMoney } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type Invoice = {
  number: string;
  createdAt: string;
  total: number;
  currency: "IRR" | "USD" | "EUR";
  guestName?: string;
  items: { title: string; sku: string; quantity: number; unitPrice: number; totalPrice: number }[];
};

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const locale = useLocale();
  const [order, setOrder] = useState<Invoice | null>(null);

  useEffect(() => {
    params.then(({ id }) => api<Invoice>(`/orders/${id}/invoice`).then(setOrder));
  }, [params]);

  if (!order) return null;

  return (
    <div className="container-page py-10 print:py-0">
      <div className="card p-8">
        <div className="flex justify-between">
          <h1 className="text-2xl font-extrabold">Medical Store</h1>
          <MotionButton className="btn btn-ghost print:hidden" onClick={() => window.print()}>
            Print
          </MotionButton>
        </div>
        <p className="mt-2">
          {order.number} · {new Date(order.createdAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-GB")}
        </p>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-start">
              <th className="py-2">Item</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.sku} className="border-b border-[var(--line)]">
                <td className="py-2">{item.title}</td>
                <td>{item.sku}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.totalPrice, order.currency, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-xl font-bold">{formatMoney(order.total, order.currency, locale)}</p>
        <p className="mt-8 text-xs text-[var(--muted)]">
          تجهیزات پزشکی — جایگزین مشاوره پزشک نیست / Medical devices — not a substitute for medical advice.
        </p>
      </div>
    </div>
  );
}
