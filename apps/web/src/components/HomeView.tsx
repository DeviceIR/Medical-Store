"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Award, FileText, MapPin, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ProductCard, ProductCardData } from "@/components/ProductCard";
import { CategoryCard, HomeCategory } from "@/components/CategoryCard";
import { Reveal, RevealText, Stagger, StaggerItem } from "@/components/motion";
import { HeroScene } from "@/components/HeroScene";
import { Tilt3D } from "@/components/Tilt3D";
import { MotionLink } from "@/components/Button";
import { tName } from "@/lib/utils";

type Guide = { slug: string; translations: { title: string; excerpt: string }[] };

export function HomeView({
  locale,
  categories,
  featured,
  guides,
  catalogTotal,
}: {
  locale: string;
  categories: HomeCategory[];
  featured: ProductCardData[];
  guides: Guide[];
  catalogTotal: number;
}) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const subcategories = categories.flatMap((c) => c.children ?? []);
  const certs = t("home.certsLine");

  return (
    <div>
      <section className="hero-shell relative -mt-[5.5rem] overflow-hidden pt-[5.5rem] text-white">
        <motion.div
          className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-teal-500/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, 24, 0], y: [0, -16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-white/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, -18, 0], y: [0, 14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="container-page relative grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div>
            <Reveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">{t("home.trust")}</p>
            </Reveal>
            <RevealText text={t("home.heroTitle")} className="max-w-xl text-4xl font-extrabold leading-[1.25] md:text-5xl" />
            <Reveal delay={0.18}>
              <p className="mt-4 max-w-lg text-base text-white/75 md:text-lg">{t("home.heroBody")}</p>
            </Reveal>
            <Reveal delay={0.28}>
              <div className="mt-8 flex flex-wrap gap-3">
                <MotionLink href="/catalog" className="btn bg-white text-[var(--navy)]">
                  {t("home.cta")}
                </MotionLink>
                <MotionLink href="/guides" className="btn border border-white/30 bg-white/5 text-white">
                  {t("home.ctaSecondary")}
                </MotionLink>
              </div>
            </Reveal>
          </div>
          <HeroScene
            labels={{
              surgical: t("home.sceneSurgical"),
              diagnostic: t("home.sceneDiagnostic"),
              laboratory: t("home.sceneLab"),
              imaging: t("home.sceneImaging"),
            }}
            stats={[
              { value: String(categories.length), label: t("home.statCategories") },
              { value: String(catalogTotal), label: t("home.statProducts") },
              { value: "CE / ISO", label: t("home.statCerts") },
              { value: t("home.statShippingValue"), label: t("home.statShipping") },
            ]}
          />
        </div>
        <div className="certs-marquee" dir="ltr">
          <div className="certs-track">
            <span>{certs}</span>
            <span aria-hidden>{certs}</span>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-white">
        <Stagger className="container-page grid gap-6 py-6 [perspective:800px] sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, "home.why1", "home.why1Body"],
            [Award, "home.why2", "home.why2Body"],
            [MapPin, "home.why3", "home.why3Body"],
            [FileText, "home.why4", "home.why4Body"],
          ].map(([Icon, title, body]) => (
            <StaggerItem key={title}>
              <div className="flex gap-3">
                <span className="why-icon">
                  <Icon className="size-5 text-[var(--teal)]" />
                </span>
                <div>
                  <p className="font-semibold">{t(title as string)}</p>
                  <p className="text-sm text-[var(--muted)]">{t(body as string)}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="container-page py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <RevealText as="h2" text={t("home.categories")} className="text-2xl font-extrabold md:text-3xl" />
            <Reveal delay={0.08}>
              <p className="mt-2 text-[var(--muted)]">{t("home.categoriesBody")}</p>
            </Reveal>
          </div>
          <Reveal>
            <MotionLink href="/catalog" className="btn btn-ghost">
              {t("home.viewAll")}
            </MotionLink>
          </Reveal>
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c) => (
            <StaggerItem key={c.slug}>
              <CategoryCard category={c} locale={locale} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {subcategories.length ? (
        <section className="bg-white py-14">
          <div className="container-page">
            <RevealText as="h2" text={t("home.subcategories")} className="mb-6 text-2xl font-extrabold" />
            <Stagger className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" delay={0.05}>
              {subcategories.map((c) => (
                <StaggerItem key={c.slug}>
                  <CategoryCard category={c} locale={locale} compact />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <section className="container-page py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <RevealText as="h2" text={t("home.featured")} className="text-2xl font-extrabold md:text-3xl" />
          <Reveal>
            <MotionLink href="/catalog" className="btn btn-ghost">
              {t("home.viewAll")}
            </MotionLink>
          </Reveal>
        </div>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <StaggerItem key={p.slug}>
              <ProductCard product={p} locale={locale} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {guides.length ? (
        <section className="bg-white py-14">
          <div className="container-page">
            <div className="mb-8 flex items-end justify-between">
              <RevealText as="h2" text={t("guides.title")} className="text-2xl font-extrabold" />
              <Reveal>
                <MotionLink href="/guides" className="btn btn-ghost">
                  {t("home.viewAll")}
                </MotionLink>
              </Reveal>
            </div>
            <Stagger className="grid gap-5 md:grid-cols-2">
              {guides.slice(0, 2).map((g) => (
                <StaggerItem key={g.slug}>
                  <Tilt3D className="h-full">
                    <Link href={`/guides/${g.slug}`} className="card card-shine block h-full p-6">
                      <h3 className="text-xl font-bold">{g.translations[0]?.title ?? tName(g.translations as never, locale)}</h3>
                      <p className="mt-2 text-sm text-[var(--muted)]">{g.translations[0]?.excerpt}</p>
                    </Link>
                  </Tilt3D>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <p className="container-page pb-10 text-center text-xs text-[var(--muted)]">{t("disclaimer")}</p>
    </div>
  );
}
