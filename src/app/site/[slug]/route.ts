import { NextRequest } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import randomString from "@/components/randomString";
import { resolveLocation } from "@/lib/geoip";
import { getFile } from "@/lib/s3";

export const GET = async (req: NextRequest, props: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await props.params;

    const site = await db.select().from(siteData).where(eq(siteData.slug, slug)).limit(1);
    if (site.length === 0) {
      return new Response("Site not found", { status: 404 });
    }

    const userAgent = req.headers.get("user-agent") || "unknown";
    resolveLocation(req).then((loc) => {
      db.insert(siteAnalytics).values({
        id: randomString(16, "url"),
        siteId: site[0].id,
        country: loc.country,
        city: loc.city,
        region: loc.region,
        userAgent,
      }).catch(() => {});
    }).catch(() => {});

    const file = await getFile(`${site[0].fsPath}/index.html`);
    if (!file) {
      return new Response("index.html not found", { status: 404 });
    }

    return new Response(Buffer.from(file.body), {
      headers: { "Content-Type": file.contentType },
    });
  } catch (e: any) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
};
