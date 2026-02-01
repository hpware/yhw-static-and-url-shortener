import { NextRequest } from "next/server";
import { forwardRedirect } from "./redirectFunction";

// list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
export const GET = async (req: NextRequest) => await forwardRedirect(req);
export const HEAD = async (req: NextRequest) => await forwardRedirect(req);
export const POST = async (req: NextRequest) => await forwardRedirect(req);
export const PUT = async (req: NextRequest) => await forwardRedirect(req);
export const DELETE = async (req: NextRequest) => await forwardRedirect(req);
export const CONNECT = async (req: NextRequest) => await forwardRedirect(req);
export const OPTIONS = async (req: NextRequest) => await forwardRedirect(req);
export const TRACE = async (req: NextRequest) => await forwardRedirect(req);
export const PATCH = async (req: NextRequest) => await forwardRedirect(req);
