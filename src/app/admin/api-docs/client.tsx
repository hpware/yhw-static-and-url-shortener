"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Play, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Endpoint = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  example?: string;
};

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/shortener/create",
    description: "Create a short URL",
    auth: true,
    body: '{\n  "url": "https://example.com",\n  "slug": "my-link",\n  "name": "My Link"\n}',
    example: 'curl -X POST $ADMIN_URL/api/shortener/create \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_KEY" \\\n  -d \'{"url": "https://example.com"}\'',
  },
  {
    method: "GET",
    path: "/api/shortener/get_all_links",
    description: "List all short URLs (limit 100)",
    auth: true,
    example: 'curl $ADMIN_URL/api/shortener/get_all_links \\\n  -H "x-api-key: YOUR_KEY"',
  },
  {
    method: "POST",
    path: "/api/shortener/edit",
    description: "Edit a short URL (by id or slug)",
    auth: true,
    body: '{\n  "id": "uuid",\n  "destination": "https://new-url.com",\n  "slug": "new-slug",\n  "name": "New Name"\n}',
  },
  {
    method: "POST",
    path: "/api/shortener/delete",
    description: "Delete a short URL and its analytics",
    auth: true,
    body: '{\n  "id": "uuid"\n}',
  },
  {
    method: "GET",
    path: "/api/shortener/qr_this/[slug]",
    description: "Generate QR code for a short URL",
    auth: true,
    example: 'curl "$ADMIN_URL/api/shortener/qr_this/my-link?type=png&size=512" \\\n  -H "x-api-key: YOUR_KEY" -o qr.png',
  },
  {
    method: "GET",
    path: "/api/analytics/home",
    description: "Get dashboard analytics (totals, top links, recent clicks)",
    auth: true,
    example: 'curl $ADMIN_URL/api/analytics/home \\\n  -H "x-api-key: YOUR_KEY"',
  },
  {
    method: "GET",
    path: "/api/analytics/link?id=UUID",
    description: "Get analytics for a specific short URL",
    auth: true,
    example: 'curl "$ADMIN_URL/api/analytics/link?id=YOUR_LINK_ID" \\\n  -H "x-api-key: YOUR_KEY"',
  },
  {
    method: "POST",
    path: "/api/sites/create",
    description: "Create a site with file upload (multipart/form-data)",
    auth: true,
    example: 'curl -X POST $ADMIN_URL/api/sites/create \\\n  -H "x-api-key: YOUR_KEY" \\\n  -F "name=My Site" \\\n  -F "slug=my-site" \\\n  -F "files=@index.html"',
  },
  {
    method: "GET",
    path: "/api/sites/list",
    description: "List all sites with visit stats",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/sites/delete",
    description: "Delete a site and its files",
    auth: true,
    body: '{\n  "id": "site_id"\n}',
  },
  {
    method: "GET",
    path: "/api/tracking?site_id=ID",
    description: "Tracking pixel (1x1 transparent GIF)",
    auth: false,
    example: '<img src="$ADMIN_URL/api/tracking?site_id=YOUR_SITE_ID" width="1" height="1" style="display:none" />',
  },
  {
    method: "GET",
    path: "/api/keys",
    description: "List your API keys",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/keys",
    description: "Create a new API key",
    auth: true,
    body: '{\n  "name": "My App"\n}',
  },
  {
    method: "DELETE",
    path: "/api/keys",
    description: "Delete an API key",
    auth: true,
    body: '{\n  "id": "key_id"\n}',
  },
  {
    method: "GET",
    path: "/api/keys/agent-md",
    description: "Download agent.md with your API key and examples",
    auth: true,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-600",
  POST: "bg-blue-600",
  DELETE: "bg-red-600",
};

export default function ApiDocsClient() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [apiKey, setApiKey] = useState("");

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const adminUrl = typeof window !== "undefined" ? window.location.origin : "";

  const replaceVars = (s: string) =>
    s.replace(/\$ADMIN_URL/g, adminUrl).replace(/YOUR_KEY/g, apiKey || "YOUR_API_KEY");

  return (
    <div className="p-4 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Use your API key to access all endpoints programmatically. Include it as{" "}
          <code className="bg-black/30 px-1 rounded">x-api-key: YOUR_KEY</code> header.
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <Label>Test API Key</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Paste your API key to test..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              toast.success("Copied");
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {endpoints.map((ep, i) => {
          const isExpanded = expanded.has(i);
          return (
            <div key={i} className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                onClick={() => toggle(i)}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                <span className={`${methodColors[ep.method]} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                  {ep.method}
                </span>
                <code className="text-sm flex-1">{ep.path}</code>
                {ep.auth && <span className="text-xs text-amber-500 border border-amber-500 px-1 rounded">auth</span>}
              </button>
              {isExpanded && (
                <div className="border-t p-4 space-y-3 bg-black/10">
                  <p className="text-sm">{ep.description}</p>
                  {ep.body && (
                    <div>
                      <Label className="text-xs">Request Body</Label>
                      <pre className="bg-black/30 p-2 rounded text-xs mt-1 overflow-x-auto">
                        {ep.body}
                      </pre>
                    </div>
                  )}
                  {ep.example && (
                    <div>
                      <Label className="text-xs">Example</Label>
                      <div className="relative">
                        <pre className="bg-black/30 p-2 rounded text-xs mt-1 overflow-x-auto whitespace-pre-wrap">
                          {replaceVars(ep.example)}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => {
                            navigator.clipboard.writeText(replaceVars(ep.example!));
                            toast.success("Copied");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="group"
                    onClick={async () => {
                      try {
                        const headers: Record<string, string> = {};
                        if (apiKey) headers["x-api-key"] = apiKey;
                        if (ep.body) headers["Content-Type"] = "application/json";
                        const res = await fetch(replaceVars(`$ADMIN_URL${ep.path}`), {
                          method: ep.method,
                          headers,
                          body: ep.body ? replaceVars(ep.body) : undefined,
                        });
                        const text = await res.text();
                        toast.success(`${res.status}: ${text.slice(0, 200)}`);
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    <Play className="w-4 h-4 group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />
                    Try it
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
