import { notFound } from "next/navigation";
import { serverApi } from "@/lib/utils";
import { PageHeader, Reveal } from "@/components/motion";

export const dynamic = "force-dynamic";

type Post = {
  slug: string;
  coverUrl?: string | null;
  translations: { locale: string; title: string; body: string; excerpt: string }[];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const post = await serverApi<Post>(`/blog/${slug}`).catch(() => null);
  const tr = post?.translations.find((x) => x.locale === locale) ?? post?.translations[0];
  return { title: tr?.title, description: tr?.excerpt };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const post = await serverApi<Post>(`/blog/${slug}`).catch(() => null);
  if (!post) notFound();
  const tr = post.translations.find((x) => x.locale === locale) ?? post.translations[0];
  return (
    <article className="container-page max-w-3xl py-10">
      {post.coverUrl ? (
        <Reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverUrl} alt="" className="mb-6 w-full rounded-[24px] object-cover" />
        </Reveal>
      ) : null}
      <PageHeader title={tr.title} body={tr.excerpt} />
      <Reveal delay={0.1}>
        <p className="whitespace-pre-wrap text-lg leading-8">{tr.body}</p>
      </Reveal>
    </article>
  );
}
