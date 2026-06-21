import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { apiKeys } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import randomString from "@/components/randomString";

export const GET = async () => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, auth.userId));
    return Response.json({ error: null, keys });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.name) {
      return Response.json({ error: "name required" }, { status: 400 });
    }

    const key = `yh_${randomString(32, "url")}`;
    const result = await db.insert(apiKeys).values({
      name: body.name,
      key,
      userId: auth.userId,
    }).returning();

    return Response.json({ error: null, apiKey: result[0] });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    const existing = await db.select().from(apiKeys).where(eq(apiKeys.id, body.id)).limit(1);
    if (existing.length === 0 || existing[0].userId !== auth.userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, body.id));
    return Response.json({ error: null, deleted: true });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
