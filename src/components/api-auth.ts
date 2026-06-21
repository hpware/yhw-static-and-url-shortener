import { auth } from "@/components/auth";
import { db } from "@/components/drizzle/db";
import { apiKeys } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function authenticateRequest(req?: Request) {
  const header = await headers();

  const apiKey = header.get("x-api-key") || header.get("authorization")?.replace("Bearer ", "");
  if (apiKey) {
    const keyRecord = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
    if (keyRecord.length > 0) {
      await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord[0].id));
      return { type: "api_key" as const, userId: keyRecord[0].userId, keyId: keyRecord[0].id };
    }
  }

  const session = await auth.api.getSession({ headers: header });
  if (session) {
    return { type: "session" as const, userId: session.user.id, keyId: null };
  }

  return null;
}
