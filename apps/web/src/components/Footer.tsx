"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Plus3D } from "@/components/Plus3D";

const FOOTER_CATS = [
  ["surgical", "تجهیزات جراحی", "Surgical"],
  ["diagnostic", "تشخیصی", "Diagnostic"],
  ["laboratory", "آزمایشگاه", "Laboratory"],
  ["dental", "دندان‌پزشکی", "Dental"],
  ["hospital", "بیمارستانی", "Hospital"],
  ["sterilization", "استریل", "Sterilization"],
] as const;

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <footer className="mt-8 border-t border-[var(--line)] bg-[var(--navy-deep)] text-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <Reveal className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Plus3D size="sm" />
            <p className="text-xl font-extrabold">{t("brand")}</p>
          </div>
          <p className="mt-2 max-w-sm text-sm text-white/70">{t("tagline")}</p>
          <p className="mt-4 max-w-md text-xs leading-6 text-white/55">{t("disclaimer")}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="font-semibold">{t("nav.catalog")}</p>
          <Stagger className="mt-3 space-y-2 text-sm text-white/75" delay={0.05}>
            {FOOTER_CATS.map(([slug, fa, en]) => (
              <StaggerItem key={slug}>
                <Link href={`/catalog/${slug}`} className="hover:text-white">
                  {locale === "en" ? en : fa}
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
        <Reveal delay={0.14} className="text-sm text-white/80">
          <p className="font-semibold">{t("footer.contact")}</p>
          <p className="mt-2" dir="ltr">
            021-9100-0000
          </p>
          <p>support@medical.local</p>
          <Link href="/guides" className="mt-3 inline-block text-white/75 hover:text-white">
            {t("nav.guides")}
          </Link>
        </Reveal>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">{t("footer.rights")}</div>
    </footer>
  );
}
