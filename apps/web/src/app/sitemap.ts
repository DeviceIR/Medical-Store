import { MetadataRoute } from "next";

const site = process.env.WEB_ORIGIN ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/catalog", "/guides", "/cart"];
  const locales = ["fa", "en"];
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${site}/${locale}${path}`,
      alternates: {
        languages: {
          fa: `${site}/fa${path}`,
          en: `${site}/en${path}`,
        },
      },
    })),
  );
}
