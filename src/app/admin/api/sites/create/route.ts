import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const POST = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const files = formData.getAll("files") as File[];

    if (!name || !slug) {
      return Response.json({ error: "name and slug required" }, { status: 400 });
    }
    if (!/^[\w-]+$/.test(slug)) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
    }

    const existing = await db.select().from(siteData).where(eq(siteData.slug, slug)).limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Slug already exists" }, { status: 409 });
    }

    const siteId = randomString(12, "url");
    const fsPath = join(process.cwd(), "sites", slug);
    await mkdir(fsPath, { recursive: true });

    if (files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = join(fsPath, file.name || "index.html");
        await mkdir(join(filePath, ".."), { recursive: true });
        await writeFile(filePath, buffer);
      }
    }

    const result = await db.insert(siteData).values({
      id: siteId,
      name,
      slug,
      fsPath,
      createdBy: auth.userId,
      updatedBy: auth.userId,
    }).returning();

    return Response.json({ error: null, site: result[0] });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
