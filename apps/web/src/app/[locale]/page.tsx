import { HomeView } from "@/components/HomeView";
import { ProductCardData } from "@/components/ProductCard";
import { HomeCategory } from "@/components/CategoryCard";
import { serverApi } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Guide = { slug: string; translations: { title: string; excerpt: string }[] };

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [categories, featured, guides, catalog] = await Promise.all([
    serverApi<HomeCategory[]>(`/catalog/categories?locale=${locale}`).catch(() => [] as HomeCategory[]),
    serverApi<ProductCardData[]>(`/catalog/featured?locale=${locale}`).catch(() => [] as ProductCardData[]),
    serverApi<Guide[]>(`/blog?locale=${locale}`).catch(() => [] as Guide[]),
    serverApi<{ total: number }>(`/catalog/products?locale=${locale}`).catch(() => ({ total: 0 })),
  ]);

  return (
    <HomeView
      locale={locale}
      categories={categories}
      featured={featured}
      guides={guides}
      catalogTotal={catalog.total}
    />
  );
}
