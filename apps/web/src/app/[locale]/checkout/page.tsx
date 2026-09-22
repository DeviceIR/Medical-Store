"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/utils";
import { PageHeader, Reveal } from "@/components/motion";
import { MotionButton } from "@/components/Button";

type Province = { id: string; nameFa: string; nameEn: string; cities: { id: string; nameFa: string; nameEn: string }[] };

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [provider, setProvider] = useState("ZARINPAL");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ guestName: "", guestPhone: "", guestEmail: "", notes: "" });

  useEffect(() => {
    api<Province[]>("/shipping/provinces").then(setProvinces).catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ redirectUrl: string }>("/checkout", {
        method: "POST",
        body: JSON.stringify({ ...form, provinceId, provider }),
      });
      window.location.href = res.redirectUrl;
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="container-page max-w-xl space-y-4 py-10">
      <PageHeader title={t("title")} body={t("guest")} />
      <Reveal>
        <div className="card space-y-4 p-6">
          <label className="field">
            <span>{t("name")}</span>
            <input className="input" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t("phone")}</span>
            <input className="input" dir="ltr" placeholder="09xxxxxxxxx" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} required />
          </label>
          <label className="field">
            <span>{t("email")}</span>
            <input className="input" dir="ltr" type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
          </label>
          <label className="field">
            <span>{t("province")}</span>
            <select className="input" value={provinceId} onChange={(e) => setProvinceId(e.target.value)} required>
              <option value="">{t("province")}</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === "fa" ? p.nameFa : p.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("pay")}</span>
            <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="ZARINPAL">{t("zarinpal")}</option>
              <option value="STRIPE">{t("stripe")}</option>
              <option value="WALLET">{t("wallet")}</option>
            </select>
          </label>
          <MotionButton className="btn btn-primary w-full" disabled={busy}>
            {t("pay")}
          </MotionButton>
        </div>
      </Reveal>
    </form>
  );
}
