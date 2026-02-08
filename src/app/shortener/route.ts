import { db } from "@/components/drizzle/db";
import { kvData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { saveAnalyticsData } from "./redirectFunction";

async function forwardRedirect(req: NextRequest) {
  try {
    const loadIndexKvRedirect = await db
      .select()
      .from(kvData)
      .where(eq(kvData.key, "indexPageRedirection"));
    if (
      loadIndexKvRedirect[0].value === null &&
      String(loadIndexKvRedirect[0].value).match(/^(https?:\/\/[^/]+)(.*)$/) ===
        null
    ) {
      // wait it is jsonb !!
      return Response.redirect(
        new URL(
          "/err?type=ERR_REDIRECT_NOT_FOUND",
          process.env.NEXT_PUBLIC_SITE_URL,
        ),
      );
    }

    saveAnalyticsData(req, "/");
    return Response.redirect(
      new URL(String(loadIndexKvRedirect[0].value)),
      307,
    );
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
}

// list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
export const GET = async (req: NextRequest) => await forwardRedirect(req);
export const HEAD = async (req: NextRequest) => await forwardRedirect(req);
export const POST = async (req: NextRequest) => await forwardRedirect(req);
export const PUT = async (req: NextRequest) => await forwardRedirect(req);
export const DELETE = async (req: NextRequest) => await forwardRedirect(req);
export const CONNECT = async (req: NextRequest) => await forwardRedirect(req);
export const OPTIONS = async (req: NextRequest) => await forwardRedirect(req);
export const TRACE = async (req: NextRequest) => await forwardRedirect(req);
export const PATCH = async (req: NextRequest) => await forwardRedirect(req);
