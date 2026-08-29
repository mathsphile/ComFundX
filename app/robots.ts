import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated, wallet-bound areas are not indexable content.
      disallow: ["/api/", "/dashboard", "/supporter"],
    },
    sitemap: "https://crowdfundx.stellar.org/sitemap.xml",
  };
}
