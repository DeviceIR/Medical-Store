"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { MotionLink } from "@/components/Button";

export default function AdminHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<{ orders: number; revenueIrr: number; products: number; users: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      router.push("/");
      return;
    }
    api<{ orders: number; revenueIrr: number; products: number; users: number }>("/admin/stats")
      .then(setStats)
      .catch(() => undefined);
  }, [router, user, loading]);

  if (!stats) return <div className="container-page py-10">...</div>;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Admin</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="card p-5">
            <p className="text-sm text-[var(--muted)]">{k}</p>
            <p className="text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <MotionLink className="btn btn-primary" href="/admin/products">
          Products
        </MotionLink>
        <MotionLink className="btn btn-ghost" href="/admin/orders">
          Orders
        </MotionLink>
        <MotionLink className="btn btn-ghost" href="/admin/users">
          Users
        </MotionLink>
        <MotionLink className="btn btn-ghost" href="/admin/coupons">
          Coupons
        </MotionLink>
        <MotionLink className="btn btn-ghost" href="/admin/shipping">
          Shipping
        </MotionLink>
        <MotionLink className="btn btn-ghost" href="/admin/blog">
          Guides
        </MotionLink>
      </div>
    </div>
  );
}
