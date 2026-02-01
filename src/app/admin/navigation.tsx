"use client";

import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const disallowedPathStartsWith = ["/auth/"];
  if (disallowedPathStartsWith.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return <div></div>;
}
