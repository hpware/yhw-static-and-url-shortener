import { NextRequest } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { streamToResponse, objectExists } from "@/lib/s3";
import { getMimeType } from "@/lib/mime";
import { nanoid } from "nanoid";

type Props = { params: Promise<{ slug: string; path: string[] }> };

// Cache control for different file types
function getCacheControl(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  // Static assets with content hashing - cache for 1 year
  if (ext && ["js", "css", "woff", "woff2", "ttf", "otf", "eot"].includes(ext)) {
    return "public, max-age=31536000, immutable";
  }

  // Images - cache for 1 week
  if (
    ext &&
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "avif"].includes(ext)
  ) {
    return "public, max-age=604800";
  }

  // HTML - no cache to ensure fresh content
  if (ext && ["html", "htm"].includes(ext)) {
    return "no-cache, no-store, must-revalidate";
  }

  // Default - cache for 1 hour
  return "public, max-age=3600";
}

// Record analytics asynchronously (don't block response)
async function recordAnalytics(
  siteId: string,
  req: NextRequest
): Promise<void> {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Get region from Vercel headers or default
    const ipRegion =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "unknown";

    await db.insert(siteAnalytics).values({
      id: nanoid(),
      siteId,
      ip,
      ipRegion,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to record analytics:", error);
  }
}

async function serveStaticAsset(req: NextRequest, props: Props) {
  try {
    const { slug, path: pathArray } = await props.params;

    // Handle path array (Next.js passes it as comma-separated in some cases)
    const pathParts = Array.isArray(pathArray)
      ? pathArray
      : String(pathArray).split(",");
    let requestedPath = pathParts.join("/");

    // Look up site by slug
    const site = await db.query.siteData.findFirst({
      where: eq(siteData.slug, slug),
    });

    if (!site) {
      return new Response("Site not found", { status: 404 });
    }

    // Construct S3 key from fsPath + requested path
    const basePath = site.fsPath.endsWith("/")
      ? site.fsPath
      : site.fsPath + "/";

    // Handle index.html fallback for directory paths
    let s3Key = basePath + requestedPath;

    // If path ends with / or is empty, append index.html
    if (!requestedPath || requestedPath.endsWith("/")) {
      s3Key = basePath + requestedPath + "index.html";
    } else {
      // Check if the path is a directory (has no extension)
      const hasExtension = requestedPath.includes(".")
        ? requestedPath.split("/").pop()?.includes(".")
        : false;

      if (!hasExtension) {
        // Try as directory first (append /index.html)
        const dirKey = basePath + requestedPath + "/index.html";
        if (await objectExists(dirKey)) {
          s3Key = dirKey;
        }
      }
    }

    // Normalize key (remove double slashes)
    s3Key = s3Key.replace(/\/+/g, "/");

    // Get the file name for MIME type detection
    const filename = s3Key.split("/").pop() || "index.html";
    const contentType = getMimeType(filename);
    const cacheControl = getCacheControl(filename);

    // Record analytics asynchronously (don't await)
    recordAnalytics(site.id, req);

    // Stream file from S3
    return await streamToResponse(s3Key, contentType, cacheControl);
  } catch (error) {
    console.error("Error serving static asset:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Support all HTTP methods for static assets
export const GET = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
export const HEAD = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
export const POST = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
export const PUT = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
export const DELETE = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
export const OPTIONS = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
export const PATCH = async (req: NextRequest, props: Props) =>
  await serveStaticAsset(req, props);
