import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { headers } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
  const headerList = await headers();
  const path =
    headerList.get("x-matched-path") ||
    headerList.get("next-url") ||
    headerList.get("x-invoke-path") ||
    headerList.get("x-pathname") ||
    "";
  const fromPath = path.match(/\/(fa|en)(?:\/|$)/)?.[1];
  let locale = fromPath || (await requestLocale);
  if (!locale || !routing.locales.includes(locale as "fa" | "en")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
