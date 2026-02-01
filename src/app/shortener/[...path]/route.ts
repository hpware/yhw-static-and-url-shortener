import { NextRequest } from "next/server";
import { forwardRedirect } from "../redirectFunction";
type props = { params: Promise<{ path: string }> };

// list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
export const GET = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const HEAD = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const POST = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const PUT = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const DELETE = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const CONNECT = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const OPTIONS = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const TRACE = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
export const PATCH = async (req: NextRequest, props: props) =>
  await forwardRedirect(req, props, false);
