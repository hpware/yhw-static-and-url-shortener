import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { sql, eq } from "drizzle-orm";

export const GET = async () => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sites = await db
      .select({
        id: siteData.id,
        name: siteData.name,
        slug: siteData.slug,
        fsPath: siteData.fsPath,
        createdBy: siteData.createdBy,
        updatedBy: siteData.updatedBy,
        qrCodePath: siteData.qrCodePath,
        createdAt: siteData.createdAt,
        updatedAt: siteData.updatedAt,
        totalVisits: sql<number>`cast(count(${siteAnalytics.id}) as int)`,
        todayVisits: sql<number>`cast(sum(case when ${siteAnalytics.createdAt} >= ${todayStart} then 1 else 0 end) as int)`,
      })
      .from(siteData)
      .leftJoin(siteAnalytics, eq(siteData.id, siteAnalytics.siteId))
      .groupBy(siteData.id)
      .orderBy(siteData.createdAt);

    return Response.json({ error: null, sites });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
