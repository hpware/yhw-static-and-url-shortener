import { NextRequest } from "next/server";

async function serveStaticAsset(req: NextRequest) {
  //error handling
  //return Response.redirect(new URL("/err?type=ERR_FILE_NOT_FOUND", req.url));

  return new Response("Serving Assets!");
}

// list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
export const GET = async (req: NextRequest) => await serveStaticAsset(req);
export const HEAD = async (req: NextRequest) => await serveStaticAsset(req);
export const POST = async (req: NextRequest) => await serveStaticAsset(req);
export const PUT = async (req: NextRequest) => await serveStaticAsset(req);
export const DELETE = async (req: NextRequest) => await serveStaticAsset(req);
export const CONNECT = async (req: NextRequest) => await serveStaticAsset(req);
export const OPTIONS = async (req: NextRequest) => await serveStaticAsset(req);
export const TRACE = async (req: NextRequest) => await serveStaticAsset(req);
export const PATCH = async (req: NextRequest) => await serveStaticAsset(req);
