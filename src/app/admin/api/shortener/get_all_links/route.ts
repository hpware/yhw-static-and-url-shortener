import { auth } from "@/components/auth";
import { db } from "@/components/drizzle/db";
import { shortenerData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  let statusCode = 500;
  try {
    // check user auth
    const header = await headers();
    const session = await auth.api.getSession({
      headers: header,
    });
    if (!session) {
      statusCode = 401;
      throw new Error("Unauthorized");
    }
    if (!session?.session?.userId) {
      statusCode = 401;
      throw new Error("Unauthorized");
    }
    const data = await db.select().from(shortenerData).limit(100);
    return Response.json(data);
  } catch (e: any) {
    const erroID = randomString(8, "default");
    console.error(`[ID: ${erroID}] ${e}`);
    return new Response(`ERRID: ${erroID}, ${e.message}`, {
      status: statusCode,
    });
  }
};
