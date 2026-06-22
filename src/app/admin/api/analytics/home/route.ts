import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import {
  shortenerData,
  shortenerAnalytics,
  siteData,
  siteAnalytics,
} from "@/components/drizzle/schema";
import { eq, sql, count, countDistinct } from "drizzle-orm";

export const GET = async () => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalShortener] = await db.select({ count: count() }).from(shortenerAnalytics);
    const [totalSite] = await db.select({ count: count() }).from(siteAnalytics);
    const [todayShortener] = await db
      .select({ count: count() })
      .from(shortenerAnalytics)
      .where(sql`${shortenerAnalytics.createdAt} >= ${todayStart}`);
    const [todaySite] = await db
      .select({ count: count() })
      .from(siteAnalytics)
      .where(sql`${siteAnalytics.createdAt} >= ${todayStart}`);
    const [uniqueCountries] = await db
      .select({ count: countDistinct(shortenerAnalytics.country) })
      .from(shortenerAnalytics);

    const topLinks = await db
      .select({
        slug: shortenerData.slug,
        name: shortenerData.name,
        clicks: count(shortenerAnalytics.id),
      })
      .from(shortenerData)
      .leftJoin(shortenerAnalytics, eq(shortenerData.id, shortenerAnalytics.refId))
      .groupBy(shortenerData.id, shortenerData.slug, shortenerData.name)
      .orderBy(sql`count(${shortenerAnalytics.id}) desc`)
      .limit(10);

    const recentClicks = await db
      .select({
        slug: shortenerData.slug,
        country: shortenerAnalytics.country,
        city: shortenerAnalytics.city,
        region: shortenerAnalytics.region,
        userAgent: shortenerAnalytics.userAgent,
        createdAt: shortenerAnalytics.createdAt,
      })
      .from(shortenerAnalytics)
      .leftJoin(shortenerData, eq(shortenerAnalytics.refId, shortenerData.id))
      .orderBy(sql`${shortenerAnalytics.createdAt} desc`)
      .limit(20);

    const topCountries = await db
      .select({
        country: shortenerAnalytics.country,
        count: count(shortenerAnalytics.id),
      })
      .from(shortenerAnalytics)
      .groupBy(shortenerAnalytics.country)
      .orderBy(sql`count(${shortenerAnalytics.id}) desc`)
      .limit(10);

    const topCities = await db
      .select({
        city: shortenerAnalytics.city,
        country: shortenerAnalytics.country,
        count: count(shortenerAnalytics.id),
      })
      .from(shortenerAnalytics)
      .groupBy(shortenerAnalytics.city, shortenerAnalytics.country)
      .orderBy(sql`count(${shortenerAnalytics.id}) desc`)
      .limit(10);

    return Response.json({
      error: null,
      data: {
        totalShortenerVisits: totalShortener.count,
        totalSiteVisits: totalSite.count,
        totalVisits: totalShortener.count + totalSite.count,
        todayShortenerVisits: todayShortener.count,
        todaySiteVisits: todaySite.count,
        todayVisits: todayShortener.count + todaySite.count,
        uniqueCountries: uniqueCountries.count,
        topLinks,
        recentClicks,
        topCountries,
        topCities,
      },
    });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
