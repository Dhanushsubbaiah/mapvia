import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { Company } from "@/lib/types";

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

  const companies = await loadCompanies();

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
