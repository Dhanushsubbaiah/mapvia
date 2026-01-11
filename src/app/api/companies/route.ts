import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { Company } from "@/lib/types";

const DEFAULT_LA_BBOX: [number, number, number, number] = [
  -118.67,
  33.8,
  -118.15,
  34.15,
];
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];
const OVERPASS_TIMEOUT_MS = 9000;
const OVERPASS_CACHE_TTL_MS = 60000;
let overpassCache:
  | { key: string; timestamp: number; data: Company[] }
  | null = null;

const parseBbox = (bbox: string | null) => {
  if (!bbox) return null;
  const parts = bbox.split(",").map((value) => Number(value.trim()));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }
  return parts as [number, number, number, number];
};

const parseCsv = (content: string): string[][] => {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      current.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      current.push(value);
      if (current.some((cell) => cell.trim().length > 0)) {
        rows.push(current);
      }
      current = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
    if (current.some((cell) => cell.trim().length > 0)) {
      rows.push(current);
    }
  }

  return rows;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const buildAddress = (tags: Record<string, string> | undefined) => {
  if (!tags) return "Los Angeles, CA";
  const full = tags["addr:full"]?.trim();
  if (full) return full;

  const house = tags["addr:housenumber"]?.trim();
  const street = tags["addr:street"]?.trim();
  const streetLine = [house, street].filter(Boolean).join(" ").trim();
  const city = tags["addr:city"]?.trim();
  const state = tags["addr:state"]?.trim();
  const postcode = tags["addr:postcode"]?.trim();

  const parts = [streetLine, city, state, postcode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Los Angeles, CA";
};

const sanitizeOverpassRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fetchOverpassCompanies = async (
  bbox: [number, number, number, number],
  q: string | undefined
): Promise<Company[]> => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const regex = q ? sanitizeOverpassRegex(q) : "";
  const nameFilter = regex ? `["name"~"${regex}",i]` : `["name"]`;
  const cacheKey = `${bbox.join(",")}|${regex}`;
  if (
    overpassCache &&
    overpassCache.key === cacheKey &&
    Date.now() - overpassCache.timestamp < OVERPASS_CACHE_TTL_MS
  ) {
    return overpassCache.data;
  }

  const query = `
[out:json][timeout:10];
(
  node${nameFilter}["office"](${minLat},${minLng},${maxLat},${maxLng});
  node${nameFilter}["shop"](${minLat},${minLng},${maxLat},${maxLng});
  node${nameFilter}["craft"](${minLat},${minLng},${maxLat},${maxLng});
  node${nameFilter}["industrial"](${minLat},${minLng},${maxLat},${maxLng});
);
out tags 200;
`;

  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": "mapvia/0.1",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Overpass error: ${response.status}`);
      }

      const json = (await response.json()) as { elements?: OverpassElement[] };
      const elements = json.elements ?? [];

      const data = elements
        .map((element) => {
          const tags = element.tags ?? {};
          const name = tags.name?.trim();
          if (!name) return null;
          const lat = element.lat ?? element.center?.lat;
          const lng = element.lon ?? element.center?.lon;
          if (lat === undefined || lng === undefined) return null;
          const website = normalizeUrl(
            tags.website || tags["contact:website"] || ""
          );
          const tagsList = [
            tags.office,
            tags.shop,
            tags.craft,
            tags.amenity,
            tags.industrial,
          ]
            .map((value) => value?.trim())
            .filter(Boolean) as string[];

          return {
            id: `osm-${element.type}-${element.id}`,
            name,
            lat,
            lng,
            address: buildAddress(tags),
            website: website || undefined,
            careers_url: "",
            tags: tagsList,
          } as Company;
        })
        .filter(Boolean) as Company[];
      overpassCache = { key: cacheKey, timestamp: Date.now(), data };
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Overpass error: unknown");
};

const csvToCompanies = (content: string): Company[] => {
  const rows = parseCsv(content);
  const header = rows[0];
  if (!header) return [];
  const index = new Map<string, number>();
  header.forEach((name, idx) => {
    index.set(name.trim(), idx);
  });

  const companies: Company[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = row[index.get("name") ?? -1]?.trim() ?? "";
    const latRaw = row[index.get("lat") ?? -1]?.trim() ?? "";
    const lngRaw = row[index.get("lng") ?? -1]?.trim() ?? "";
    if (!name || !latRaw || !lngRaw) {
      continue;
    }
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      (lat === 0 && lng === 0)
    ) {
      continue;
    }
    const address = row[index.get("address") ?? -1]?.trim() ?? "";
    const city = row[index.get("city") ?? -1]?.trim() ?? "";
    const state = row[index.get("state") ?? -1]?.trim() ?? "";
    const website = row[index.get("website") ?? -1]?.trim() ?? "";
    const careersUrl = row[index.get("careers_url") ?? -1]?.trim() ?? "";
    const tagsRaw = row[index.get("tags") ?? -1]?.trim() ?? "";
    const tags = tagsRaw
      ? tagsRaw.split("|").map((tag) => tag.trim()).filter(Boolean)
      : [];

    companies.push({
      id: `osm-${i}`,
      name,
      lat,
      lng,
      address: address || [city, state].filter(Boolean).join(", "),
      website: website || undefined,
      careers_url: careersUrl || website,
      tags,
    });
  }
  return companies;
};

let cachedCompanies: Company[] | null = null;

const loadCompanies = async (): Promise<Company[]> => {
  if (cachedCompanies) {
    return cachedCompanies;
  }
  const filePath = path.join(process.cwd(), "data", "osm_companies.csv");
  const content = await readFile(filePath, "utf-8");
  cachedCompanies = csvToCompanies(content);
  return cachedCompanies;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bbox = parseBbox(searchParams.get("bbox"));

  if (searchParams.get("bbox") && !bbox) {
    return NextResponse.json(
      { error: "Invalid bbox format. Expected minLng,minLat,maxLng,maxLat." },
      { status: 400 }
    );
  }

  const limitParam = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isNaN(limitParam) ? 20 : Math.min(limitParam, 50);
  const cursor = searchParams.get("cursor");
  const q = searchParams.get("q")?.trim().toLowerCase();
  const tagsQuery = searchParams.get("tags");
  const source = searchParams.get("source");

  let companies: Company[] = [];
  if (source === "overpass" || bbox) {
    const activeBbox = bbox ?? DEFAULT_LA_BBOX;
    try {
      companies = await fetchOverpassCompanies(activeBbox, q);
      if (companies.length === 0) {
        companies = await loadCompanies();
      }
    } catch (error) {
      console.error("Overpass fetch failed, using CSV fallback.", error);
      companies = await loadCompanies();
    }
  } else {
    companies = await loadCompanies();
  }

  let filtered = companies;
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    filtered = filtered.filter(
      (company) =>
        company.lat >= minLat &&
        company.lat <= maxLat &&
        company.lng >= minLng &&
        company.lng <= maxLng
    );
  }
  if (q) {
    filtered = filtered.filter((company) =>
      company.name.toLowerCase().includes(q)
    );
  }
  if (tagsQuery) {
    const tagParts = tagsQuery
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    if (tagParts.length > 0) {
      filtered = filtered.filter((company) =>
        company.tags.some((tag) => tagParts.includes(tag.toLowerCase()))
      );
    }
  }

  const offset = cursor ? Number(cursor) : 0;
  const start = Number.isNaN(offset) ? 0 : offset;
  const data = filtered.slice(start, start + limit);
  const nextCursor =
    start + limit < filtered.length ? String(start + limit) : null;

  return NextResponse.json({
    data,
    nextCursor,
    total: filtered.length,
  });
}
