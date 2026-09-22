"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { api, notifyCartChanged } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

export function ProductActions({ productId, variantId }: { productId: string; variantId: string }) {
  const t = useTranslations("product");
  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState<"ok" | "err">("ok");

  async function add() {
    try {
      await api("/cart/items", { method: "POST", body: JSON.stringify({ variantId, quantity: 1 }) });
      notifyCartChanged();
      setKind("ok");
      setMsg(t("added"));
    } catch (err) {
      setKind("err");
      setMsg((err as Error).message);
    }
  }

  async function wish() {
    try {
      await api("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
      setKind("ok");
      setMsg(t("wishAdded"));
    } catch {
      setKind("err");
      setMsg(t("loginForWish"));
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <MotionButton className="btn btn-primary" onClick={add}>
          <ShoppingBag className="size-4" />
          {t("add")}
        </MotionButton>
        <MotionButton className="btn btn-ghost" onClick={wish}>
          <Heart className="size-4" />
          {t("wishlist")}
        </MotionButton>
      </div>
      <AnimatePresence>
        {msg ? (
          <motion.p
            key={msg}
            className={`text-sm ${kind === "ok" ? "text-[var(--teal)]" : "text-[var(--danger)]"}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {msg}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
