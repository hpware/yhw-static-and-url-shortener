import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import {
  shortenerAnalytics,
  siteAnalytics,
  shortenerData,
  siteData,
} from "@/components/drizzle/schema";
import { sql, eq, gte, count, countDistinct, desc } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";

// GET: Aggregate analytics stats
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (period === "7d") {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    // "all" => no date filter

    // Total shortener visits
    const [shortenerVisits] = await db
      .select({ count: count() })
      .from(shortenerAnalytics)
      .where(
        dateFilter
          ? gte(shortenerAnalytics.createdAt, dateFilter)
          : undefined
      );

    // Total site visits
    const [siteVisits] = await db
      .select({ count: count() })
      .from(siteAnalytics)
      .where(
        dateFilter ? gte(siteAnalytics.createdAt, dateFilter) : undefined
      );

    // Unique IPs (shortener)
    const [shortenerUniqueIps] = await db
      .select({ count: countDistinct(shortenerAnalytics.ip) })
      .from(shortenerAnalytics)
      .where(
        dateFilter
          ? gte(shortenerAnalytics.createdAt, dateFilter)
          : undefined
      );

    // Unique IPs (sites)
    const [siteUniqueIps] = await db
      .select({ count: countDistinct(siteAnalytics.ip) })
      .from(siteAnalytics)
      .where(
        dateFilter ? gte(siteAnalytics.createdAt, dateFilter) : undefined
      );

    // Unique countries (shortener)
    const [shortenerCountries] = await db
      .select({ count: countDistinct(shortenerAnalytics.ipRegion) })
      .from(shortenerAnalytics)
      .where(
        dateFilter
          ? gte(shortenerAnalytics.createdAt, dateFilter)
          : undefined
      );

    // Unique countries (sites)
    const [siteCountries] = await db
      .select({ count: countDistinct(siteAnalytics.ipRegion) })
      .from(siteAnalytics)
      .where(
        dateFilter ? gte(siteAnalytics.createdAt, dateFilter) : undefined
      );

    // Time series data - visits per day
    const shortenerTimeSeries = await db
      .select({
        date: sql<string>`DATE(${shortenerAnalytics.createdAt})`.as("date"),
        count: count(),
      })
      .from(shortenerAnalytics)
      .where(
        dateFilter
          ? gte(shortenerAnalytics.createdAt, dateFilter)
          : undefined
      )
      .groupBy(sql`DATE(${shortenerAnalytics.createdAt})`)
      .orderBy(sql`DATE(${shortenerAnalytics.createdAt})`);

    const siteTimeSeries = await db
      .select({
        date: sql<string>`DATE(${siteAnalytics.createdAt})`.as("date"),
        count: count(),
      })
      .from(siteAnalytics)
      .where(
        dateFilter ? gte(siteAnalytics.createdAt, dateFilter) : undefined
      )
      .groupBy(sql`DATE(${siteAnalytics.createdAt})`)
      .orderBy(sql`DATE(${siteAnalytics.createdAt})`);

    // Merge time series
    const dateMap = new Map<
      string,
      { date: string; shortener: number; sites: number }
    >();

    for (const entry of shortenerTimeSeries) {
      const existing = dateMap.get(entry.date) || {
        date: entry.date,
        shortener: 0,
        sites: 0,
      };
      existing.shortener = entry.count;
      dateMap.set(entry.date, existing);
    }

    for (const entry of siteTimeSeries) {
      const existing = dateMap.get(entry.date) || {
        date: entry.date,
        shortener: 0,
        sites: 0,
      };
      existing.sites = entry.count;
      dateMap.set(entry.date, existing);
    }

    const timeSeries = Array.from(dateMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Top URLs by visits
    const topUrls = await db
      .select({
        id: shortenerData.id,
        name: shortenerData.name,
        slug: shortenerData.slug,
        visits: count(),
      })
      .from(shortenerAnalytics)
      .innerJoin(
        shortenerData,
        eq(shortenerAnalytics.refId, shortenerData.id)
      )
      .where(
        dateFilter
          ? gte(shortenerAnalytics.createdAt, dateFilter)
          : undefined
      )
      .groupBy(shortenerData.id, shortenerData.name, shortenerData.slug)
      .orderBy(desc(count()))
      .limit(5);

    // Top sites by visits
    const topSites = await db
      .select({
        id: siteData.id,
        name: siteData.name,
        slug: siteData.slug,
        visits: count(),
      })
      .from(siteAnalytics)
      .innerJoin(siteData, eq(siteAnalytics.siteId, siteData.id))
      .where(
        dateFilter ? gte(siteAnalytics.createdAt, dateFilter) : undefined
      )
      .groupBy(siteData.id, siteData.name, siteData.slug)
      .orderBy(desc(count()))
      .limit(5);

    return NextResponse.json({
      totalVisits:
        (shortenerVisits?.count || 0) + (siteVisits?.count || 0),
      shortenerVisits: shortenerVisits?.count || 0,
      siteVisits: siteVisits?.count || 0,
      uniqueIps:
        (shortenerUniqueIps?.count || 0) + (siteUniqueIps?.count || 0),
      uniqueCountries:
        (shortenerCountries?.count || 0) + (siteCountries?.count || 0),
      timeSeries,
      topUrls,
      topSites,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
