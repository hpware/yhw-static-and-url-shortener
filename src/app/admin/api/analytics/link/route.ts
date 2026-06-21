import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { shortenerData, shortenerAnalytics } from "@/components/drizzle/schema";
import { eq, sql, count } from "drizzle-orm";

export const GET = async (req: Request) => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");

    if (!id && !slug) {
      return Response.json({ error: "id or slug required" }, { status: 400 });
    }

    let link;
    if (id) {
      link = await db.select().from(shortenerData).where(eq(shortenerData.id, id)).limit(1);
    } else {
      link = await db.select().from(shortenerData).where(eq(shortenerData.slug, slug!)).limit(1);
    }
    if (link.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const [totalClicks] = await db
      .select({ count: count() })
      .from(shortenerAnalytics)
      .where(eq(shortenerAnalytics.refId, link[0].id));

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [todayClicks] = await db
      .select({ count: count() })
      .from(shortenerAnalytics)
      .where(sql`${shortenerAnalytics.refId} = ${link[0].id} AND ${shortenerAnalytics.createdAt} >= ${todayStart}`);

    const recentVisits = await db
      .select()
      .from(shortenerAnalytics)
      .where(eq(shortenerAnalytics.refId, link[0].id))
      .orderBy(sql`${shortenerAnalytics.createdAt} desc`)
      .limit(50);

    return Response.json({
      error: null,
      data: {
        link: link[0],
        totalClicks: totalClicks.count,
        todayClicks: todayClicks.count,
        recentVisits,
      },
    });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
