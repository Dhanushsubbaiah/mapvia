"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import type { Company } from "@/lib/types";

type MapMovePayload = {
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  zoom: number;
};

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

const roundCoord = (value: number, precision = 5) =>
  Number(value.toFixed(precision));

const normalizeMovePayload = (payload: MapMovePayload): MapMovePayload => ({
  center: {
    lat: roundCoord(payload.center.lat),
    lng: roundCoord(payload.center.lng),
  },
  bounds: {
    north: roundCoord(payload.bounds.north),
    south: roundCoord(payload.bounds.south),
    east: roundCoord(payload.bounds.east),
    west: roundCoord(payload.bounds.west),
  },
  zoom: payload.zoom,
});

const radiusOptions = [
  { label: "5 miles", value: "5" },
  { label: "10 miles", value: "10" },
  { label: "20 miles", value: "20" },
  { label: "35 miles", value: "35" },
];

const AREA_PRESETS = [
  { key: "soma", label: "SOMA / Mission Bay", center: [37.7786, -122.3999], zoom: 13 },
  { key: "palo-alto", label: "Palo Alto", center: [37.4419, -122.143], zoom: 13 },
  { key: "mountain-view", label: "Mountain View", center: [37.3861, -122.0839], zoom: 12 },
  { key: "berkeley", label: "Berkeley", center: [37.8715, -122.273], zoom: 13 },
] as const;

const SF_ZIPCODES = new Set([
  "94102",
  "94103",
  "94104",
  "94105",
  "94107",
  "94108",
  "94109",
  "94110",
  "94111",
  "94112",
  "94114",
  "94115",
  "94116",
  "94117",
  "94118",
  "94121",
  "94122",
  "94123",
  "94124",
  "94127",
  "94129",
  "94130",
  "94131",
  "94132",
  "94133",
  "94134",
  "94158",
]);

const PALO_ALTO_ZIPCODES = new Set([
  "94301",
  "94303",
  "94304",
  "94305",
  "94306",
]);

const MOUNTAIN_VIEW_ZIPCODES = new Set([
  "94035",
  "94040",
  "94041",
  "94043",
]);

const BERKELEY_ZIPCODES = new Set([
  "94701",
  "94702",
  "94703",
  "94704",
  "94705",
  "94706",
  "94707",
  "94708",
  "94709",
  "94710",
  "94712",
  "94720",
]);

