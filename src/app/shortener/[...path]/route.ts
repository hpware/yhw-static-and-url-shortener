import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  return Response.redirect(new URL("https://default.tw"), 307);
};

export const POST = async (req: NextRequest) => {
  return Response.redirect(new URL("https://default.tw"), 307);
};
