import { IRAN_PHONE_REGEX } from "./constants";

export function toAsciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function normalizeIranPhone(input: string): string {
  let digits = toAsciiDigits(input).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) digits = `0${digits}`;
  return digits;
}

export function isIranMobile(input: string) {
  return IRAN_PHONE_REGEX.test(normalizeIranPhone(input));
}

export function looksLikeEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function normalizeOtpCode(input: string) {
  return toAsciiDigits(input).replace(/\D/g, "");
}
