import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { shortenerData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";

export const POST = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!(body && body.url)) {
      return Response.json({ error: "Invalid request. url required." }, { status: 400 });
    }
    const slug = body.slug || randomString(8, "url");
    const name = body.name || slug;

    const existing = await db.select().from(shortenerData).where(eq(shortenerData.slug, slug)).limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Slug already exists" }, { status: 409 });
    }

    const saveUrl = await db
      .insert(shortenerData)
      .values({
        name,
        slug,
        destination: body.url,
        createdBy: auth.userId,
        updatedBy: auth.userId,
      })
      .returning();
    return Response.json({
      error: null,
      slug,
      name,
      id: saveUrl[0].id,
    });
  } catch (e: any) {
    const errorId = randomString(8, "default");
    console.error(`Error ID: ${errorId}`, e);
    return Response.json({ error: e.message, errorId }, { status: 500 });
  }
};
