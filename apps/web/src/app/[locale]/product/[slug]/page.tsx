import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard, ProductCardData } from "@/components/ProductCard";
import { ProductThumb } from "@/components/ProductThumb";
import { PageHeader, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Tilt3D } from "@/components/Tilt3D";
import { formatMoney, serverApi, tDesc, tName } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Product = ProductCardData & {
  id: string;
  slug: string;
  certifications: string[];
  datasheetUrl?: string | null;
  translations: { locale: string; name: string; description?: string; specs?: Record<string, string> }[];
  variants: {
    id: string;
    sku: string;
    titleFa: string;
    titleEn: string;
    priceIrr: number;
    priceUsd: number;
    priceEur: number;
    stock: number;
  }[];
  images: { url: string; altFa?: string; altEn?: string }[];
  relatedFrom: { to: ProductCardData }[];
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = await serverApi<Product>(`/catalog/products/${slug}`).catch(() => null);
  if (!product) return {};
  return {
    title: tName(product.translations, locale),
    description: tDesc(product.translations, locale),
    alternates: {
      languages: {
        fa: `/fa/product/${slug}`,
        en: `/en/product/${slug}`,
      },
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations("product");
  const product = await serverApi<Product>(`/catalog/products/${slug}`).catch(() => null);
  if (!product) notFound();
  const variant = product.variants[0];
  const currency = locale === "fa" ? "IRR" : "USD";
  const amount = locale === "fa" ? variant?.priceIrr ?? 0 : variant?.priceUsd ?? 0;
  const name = tName(product.translations, locale);
  const inStock = (variant?.stock ?? 0) > 0;

  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
      <Reveal>
        <Tilt3D>
          <div className="card group overflow-hidden">
            <ProductThumb src={product.images[0]?.url} alt={name} slug={product.category?.slug ?? product.slug} className="aspect-[4/3]" />
          </div>
        </Tilt3D>
      </Reveal>
      <div>
        <PageHeader title={name} body={tDesc(product.translations, locale) || undefined} />
        <Reveal delay={0.1}>
          <p className="text-3xl font-bold text-[var(--teal)]">{formatMoney(amount, currency, locale)}</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {t("sku")}: {variant?.sku} · {t("stock")}: {variant?.stock}{" "}
            <span className={inStock ? "text-[var(--teal)]" : "text-[var(--danger)]"}>
              {inStock ? (locale === "fa" ? "موجود" : "In stock") : locale === "fa" ? "ناموجود" : "Out of stock"}
            </span>
          </p>
          {product.certifications.length ? (
            <p className="mt-2 text-sm">
              {t("certs")}: {product.certifications.join(" · ")}
            </p>
          ) : null}
        </Reveal>
        {variant ? <ProductActions productId={product.id} variantId={variant.id} /> : null}
      </div>
      {product.relatedFrom?.length ? (
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">{t("related")}</h2>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {product.relatedFrom.map((rel) => (
              <StaggerItem key={rel.to.slug}>
                <ProductCard product={rel.to} locale={locale} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      ) : null}
    </div>
  );
}
