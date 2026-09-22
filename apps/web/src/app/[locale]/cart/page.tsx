"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { api, formatMoney, notifyCartChanged, tName } from "@/lib/utils";
import { PageHeader, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ProductThumb } from "@/components/ProductThumb";
import { Plus3D } from "@/components/Plus3D";
import { MotionButton, MotionLink } from "@/components/Button";

type Cart = {
  currency: "IRR" | "USD" | "EUR";
  coupon?: { code: string } | null;
  items: {
    id: string;
    quantity: number;
    variant: {
      priceIrr: number;
      priceUsd: number;
      priceEur: number;
      product: { slug: string; translations: { locale: string; name: string }[]; images: { url: string }[]; category?: { slug?: string } };
    };
  }[];
};

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const [cart, setCart] = useState<Cart | null>(null);
  const [code, setCode] = useState("");

  async function load() {
    const next = await api<Cart>("/cart");
    setCart(next);
    notifyCartChanged();
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  if (!cart) {
    return (
      <div className="container-page py-10">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-[var(--line)]" />
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  const currency = locale === "fa" ? "IRR" : cart.currency === "IRR" ? "USD" : cart.currency;
  const subtotal = cart.items.reduce((sum, item) => {
    const unit = currency === "USD" ? item.variant.priceUsd : currency === "EUR" ? item.variant.priceEur : item.variant.priceIrr;
    return sum + unit * item.quantity;
  }, 0);

  async function update(id: string, quantity: number) {
    setCart(await api<Cart>(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }));
    notifyCartChanged();
  }

  return (
    <div className="container-page py-10">
      <PageHeader title={t("title")} body={cart.items.length ? t("body") : undefined} />
      {!cart.items.length ? (
        <Reveal>
          <div className="card p-10 text-center">
            <div className="mx-auto mb-5 w-fit">
              <Plus3D size="md" />
            </div>
            <p className="text-[var(--muted)]">{t("empty")}</p>
            <MotionLink href="/catalog" className="btn btn-primary mt-5">
              {t("continue")}
            </MotionLink>
          </div>
        </Reveal>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <Stagger className="space-y-4">
            <AnimatePresence>
              {cart.items.map((item) => {
                const unit =
                  currency === "USD"
                    ? item.variant.priceUsd
                    : currency === "EUR"
                      ? item.variant.priceEur
                      : item.variant.priceIrr;
                const name = tName(item.variant.product.translations, locale);
                return (
                  <StaggerItem key={item.id}>
                    <motion.div layout className="card flex gap-4 p-4">
                      <div className="h-24 w-24 overflow-hidden rounded-xl">
                        <ProductThumb
                          src={item.variant.product.images[0]?.url}
                          alt={name}
                          slug={item.variant.product.category?.slug ?? item.variant.product.slug}
                          className="h-24 w-24"
                          compact
                        />
                      </div>
                      <div className="flex-1">
                        <Link href={`/product/${item.variant.product.slug}`} className="font-semibold">
                          {name}
                        </Link>
                        <p className="text-sm text-[var(--teal)]">{formatMoney(unit * item.quantity, currency, locale)}</p>
                        <div className="mt-2 flex gap-2">
                          <MotionButton className="btn btn-ghost px-3 py-1" onClick={() => update(item.id, item.quantity - 1)}>
                            -
                          </MotionButton>
                          <span className="self-center min-w-6 text-center">{item.quantity}</span>
                          <MotionButton className="btn btn-ghost px-3 py-1" onClick={() => update(item.id, item.quantity + 1)}>
                            +
                          </MotionButton>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </AnimatePresence>
          </Stagger>
          <Reveal delay={0.1}>
            <aside className="card h-fit space-y-3 p-5">
              <div className="flex items-center justify-between font-semibold">
                <span>{t("subtotal")}</span>
                <span>{formatMoney(subtotal, currency, locale)}</span>
              </div>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("coupon")} />
              <MotionButton
                className="btn btn-ghost w-full"
                onClick={async () => {
                  setCart(await api<Cart>("/cart/coupon", { method: "POST", body: JSON.stringify({ code }) }));
                }}
              >
                {t("apply")}
              </MotionButton>
              <MotionLink href="/checkout" className="btn btn-primary w-full">
                {t("checkout")}
              </MotionLink>
            </aside>
          </Reveal>
        </div>
      )}
    </div>
  );
}
