import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { serverApi } from "@/lib/utils";
import { PageHeader, Stagger, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

type Post = { slug: string; coverUrl?: string | null; translations: { title: string; excerpt: string }[] };

export const metadata = {
  title: "Guides",
};

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("guides");
  const posts = await serverApi<Post[]>(`/blog?locale=${locale}`).catch(() => [] as Post[]);
  return (
    <div className="container-page py-10">
      <PageHeader title={t("title")} body={t("body")} />
      <Stagger className="grid gap-5 md:grid-cols-2">
        {posts.map((p) => (
          <StaggerItem key={p.slug}>
            <Link href={`/guides/${p.slug}`} className="card block overflow-hidden">
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt="" className="h-48 w-full object-cover" />
              ) : null}
              <div className="p-5">
                <h2 className="text-xl font-bold">{p.translations[0]?.title}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{p.translations[0]?.excerpt}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
