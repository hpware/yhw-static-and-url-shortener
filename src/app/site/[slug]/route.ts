import { NextRequest } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";
import randomString from "@/components/randomString";

export const GET = async (req: NextRequest, props: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await props.params;

    const site = await db.select().from(siteData).where(eq(siteData.slug, slug)).limit(1);
    if (site.length === 0) {
      return new Response("Site not found", { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    try {
      await db.insert(siteAnalytics).values({
        id: randomString(16, "url"),
        siteId: site[0].id,
        ip,
        ipRegion: "unknown",
        userAgent,
      });
    } catch {
      // non-fatal
    }

    const indexPath = join(site[0].fsPath, "index.html");
    try {
      const content = await readFile(indexPath);
      return new Response(content, {
        headers: { "Content-Type": "text/html" },
      });
    } catch {
      return new Response("index.html not found", { status: 404 });
    }
  } catch (e: any) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
};
