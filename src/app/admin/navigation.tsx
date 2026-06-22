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
import { useEffect, useState, useRef } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const disallowedPathStartsWith = ["/auth/", "/api/"];
  if (disallowedPathStartsWith.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col select-none" ref={navRef}>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <div className="flex flex-row justify-between items-center px-4 py-1.5">
          <Link href="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
            yhM<span className="text-muted-foreground text-xs ml-0.5">v1</span>
          </Link>
          <a href="/auth/logout" className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out border-b border-border ${
          scrolled
            ? "fixed inset-x-0 top-0 z-50 bg-background/90 backdrop-blur-md"
            : "relative"
        }`}
      >
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto hide-scrollbar">
          {scrolled && (
            <Link href="/" className="font-semibold text-sm mr-2 hover:opacity-80 transition-opacity shrink-0">
              yhM<span className="text-muted-foreground text-[10px] ml-0.5">v1</span>
            </Link>
          )}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
