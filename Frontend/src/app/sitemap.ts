import type { MetadataRoute } from "next";
import { getAllProductSlugsServer } from "@/lib/api/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3101";

  const dishSlugs = await getAllProductSlugsServer();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/menu`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/track-order`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Menu sections are anchors on the single /menu page rather than pages of
  // their own, so there is nothing section-shaped to list here.
  const dishRoutes: MetadataRoute.Sitemap = dishSlugs.map((slug) => ({
    url: `${siteUrl}/menu/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...dishRoutes];
}
