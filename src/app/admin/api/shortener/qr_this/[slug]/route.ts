import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import QRCode from "qrcode";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) => {
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
    const { slug } = await context.params;
    const params = new URLSearchParams(req.url.split("?")[1]);
    const { type = "png", dl: download = "0" } = Object.fromEntries(params);

    if (type === "png" || type === "jpeg" || type === "jpg") {
      // generate QR
      const qr = (await QRCode.toBuffer(
        `${process.env.NEXT_PUBLIC_URL_SHORTENER_URL}/${slug}`,
        {
          width: 512,
          margin: 1,
          scale: 3,
          errorCorrectionLevel: "Q",
        },
      )) as BodyInit;
      return new Response(qr, {
        headers: {
          "Content-Type": type.length > 0 ? `image/${type}` : "image/png",
          ...(download === "1" && {
            "Content-Disposition": `attachment; ${slug}_qr.${type}`,
          }),
        },
      });
    }
    return new Response("Invalid type", { status: 400 });
  } catch (e: any) {
    return new Response(`[ERR]: ${e.message}`);
  }
};
