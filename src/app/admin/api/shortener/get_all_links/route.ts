import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { shortenerData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await db.select().from(shortenerData).limit(100);
    return Response.json({
      result: data,
      nextOffset: 100,
    });
  } catch (e: any) {
    const erroID = randomString(8, "default");
    console.error(`[ID: ${erroID}] ${e}`);
    return Response.json({ error: e.message, errorId: erroID }, { status: 500 });
  }
};
