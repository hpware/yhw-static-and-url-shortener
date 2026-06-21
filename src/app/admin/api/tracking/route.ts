import { db } from "@/components/drizzle/db";
import { siteAnalytics } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const siteId = url.searchParams.get("site_id");
  const ref = url.searchParams.get("ref") || "";

  if (siteId) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    try {
      await db.insert(siteAnalytics).values({
        id: randomString(16, "url"),
        siteId,
        ip,
        ipRegion: "unknown",
        userAgent,
      });
    } catch (e) {
      console.error("Tracking pixel error:", e);
    }
  }

  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
};
