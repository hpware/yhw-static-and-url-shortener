import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { rm } from "fs/promises";

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
      existing = await db.select().from(siteData).where(eq(siteData.id, body.id)).limit(1);
    } else {
      existing = await db.select().from(siteData).where(eq(siteData.slug, body.slug)).limit(1);
    }
    if (existing.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(siteAnalytics).where(eq(siteAnalytics.siteId, existing[0].id));
    await db.delete(siteData).where(eq(siteData.id, existing[0].id));

    try {
      await rm(existing[0].fsPath, { recursive: true, force: true });
    } catch {
      // fs cleanup failure is non-fatal
    }

    return Response.json({ error: null, deleted: true });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
