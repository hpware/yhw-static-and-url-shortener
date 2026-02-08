import { auth } from "@/components/auth";
import { db } from "@/components/drizzle/db";
import { shortenerData } from "@/components/drizzle/schema";
import randomString from "@/components/randomString";
import { headers } from "next/headers";
//import QRCode from "qrcode";

export const POST = async (req: Request) => {
  let statusCode = 500;
  try {
    const header = await headers();
    const checkAuth = await auth.api.getSession({
      headers: header,
    });
    if (!checkAuth) {
      statusCode = 401;
      throw new Error("Unauthorized");
    }
    const body = await req.json();
    if (!(body && body.url)) {
      statusCode = 400;
      throw new Error("Invalid request.");
    }
    const slug = body.slug || randomString(8, "url");
    const name = body.name || slug;
    //const qrCodePath = await QRCode.toDataURL();
    const saveUrl = await db
      .insert(shortenerData)
      .values({
        name,
        slug,
        destination: body.url,
        createdBy: checkAuth?.user.id,
        updatedBy: checkAuth?.user.id,
        //qrCodePath: "qrCodePath",
      })
      .returning();
    return Response.json({
      error: null,
      errorId: null,
      slug,
      name,
      id: saveUrl[0].id,
    });
  } catch (e: any) {
    const errorId = randomString(8, "default");
    console.error(`Error ID: ${errorId}`, e);
    return Response.json({
      error: e.message,
      errorId,
    });
  }
};

/**
 * {
 *    "url": string,
 *    "slug": string?,
 *    expiresAt: Date?, // later

 * }
 */
