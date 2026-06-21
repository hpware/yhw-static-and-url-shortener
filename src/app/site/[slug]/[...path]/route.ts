import { NextRequest } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";
import randomString from "@/components/randomString";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

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

    let fullPath = join(site[0].fsPath, filePath);

    try {
      const fileStat = await stat(fullPath);
      if (fileStat.isDirectory()) {
        fullPath = join(fullPath, "index.html");
      }
    } catch {
      fullPath = join(site[0].fsPath, filePath);
      if (!extname(fullPath)) {
        fullPath = join(fullPath, "index.html");
      }
    }

    try {
      const content = await readFile(fullPath);
      const ext = extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      return new Response(content, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      const indexHtml = join(site[0].fsPath, "index.html");
      try {
        const content = await readFile(indexHtml);
        return new Response(content, {
          headers: { "Content-Type": "text/html" },
        });
      } catch {
        return new Response("File not found", { status: 404 });
      }
    }
  } catch (e: any) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
}

type RouteProps = { params: Promise<{ slug: string; path: string[] }> };

export const GET = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const HEAD = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const POST = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const PUT = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const DELETE = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const OPTIONS = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
export const PATCH = async (req: NextRequest, props: RouteProps) => serveStaticAsset(req, props);
