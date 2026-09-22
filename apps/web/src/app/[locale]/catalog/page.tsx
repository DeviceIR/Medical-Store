import { getTranslations } from "next-intl/server";
import { ProductCard, ProductCardData } from "@/components/ProductCard";
import { PageHeader, Stagger, StaggerItem } from "@/components/motion";
import { serverApi, tName } from "@/lib/utils";
import { MotionLink } from "@/components/Button";

export const dynamic = "force-dynamic";

type ListResponse = { items: ProductCardData[]; total: number };
type Category = {
  slug: string;
  translations: { locale: string; name: string }[];
  children?: { slug: string; translations: { locale: string; name: string }[] }[];
};

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category?: string }>;
  searchParams: Promise<{ q?: string; tag?: string; sort?: string; page?: string }>;
}) {
  const { category, locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("catalog");
  const qs = new URLSearchParams({
    locale,
    ...(category ? { category } : {}),
    ...(sp.q ? { q: sp.q } : {}),
    ...(sp.tag ? { tag: sp.tag } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
    ...(sp.page ? { page: sp.page } : {}),
  });
  const [data, categories] = await Promise.all([
    serverApi<ListResponse>(`/catalog/products?${qs}`).catch(() => ({ items: [], total: 0 })),
    serverApi<Category[]>(`/catalog/categories?locale=${locale}`).catch(() => [] as Category[]),
  ]);

  const activeParent = categories.find(
    (c) => c.slug === category || c.children?.some((child) => child.slug === category),
  );
  const chips = activeParent ? [activeParent, ...(activeParent.children ?? [])] : categories;
  const heading = category
    ? tName(chips.find((c) => c.slug === category)?.translations, locale) || t("title")
    : t("title");

  return (
    <div className="container-page py-10">
      <PageHeader
        kicker={t("title")}
        title={heading}
        body={sp.q ? `${t("results")} «${sp.q}»` : t("body")}
      />
      <div className="flex flex-wrap gap-2">
        <MotionLink href="/catalog" className={`btn ${category ? "btn-ghost" : "btn-primary"}`}>
          {t("all")}
        </MotionLink>
        {chips.map((c) => (
          <MotionLink key={c.slug} href={`/catalog/${c.slug}`} className={`btn ${category === c.slug ? "btn-primary" : "btn-ghost"}`}>
            {tName(c.translations, locale)}
          </MotionLink>
        ))}
      </div>
      {data.items.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="text-[var(--muted)]">{t("empty")}</p>
          <MotionLink href="/catalog" className="btn btn-primary mt-4">
            {t("all")}
          </MotionLink>
        </div>
      ) : (
        <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <StaggerItem key={p.slug}>
              <ProductCard product={p} locale={locale} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
