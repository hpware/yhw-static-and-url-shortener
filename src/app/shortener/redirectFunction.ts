import { db } from "@/components/drizzle/db";
import { shortenerAnalytics, shortenerData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type props = { params: Promise<{ path: string[] }> };

const saveAnalyticsData = (req: NextRequest, slugId: string) => {
  Promise.resolve(async () => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    await db.insert(shortenerAnalytics).values({
      refId: slugId,
      ip,
      ipRegion: "a",
      userAgent,
    });
  });
};

export const forwardRedirect = async (req: NextRequest, props?: props) => {
  try {
    let path;
    const { path: commaPath } = await props?.params!;
    path = String(commaPath).split(",");
    const matchers = /^\/?([a-zA-Z0-9._-]+)$/;
    for (const i of path) {
      const match = matchers.exec(i);
      if (!match) {
        return Response.redirect(
          new URL(
            "/err?type=ERR_ILLEGAL_PATH",
            process.env.NEXT_PUBLIC_SITE_URL,
          ),
          307,
        );
      }
      console.log(path.join("/"));
      const findPath = await db
        .select()
        .from(shortenerData)
        .where(eq(shortenerData.slug, path.join("/")))
        .execute();
      if (findPath.length === 0) {
        return Response.redirect(
          new URL("/err?type=ERR_NOT_FOUND", process.env.NEXT_PUBLIC_SITE_URL),
          307,
        );
      }
      saveAnalyticsData(req, findPath[0].id);
      return Response.redirect(new URL(findPath[0].destination), 307);
    }
  } catch (e: any) {
    const errorId = randomString(16);
    console.error(`ERRID: ${errorId}`, e);
    return Response.redirect(
      new URL(
        `/err?type=SERVER_SIDE_ERR&id=${errorId}`,
        process.env.NEXT_PUBLIC_SITE_URL,
      ),
      307,
    );
  }
};
