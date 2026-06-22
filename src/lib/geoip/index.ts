import { join } from "path";

export type GeoLocation = {
  country: string;
  city: string;
  region: string;
};

let maxmindReader: any = null;
let maxmindAttempted = false;

async function getMaxmindReader() {
  if (maxmindAttempted) return maxmindReader;
  maxmindAttempted = true;
  const dbPath = process.env.MAXMIND_DB_PATH;
  if (!dbPath) return null;
  try {
    const maxmind = await import("maxmind");
    maxmindReader = await maxmind.open(dbPath);
    console.log("MaxMind loaded from:", dbPath);
  } catch {
    maxmindReader = null;
  }
  return maxmindReader;
}

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
    const db = await getMaxmindReader();
    if (db) {
      const result = db.get(ip);
      if (result) {
        return {
          country: result.country?.names?.en || result.registered_country?.names?.en || "unknown",
          city: result.city?.names?.en || "unknown",
          region: result.subdivisions?.[0]?.names?.en || "unknown",
        };
      }
    }
  } catch {}

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
