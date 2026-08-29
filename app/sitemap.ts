import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://crowdfundx.stellar.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/campaigns`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/campaigns/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/dashboard`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/supporter`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const campaigns = await prisma.campaign.findMany({
      select: { slug: true, updatedAt: true },
    });
    return [
      ...staticRoutes,
      ...campaigns.map((c) => ({
        url: `${BASE}/campaigns/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
