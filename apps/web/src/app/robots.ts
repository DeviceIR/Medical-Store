import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
