"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { api, formatMoney } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

type Wallet = {
  balanceIrr: number;
  balanceUsd: number;
  balanceEur: number;
  transactions: { id: string; type: string; amount: number; currency: "IRR" | "USD" | "EUR"; description?: string; createdAt: string }[];
};

export default function WalletClient() {
  const locale = useLocale();
  const sp = useSearchParams();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState(100000);
  const [provider, setProvider] = useState<"ZARINPAL" | "STRIPE">("ZARINPAL");

  async function load() {
    setWallet(await api<Wallet>("/wallet"));
  }

  useEffect(() => {
    const authority = sp.get("Authority");
    const amt = Number(sp.get("amount") ?? 0);
    const cur = (sp.get("currency") as "IRR" | "USD" | "EUR") ?? "IRR";
    const prov = (sp.get("provider") as "ZARINPAL" | "STRIPE") ?? "ZARINPAL";
    if (authority && amt) {
      api("/wallet/top-up/confirm", {
        method: "POST",
        body: JSON.stringify({ authority, amount: amt, currency: cur, provider: prov }),
      })
        .then(() => load())
        .catch(() => load());
    } else {
      load().catch(() => undefined);
    }
  }, [sp]);

  async function topUp(e: FormEvent) {
    e.preventDefault();
    const currency = locale === "fa" ? "IRR" : "USD";
    const res = await api<{ redirectUrl: string }>("/wallet/top-up", {
      method: "POST",
      body: JSON.stringify({ amount, currency, provider }),
    });
    const url = new URL(res.redirectUrl);
    url.searchParams.set("amount", String(amount));
    url.searchParams.set("currency", currency);
    url.searchParams.set("provider", provider);
    window.location.href = url.toString();
  }

  if (!wallet) return <div className="container-page py-10">...</div>;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Wallet</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5">IRR {formatMoney(wallet.balanceIrr, "IRR", locale)}</div>
        <div className="card p-5">{formatMoney(wallet.balanceUsd, "USD", locale)}</div>
        <div className="card p-5">{formatMoney(wallet.balanceEur, "EUR", locale)}</div>
      </div>
      <form className="card mt-6 max-w-md space-y-3 p-5" onSubmit={topUp}>
        <input className="input" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as "ZARINPAL" | "STRIPE")}>
          <option value="ZARINPAL">Zarinpal</option>
          <option value="STRIPE">Stripe</option>
        </select>
        <MotionButton className="btn btn-primary w-full">Top up</MotionButton>
      </form>
      <ul className="mt-6 space-y-2 text-sm">
        {wallet.transactions.map((tx) => (
          <li key={tx.id} className="card p-3">
            {tx.type} {formatMoney(tx.amount, tx.currency, locale)} — {tx.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
