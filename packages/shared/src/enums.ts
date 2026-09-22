export const LOCALES = ["fa", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fa";

export const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const CURRENCIES = ["IRR", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["ZARINPAL", "STRIPE", "WALLET"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const MEDICAL_TAGS = [
  "surgical",
  "diagnostic",
  "consumable",
  "hospital",
] as const;
export type MedicalTag = (typeof MEDICAL_TAGS)[number];

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const WALLET_TX_TYPES = ["CREDIT", "DEBIT", "REFUND"] as const;
export type WalletTxType = (typeof WALLET_TX_TYPES)[number];
