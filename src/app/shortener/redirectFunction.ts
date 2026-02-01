import { NextRequest } from "next/server";

type props = { params: Promise<{ path: string }> };

export const forwardRedirect = async (
  req: NextRequest,
  props?: props,
  indexRoute: boolean = true,
) => {
  let path;
  if (indexRoute === true && !props) {
    path = "_<index"; // index page db storing function path
  }
  if (indexRoute === false) {
    const { path: commaPath } = await props?.params!;
    path = String(commaPath).split(",");
    const matchers = /^\/?([a-zA-Z0-9._-]+)$/;
    const match = matchers.exec(path[0]);
    if (!match) {
      return Response.redirect(
        new URL("/err?type=ERR_ILLEGAL_PATH", process.env.NEXT_PUBLIC_SITE_URL),
        307,
      );
    }
  }
  return Response.redirect(new URL(`https://default.tw/${path}`), 307);
};
