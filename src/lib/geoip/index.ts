import maxmind, { Reader } from "maxmind";
import { join } from "path";

let reader: Reader<any> | null = null;
let loadAttempted = false;

async function getReader(): Promise<Reader<any> | null> {
  if (loadAttempted) return reader;
  loadAttempted = true;

  const dbPath = process.env.MAXMIND_DB_PATH || join(process.cwd(), "GeoLite2-City.mmdb");
  try {
    reader = await maxmind.open(dbPath);
    console.log("MaxMind GeoLite2 database loaded from:", dbPath);
  } catch {
    console.warn("MaxMind database not found at:", dbPath, "- location will be 'unknown'");
    reader = null;
  }
  return reader;
}

export type GeoLocation = {
  country: string;
  city: string;
  region: string;
};

export async function resolveLocation(ip: string): Promise<GeoLocation> {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    return { country: "local", city: "local", region: "local" };
  }

  const cleanIp = ip.split(",")[0].trim();

  try {
    const db = await getReader();
    if (!db) {
      return { country: "unknown", city: "unknown", region: "unknown" };
    }

    const result = db.get(cleanIp);
    if (!result) {
      return { country: "unknown", city: "unknown", region: "unknown" };
    }

    return {
      country: result.country?.names?.en || result.registered_country?.names?.en || "unknown",
      city: result.city?.names?.en || "unknown",
      region: result.subdivisions?.[0]?.names?.en || "unknown",
    };
  } catch {
    return { country: "unknown", city: "unknown", region: "unknown" };
  }
}
