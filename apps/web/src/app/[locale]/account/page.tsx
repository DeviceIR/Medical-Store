"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Heart, LogOut, MapPin, Package, Shield, Wallet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { HoverLift, PageHeader, Stagger, StaggerItem } from "@/components/motion";
import { MotionButton } from "@/components/Button";

export default function AccountPage() {
  const t = useTranslations("account");
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="container-page py-10">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-[var(--line)]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const title = user.name || t("profile");
  const subtitle = [user.phone, user.email].filter(Boolean).join(" · ");
  const links = [
    { href: "/account/orders", label: t("orders"), icon: Package },
    { href: "/account/addresses", label: t("addresses"), icon: MapPin },
    { href: "/account/wishlist", label: t("wishlist"), icon: Heart },
    { href: "/account/wallet", label: t("wallet"), icon: Wallet },
    ...(user.role === "ADMIN" || user.role === "STAFF"
      ? [{ href: "/admin", label: t("admin"), icon: Shield }]
      : []),
  ];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader kicker={t("welcome")} title={title} body={subtitle || undefined} />
        <MotionButton
          className="btn btn-ghost"
          onClick={async () => {
            await logout();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          {t("logout")}
        </MotionButton>
      </div>
      <Stagger className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, label, icon: Icon }) => (
          <StaggerItem key={href}>
            <HoverLift>
              <Link href={href} className="card flex items-center gap-3 p-5 font-semibold">
                <span className="grid size-10 place-items-center rounded-2xl bg-[var(--teal-soft)] text-[var(--teal)]">
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
