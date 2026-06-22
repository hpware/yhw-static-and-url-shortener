import { NextRequest } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import randomString from "@/components/randomString";
import { resolveLocation } from "@/lib/geoip";
import { getFile } from "@/lib/s3";

async function serveStaticAsset(req: NextRequest, props: { params: Promise<{ slug: string; path: string[] }> }) {
  try {
    const { slug, path: commaPath } = await props.params;
    const pathSegments = String(commaPath).split(",");
    const filePath = pathSegments.join("/");

    const site = await db.select().from(siteData).where(eq(siteData.slug, slug)).limit(1);
    if (site.length === 0) {
      return new Response("Site not found", { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    try {
      const loc = await resolveLocation(ip);
      await db.insert(siteAnalytics).values({
        id: randomString(16, "url"),
        siteId: site[0].id,
        country: loc.country,
        city: loc.city,
        region: loc.region,
        userAgent,
      });
    } catch {
      // non-fatal
    }

    const prefix = site[0].fsPath;
    let key = `${prefix}/${filePath}`;

    let file = await getFile(key);
    if (!file) {
      if (!filePath.includes(".")) {
        file = await getFile(`${key}/index.html`);
        if (!file) {
          file = await getFile(`${key}.html`);
        }
      }
    }

    if (!file) {
      file = await getFile(`${prefix}/index.html`);
    }

    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    return new Response(Buffer.from(file.body), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}

type RouteProps = { params: Promise<{ slug: string; path: string[] }> };

export const GET = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const HEAD = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const OPTIONS = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const PATCH = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
