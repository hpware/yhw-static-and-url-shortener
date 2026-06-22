import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { siteData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import { uploadFile, getSitePrefix } from "@/lib/s3";

const EXT_TO_MIME: Record<string, string> = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webp": "image/webp", ".woff": "font/woff",
  ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml",
  ".pdf": "application/pdf",
};

function getMime(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return EXT_TO_MIME[ext] || "application/octet-stream";
}

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
    const prefix = getSitePrefix(slug);

    if (files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const key = `${prefix}/${file.name || "index.html"}`;
        await uploadFile(key, buffer, getMime(file.name || "index.html"));
      }
    }

    const result = await db.insert(siteData).values({
      id: siteId,
      name,
      slug,
      fsPath: prefix,
      createdBy: auth.userId,
      updatedBy: auth.userId,
    }).returning();

    return Response.json({ error: null, site: result[0] });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
