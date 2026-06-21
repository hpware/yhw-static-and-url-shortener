import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { shortenerData } from "@/components/drizzle/schema";
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

    let query;
    if (body.id) {
      query = db.select().from(shortenerData).where(eq(shortenerData.id, body.id)).limit(1);
    } else {
      query = db.select().from(shortenerData).where(eq(shortenerData.slug, body.slug)).limit(1);
    }
    const existing = await query;
    if (existing.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedBy: auth.userId };
    if (body.destination) updates.destination = body.destination;
    if (body.slug) updates.slug = body.slug;
    if (body.name) updates.name = body.name;

    const result = await db.update(shortenerData).set(updates).where(eq(shortenerData.id, existing[0].id)).returning();
    return Response.json({ error: null, result: result[0] });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
