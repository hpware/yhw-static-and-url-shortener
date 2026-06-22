import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { user, account } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const GET = async () => {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }).from(user);
    return Response.json({ error: null, users });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.email || !body.password || !body.name) {
      return Response.json({ error: "name, email, and password required" }, { status: 400 });
    }

    const existing = await db.select().from(user).where(eq(user.email, body.email)).limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }

    const userId = randomUUID();
    const accountId = randomUUID();

    const authMod = await import("@/components/auth");
    const ctx = await authMod.auth.$context;
    const hashedPassword = await ctx.password.hash(body.password);

    await db.insert(user).values({
      id: userId,
      name: body.name,
      email: body.email,
      emailVerified: true,
    });

    await db.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    return Response.json({ error: null, user: { id: userId, name: body.name, email: body.email } });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    if (body.id === auth.userId) {
      return Response.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await db.delete(account).where(eq(account.userId, body.id));
    await db.delete(user).where(eq(user.id, body.id));

    return Response.json({ error: null, deleted: true });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
