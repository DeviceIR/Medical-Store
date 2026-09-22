"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard, ProductCardData } from "@/components/ProductCard";
import { api } from "@/lib/utils";
import { PageHeader, Stagger, StaggerItem } from "@/components/motion";

export default function WishlistPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [items, setItems] = useState<{ product: ProductCardData }[] | null>(null);
  useEffect(() => {
    api<{ product: ProductCardData }[]>("/wishlist")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  return (
    <div className="container-page py-10">
      <PageHeader title={t("wishlist")} />
      {items === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <StaggerItem key={i.product.slug}>
              <ProductCard product={i.product} locale={locale} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
