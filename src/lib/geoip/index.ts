export type GeoLocation = {
  country: string;
  city: string;
  region: string;
};

export async function resolveLocation(req: Request): Promise<GeoLocation> {
  const vercelCountry = req.headers.get("x-vercel-ip-country");
  const vercelCity = req.headers.get("x-vercel-ip-city");
  const vercelRegion = req.headers.get("x-vercel-ip-country-region");

  if (vercelCountry) {
    return {
      country: vercelCountry || "unknown",
      city: vercelCity ? decodeURIComponent(vercelCity) : "unknown",
      region: vercelRegion || "unknown",
    };
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    return { country: "local", city: "local", region: "local" };
  }

  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName`, {
      signal: AbortSignal.timeout(2000),
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        country: data.country || "unknown",
        city: data.city || "unknown",
        region: data.regionName || "unknown",
      };
    }
  } catch {}

  return { country: "unknown", city: "unknown", region: "unknown" };
}
