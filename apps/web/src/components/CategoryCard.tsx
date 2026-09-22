"use client";

import { Link } from "@/i18n/navigation";
import { tDesc, tName } from "@/lib/utils";
import { CategoryIcon, categoryTone } from "./CategoryIcon";
import { Tilt3D } from "./Tilt3D";

export type HomeCategory = {
  slug: string;
  translations: { locale: string; name: string; description?: string }[];
  _count?: { products: number };
  children?: HomeCategory[];
};

export function categoryCount(cat: HomeCategory): number {
  return (cat._count?.products ?? 0) + (cat.children?.reduce((sum, child) => sum + (child._count?.products ?? 0), 0) ?? 0);
}

export function CategoryCard({
  category,
  locale,
  compact = false,
}: {
  category: HomeCategory;
  locale: string;
  compact?: boolean;
}) {
  const count = categoryCount(category);
  const name = tName(category.translations, locale);
  const desc = tDesc(category.translations, locale);

  return (
    <Tilt3D className="h-full">
      <Link href={`/catalog/${category.slug}`} className="card card-shine group flex h-full flex-col overflow-hidden p-0">
        <div className={`flex items-center gap-3 bg-gradient-to-br p-4 text-white ${categoryTone(category.slug)} ${compact ? "" : "min-h-[92px]"}`}>
          <span className="icon-3d">
            <CategoryIcon slug={category.slug} className="size-6" />
          </span>
          <div>
            <h3 className="font-bold leading-snug">{name}</h3>
            <p className="text-xs text-white/80">
              {count} {locale === "fa" ? "کالا" : "items"}
            </p>
          </div>
        </div>
        {!compact && desc ? <p className="flex-1 p-4 text-sm text-[var(--muted)]">{desc}</p> : <div className="p-3" />}
      </Link>
    </Tilt3D>
  );
}
