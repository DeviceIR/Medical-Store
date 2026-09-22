"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CART_EVENT, api } from "@/lib/utils";
import { easeOut } from "@/components/motion";
import { Plus3D } from "@/components/Plus3D";
import { MotionButton, MotionLink } from "@/components/Button";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const other = locale === "fa" ? "en" : "fa";
  const accountLabel = user ? user.name || user.phone || t("nav.account") : t("nav.login");
  const shopActive = pathname === "/catalog" || pathname.startsWith("/catalog/");
  const guidesActive = pathname === "/guides" || pathname.startsWith("/guides/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function loadCart() {
      try {
        const cart = await api<{ items: { quantity: number }[] }>("/cart");
        setCartCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        setCartCount(0);
      }
    }
    loadCart();
    window.addEventListener(CART_EVENT, loadCart);
    return () => window.removeEventListener(CART_EVENT, loadCart);
  }, [pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="container-page py-3">
        <motion.div
          className={`site-header-bar ${scrolled ? "is-scrolled" : ""}`}
          initial={reduce ? false : { y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <div className="flex items-center gap-2 px-3 py-2 md:gap-3 md:px-4">
            <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-[var(--navy)]">
              <span className="grid h-10 w-10 place-items-center">
                <Plus3D size="sm" />
              </span>
              <motion.span
                className="hidden sm:inline"
                initial={reduce ? false : { opacity: 0, x: locale === "fa" ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: easeOut }}
              >
                {t("brand")}
              </motion.span>
            </Link>
            <nav className="hidden items-center text-sm font-medium md:flex">
              <Link href="/catalog" className="nav-link" data-active={shopActive}>
                {t("nav.catalog")}
              </Link>
              <Link href="/guides" className="nav-link" data-active={guidesActive}>
                {t("nav.guides")}
              </Link>
            </nav>
            <form onSubmit={onSearch} className="mx-1 hidden min-w-0 flex-1 md:flex">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 opacity-50 ltr:left-3 rtl:right-3" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="header-search ltr:pl-9 rtl:pr-9"
                  placeholder={t("nav.search")}
                />
              </div>
            </form>
            <div className="ms-auto flex shrink-0 items-center gap-1.5">
              <MotionButton
                className="btn btn-ghost px-3 py-2 text-xs uppercase"
                onClick={() => router.replace(pathname, { locale: other })}
              >
                {other}
              </MotionButton>
              <MotionLink href="/cart" className="btn btn-ghost header-cart px-3 py-2" aria-label={t("nav.cart")}>
                <ShoppingBag className="size-4" />
                <span className="hidden sm:inline">{t("nav.cart")}</span>
                <AnimatePresence>
                  {cartCount > 0 ? (
                    <motion.span
                      key={cartCount}
                      className="header-cart-count"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                    >
                      {cartCount}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </MotionLink>
              {user?.role === "ADMIN" || user?.role === "STAFF" ? (
                <MotionLink href="/admin" className="btn btn-ghost hidden px-3 py-2 sm:inline-flex">
                  {t("nav.admin")}
                </MotionLink>
              ) : null}
              <MotionLink href={user ? "/account" : "/login"} className="btn btn-primary px-3 py-2">
                <UserRound className="size-4" />
                <span className="max-w-[7rem] truncate sm:max-w-[9rem]">{accountLabel}</span>
              </MotionLink>
              <MotionButton
                type="button"
                className="grid size-10 place-items-center rounded-full border border-white/40 md:hidden"
                aria-label={open ? t("nav.close") : t("nav.menu")}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </MotionButton>
            </div>
          </div>
        </motion.div>
        <AnimatePresence>
          {open ? (
            <motion.div
              className="site-header-menu md:hidden"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              <div className="space-y-3 px-4 py-4">
                <form onSubmit={onSearch}>
                  <input className="header-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nav.search")} />
                </form>
                <Link href="/catalog" className="nav-link block font-semibold" onClick={() => setOpen(false)}>
                  {t("nav.catalog")}
                </Link>
                <Link href="/guides" className="nav-link block font-semibold" onClick={() => setOpen(false)}>
                  {t("nav.guides")}
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
