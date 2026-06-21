"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function SettingsClient() {
  const [indexUrl, setIndexUrl] = useState("");

  const { data } = useQuery({
    queryKey: ["settings-index-redirect"],
    queryFn: async () => {
      const res = await fetch("/api/settings/index-redirect");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.url;
    },
  });

  useEffect(() => {
    if (data !== undefined) setIndexUrl(data || "");
  }, [data]);

  return (
    <div className="p-4 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Shortener Root Redirect</h2>
        <p className="text-sm text-muted-foreground">
          Set the URL that visitors are redirected to when visiting the shortener root domain.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={indexUrl}
            onChange={(e) => setIndexUrl(e.target.value)}
          />
          <Button
            onClick={async () => {
              try {
                const res = await fetch("/api/settings/index-redirect", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: indexUrl || null }),
                });
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                toast.success("Root redirect updated");
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">System Info</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Version</span>
          <span>0.1.0</span>
          <span className="text-muted-foreground">Framework</span>
          <span>Next.js 16</span>
          <span className="text-muted-foreground">Database</span>
          <span>PostgreSQL</span>
          <span className="text-muted-foreground">Auth</span>
          <span>Better Auth</span>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Tracking Pixel</h2>
        <p className="text-sm text-muted-foreground">
          Embed this invisible tracking pixel in your sites to track visits:
        </p>
        <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
{`<img src="${typeof window !== "undefined" ? window.location.origin : "ADMIN_URL"}/api/tracking?site_id=YOUR_SITE_ID" width="1" height="1" style="display:none" />`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Or use the tracking script for automatic page view tracking:
        </p>
        <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
{`<script>
  (function() {
    var img = new Image();
    img.src = "${typeof window !== "undefined" ? window.location.origin : "ADMIN_URL"}/api/tracking?site_id=YOUR_SITE_ID&ref=" + encodeURIComponent(document.referrer);
    img.style.display = "none";
    document.body.appendChild(img);
  })();
</script>`}
        </pre>
      </div>
    </div>
  );
}