export default function MapPage() {
  const searchParams = useSearchParams();
  const areaKey = searchParams.get("area");
  const areaPreset = useMemo(
    () => AREA_PRESETS.find((preset) => preset.key === areaKey) ?? null,
    [areaKey]
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [radius, setRadius] = useState("20");
  const [locationQuery, setLocationQuery] = useState("San Francisco Bay Area, CA");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastMove, setLastMove] = useState<MapMovePayload | null>(null);
  const fetchController = useRef<AbortController | null>(null);
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(
    null
  );
  const [targetZoom, setTargetZoom] = useState<number | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const mapKey = areaPreset ? `area-${areaPreset.key}` : "area-default";
  const initialCenter: [number, number] = areaPreset?.center ?? [
    37.68,
    -122.25,
  ];
  const initialZoom = areaPreset?.zoom ?? 8;

  useEffect(() => {
    if (!areaPreset) {
      setTargetCenter(null);
      setTargetZoom(null);
      return;
    }
    setLocationQuery(areaPreset.label);
    setHasMoved(false);
    setSearchNotice(null);
  }, [areaPreset]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/companies?limit=all");
        const json = await response.json();
        setCompanies(json.data ?? []);
      } catch (error) {
        console.error("Failed to load companies", error);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!areaPreset) {
      loadCompanies();
    }
  }, [areaPreset]);

  const companyCount = useMemo(() => companies.length, [companies]);
  const keywordOptions = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((company) => {
      company.tags.forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) {
          set.add(trimmed);
        }
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 40);
  }, [companies]);

  const loadCompaniesForBbox = async (payload: MapMovePayload) => {
    const { bounds } = payload;
    const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    const url = new URL("/api/companies", window.location.origin);
    url.searchParams.set("bbox", bbox);
    url.searchParams.set("limit", "all");
    if (keyword.trim()) {
      url.searchParams.set("q", keyword.trim());
    }
    let controller: AbortController | null = null;
    try {
      fetchController.current?.abort();
      controller = new AbortController();
      fetchController.current = controller;
      setIsLoading(true);
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Companies fetch failed: ${response.status}`);
      }
      const json = await response.json();
      setCompanies(json.data ?? []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to load companies", error);
    } finally {
      if (controller && fetchController.current?.signal === controller.signal) {
        fetchController.current = null;
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!lastMove) return undefined;
    const handle = window.setTimeout(() => {
      loadCompaniesForBbox(lastMove);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [lastMove, keyword]);

  const handleMapMove = (payload: MapMovePayload) => {
    const normalized = normalizeMovePayload(payload);
    if (!lastMove) {
      setLastMove(normalized);
      return;
    }

    setHasMoved(true);
    setLastMove(normalized);
    console.info("event:map_moved", normalized);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchNotice(null);
    const zipMatch = locationQuery.match(/\b\d{5}\b/);
    if (zipMatch) {
      const zip = zipMatch[0];
      if (SF_ZIPCODES.has(zip)) {
        setSearchNotice(
          "San Francisco ZIP search is approximate and centered on the city."
        );
        setTargetCenter([37.7749, -122.4194]);
        setTargetZoom(12);
        return;
      }
      if (PALO_ALTO_ZIPCODES.has(zip)) {
        setSearchNotice("Palo Alto ZIP search is approximate.");
        setTargetCenter([37.4419, -122.143]);
        setTargetZoom(13);
        return;
      }
      if (MOUNTAIN_VIEW_ZIPCODES.has(zip)) {
        setSearchNotice("Mountain View ZIP search is approximate.");
        setTargetCenter([37.3861, -122.0839]);
        setTargetZoom(12);
        return;
      }
      if (BERKELEY_ZIPCODES.has(zip)) {
        setSearchNotice("Berkeley ZIP search is approximate.");
        setTargetCenter([37.8715, -122.273]);
        setTargetZoom(13);
        return;
      }
      setSearchNotice(
        "Zipcode search outside San Francisco is work in progress."
      );
      return;
    }
    console.info("event:location_search", {
      query: locationQuery,
      keyword,
      radius,
    });
    if (lastMove) {
      loadCompaniesForBbox(lastMove);
    }
  };

  const handleSearchArea = () => {
    console.info("event:search_area", lastMove);
    setHasMoved(false);
    if (lastMove) {
      loadCompaniesForBbox(lastMove);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    console.info("event:pin_click", { id: company.id, name: company.name });
  };

  const handleOutboundClick = (company: Company) => {
    const outboundUrl = company.careers_url || company.website;
    if (!outboundUrl) {
      return;
    }
    console.info("event:outbound_click", {
      id: company.id,
      name: company.name,
    });
    window.open(outboundUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <section className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Bay Area map
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Explore tech companies by neighborhood
          </h1>
          <p className="text-sm text-slate-600">
            Pan and zoom to refresh results. Use keywords to focus on the exact
            slice you need.
          </p>
        </section>
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
        >
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Location
            </label>
            <input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="Search city or neighborhood"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            {searchNotice && (
              <p className="mt-2 text-xs font-semibold text-amber-700">
                {searchNotice}
              </p>
            )}
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Search
            </button>
            <div className="hidden text-sm text-slate-500 md:block">
              {companyCount} companies
            </div>
          </div>
        </form>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-stretch">
          <aside className="flex h-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Filters
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Refine results
              </h2>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Keyword
              </label>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="e.g. product, design"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              />
              <select
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">Quick keywords</option>
                {keywordOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Radius
              </label>
              <select
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                {radiusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Move the map or search by keyword to refresh results. Zoom in to
              see individual companies.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Map legend
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full bg-slate-900" />
                <span>Company location</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  8
                </span>
                <span>Cluster count</span>
              </div>
            </div>
          </aside>
          <section className="relative min-h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:min-h-[620px]">
            <LeafletMap
              key={mapKey}
              companies={companies}
              onSelectCompany={handleSelectCompany}
              onMapMove={handleMapMove}
              initialCenter={initialCenter}
              initialZoom={initialZoom}
              targetCenter={targetCenter}
              targetZoom={targetZoom}
            />
            {hasMoved && (
              <button
                type="button"
                onClick={handleSearchArea}
                className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
              >
                Search this area
              </button>
            )}
            {isLoading && (
              <div className="absolute inset-0 z-[800] flex items-center justify-center bg-white/80 text-sm font-semibold text-slate-600">
                Loading companies...
              </div>
            )}
            {!isLoading && companies.length === 0 && (
              <div className="absolute inset-0 z-[800] flex items-center justify-center bg-white/90 text-sm font-semibold text-slate-600">
                No companies in this area
              </div>
            )}
          </section>
        </div>
      </div>
      {selectedCompany && (
        <div
          className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/30 md:items-stretch md:justify-end"
          onClick={() => setSelectedCompany(null)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-6 shadow-xl md:h-full md:w-[360px] md:rounded-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Company details
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {selectedCompany.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {selectedCompany.address}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCompany.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            {selectedCompany.careers_url || selectedCompany.website ? (
              <button
                type="button"
                onClick={() => handleOutboundClick(selectedCompany)}
                className="mt-6 w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                {selectedCompany.careers_url ? "Open careers page" : "Open website"}
              </button>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Website link is in progress for this company.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
