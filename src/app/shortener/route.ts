import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  return Response.redirect(new URL("/index", req.url), 307);
};

export const POST = async (req: NextRequest) => {
  return Response.redirect(new URL("/index", req.url), 307);
};
