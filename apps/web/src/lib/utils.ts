import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE =
  typeof window === "undefined"
    ? `${process.env.API_PROXY ?? "http://localhost:4000"}/api/v1`
    : process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message || code);
    this.name = "ApiError";
  }
}

const SKIP_REFRESH = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/otp/request",
  "/auth/otp/verify",
  "/auth/refresh",
  "/auth/logout",
]);

let refreshInFlight: Promise<boolean> | null = null;

function errorCodeFromBody(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  return fallback;
}

async function rawFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function tryRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch("/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  let res = await rawFetch(path, init);
  if (res.status === 401 && !SKIP_REFRESH.has(path)) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await rawFetch(path, init);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, errorCodeFromBody(data, res.statusText));
  }
  return data as T;
}

export async function serverApi<T>(path: string, cookieHeader?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export function formatMoney(amount: number, currency: "IRR" | "USD" | "EUR", locale: string) {
  if (currency === "IRR") {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(amount) + (locale === "fa" ? " تومان" : " IRR");
  }
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function tName(
  translations: { locale: string; name: string }[] | undefined,
  locale: string,
) {
  return translations?.find((t) => t.locale === locale)?.name ?? translations?.[0]?.name ?? "";
}

export function tDesc(
  translations: { locale: string; description?: string }[] | undefined,
  locale: string,
) {
  return translations?.find((t) => t.locale === locale)?.description ?? translations?.[0]?.description ?? "";
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/account";
  }
  return value;
}

export const CART_EVENT = "cart-changed";

export function notifyCartChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_EVENT));
}
