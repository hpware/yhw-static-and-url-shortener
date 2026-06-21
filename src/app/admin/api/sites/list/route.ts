import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq, count, sql } from "drizzle-orm";

export const GET = async () => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sites = await db.select().from(siteData);

    const sitesWithStats = await Promise.all(
      sites.map(async (site) => {
        const [totalVisits] = await db
          .select({ count: count() })
          .from(siteAnalytics)
          .where(eq(siteAnalytics.siteId, site.id));
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [todayVisits] = await db
          .select({ count: count() })
          .from(siteAnalytics)
          .where(
            sql`${siteAnalytics.siteId} = ${site.id} AND ${siteAnalytics.createdAt} >= ${todayStart}`
          );
        return {
          ...site,
          totalVisits: totalVisits.count,
          todayVisits: todayVisits.count,
        };
      })
    );

    return Response.json({ error: null, sites: sitesWithStats });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
