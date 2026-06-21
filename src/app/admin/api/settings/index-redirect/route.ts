import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { kvData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const POST = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (body.url === undefined) {
      return Response.json({ error: "url required" }, { status: 400 });
    }

    const existing = await db.select().from(kvData).where(eq(kvData.key, "indexPageRedirection")).limit(1);
    if (existing.length > 0) {
      await db.update(kvData).set({ value: body.url || null }).where(eq(kvData.key, "indexPageRedirection"));
    } else {
      await db.insert(kvData).values({ key: "indexPageRedirection", value: body.url || null });
    }

    return Response.json({ error: null, url: body.url });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const GET = async () => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const existing = await db.select().from(kvData).where(eq(kvData.key, "indexPageRedirection")).limit(1);
    return Response.json({
      error: null,
      url: existing[0]?.value || null,
    });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
