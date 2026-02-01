import { string } from "better-auth";
import { NextRequest } from "next/server";

type props = { params: Promise<{ slug: string; path: string }> };

async function serveStaticAsset(req: NextRequest, props: props) {
  try {
    const { slug, path: commaPath } = await props.params;
    const path = String(commaPath).split(",");
    //error handling
    //return Response.redirect(new URL("/err?type=ERR_FILE_NOT_FOUND", req.url));

    return new Response(
      `Slug: ${slug} | Path: ${path.join("/")} | Serving Assets!`,
    );
  } catch (e) {
    console.error(e);
    return new Response(`ERROR!`);
  }
}

// list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
export const GET = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const HEAD = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const POST = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const PUT = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const DELETE = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const CONNECT = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const OPTIONS = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const TRACE = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
export const PATCH = async (req: NextRequest, props: props) =>
  await serveStaticAsset(req, props);
