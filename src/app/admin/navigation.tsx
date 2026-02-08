"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ViewTransition } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/urls", label: "URLs" },
  { href: "/sites", label: "Sites" },
  { href: "/settings", label: "Settings" },
];

export default function Navigation() {
  const pathname = usePathname();
  const disallowedPathStartsWith = ["/auth/", "/api/"];
  if (disallowedPathStartsWith.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col select-none">
      {!scrolled && (
        <div className="flex flex-row justify-between p-2 m-1 mb-0 pb-0">
          <ViewTransition name="yhMTitle">
            <Link href="/">
              <span>yhM</span>
              <span className="text-accent-foreground/60 text-xs">v1</span>
            </Link>
          </ViewTransition>
          <div className="flex flex-row items-center space-x-3">
            <Link href="/auth/logout" className="group cursor-pointer">
              <LogOut className="w-4 h-4 group-hover:-rotate-5 group-hover:scale-110" />
            </Link>
          </div>
        </div>
      )}
      <div
        className={`transition-all duration-300 flex flex-row overflow-x-scroll hide-scrollbar border-b border-accent p-1 m-1 pl-3 ${scrolled ? "fixed inset-x-0 bg-accent/70 rounded-xl" : ""}`}
      >
        {scrolled && (
          <ViewTransition name="yhMTitle">
            <span className="p-1 rounded-md">
              <span>yhM</span>
              <span className="text-accent-foreground/60 text-xs">v1</span>
            </span>
          </ViewTransition>
        )}
        <div className="flex flex-row items-center space-x-3">
          {/*text */}
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={`hover:text-accent-foreground hover:bg-accent transition-all duration-100 p-1 ${index === 0 ? "rounded-l-md" : ""} ${index === links.length - 1 ? "rounded-r-md" : ""} ${pathname === link.href ? "border-b border-accent-foreground/90 rounded-b-none text-accent-foreground" : " text-accent-foreground/70"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
