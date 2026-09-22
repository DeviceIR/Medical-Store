"use client";

import { Link } from "@/i18n/navigation";
import { formatMoney, tName } from "@/lib/utils";
import { ProductThumb } from "./ProductThumb";
import { Tilt3D } from "./Tilt3D";

export type ProductCardData = {
  slug: string;
  translations: { locale: string; name: string }[];
  images: { url: string }[];
  variants: { priceIrr: number; priceUsd: number; priceEur: number; stock: number }[];
  category?: { slug?: string };
  brand?: { name?: string };
};

export function ProductCard({
  product,
  locale,
}: {
  product: ProductCardData;
  locale: string;
}) {
  const price = product.variants[0];
  const currency = locale === "fa" ? "IRR" : "USD";
  const amount = locale === "fa" ? price?.priceIrr ?? 0 : price?.priceUsd ?? 0;
  const name = tName(product.translations, locale);
  const inStock = (price?.stock ?? 0) > 0;

  return (
    <Tilt3D className="h-full">
      <Link href={`/product/${product.slug}`} className="card card-shine group block h-full overflow-hidden">
        <ProductThumb src={product.images[0]?.url} alt={name} slug={product.category?.slug ?? product.slug} />
        <div className="space-y-2 p-4">
          {product.brand?.name ? <p className="text-xs text-[var(--muted)]">{product.brand.name}</p> : null}
          <h3 className="font-semibold leading-snug group-hover:text-[var(--teal)]">{name}</h3>
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-[var(--navy)]">{formatMoney(amount, currency, locale)}</p>
            <span className={`text-xs ${inStock ? "text-[var(--teal)]" : "text-[var(--danger)]"}`}>
              {inStock ? (locale === "fa" ? "موجود" : "In stock") : locale === "fa" ? "ناموجود" : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>
    </Tilt3D>
  );
}
