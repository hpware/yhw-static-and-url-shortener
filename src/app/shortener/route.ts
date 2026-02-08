import { db } from "@/components/drizzle/db";
import { kvData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

async function forwardRedirect(req: NextRequest) {
  try {
    const loadIndexKvRedirect = await db
      .select()
      .from(kvData)
      .where(eq(kvData.key, "indexPageRedirection"));
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
