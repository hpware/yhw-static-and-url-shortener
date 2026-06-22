"use client";

const links = [
  { href: "/", label: "Home" },
  { href: "/urls", label: "URLs" },
  { href: "/sites", label: "Sites" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/api-docs", label: "API Docs" },
  { href: "/settings", label: "Settings" },
];

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const disallowedPathStartsWith = ["/auth/", "/api/"];
  if (disallowedPathStartsWith.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/" className="font-semibold text-lg">
          yhM<span className="text-muted-foreground text-xs ml-0.5">v1</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <a href="/auth/logout" className="text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" />
        </a>
      </div>
    </nav>
  );
}
