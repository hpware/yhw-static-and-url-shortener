import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { shortenerData, shortenerAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const POST = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.id && !body.slug) {
      return Response.json({ error: "id or slug required" }, { status: 400 });
    }

    let existing;
    if (body.id) {
      existing = await db.select().from(shortenerData).where(eq(shortenerData.id, body.id)).limit(1);
    } else {
      existing = await db.select().from(shortenerData).where(eq(shortenerData.slug, body.slug)).limit(1);
    }
    if (existing.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(shortenerAnalytics).where(eq(shortenerAnalytics.refId, existing[0].id));
    await db.delete(shortenerData).where(eq(shortenerData.id, existing[0].id));
    return Response.json({ error: null, deleted: true });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
