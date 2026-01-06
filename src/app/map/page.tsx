"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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

const radiusOptions = [
  { label: "5 miles", value: "5" },
  { label: "10 miles", value: "10" },
  { label: "20 miles", value: "20" },
  { label: "35 miles", value: "35" },
];

export default function MapPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [radius, setRadius] = useState("20");
  const [locationQuery, setLocationQuery] = useState("Los Angeles, CA");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastMove, setLastMove] = useState<MapMovePayload | null>(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/companies?limit=50");
        const json = await response.json();
        setCompanies(json.data ?? []);
      } catch (error) {
        console.error("Failed to load companies", error);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const companyCount = useMemo(() => companies.length, [companies]);

  const loadCompaniesForBbox = async (payload: MapMovePayload) => {
    const { bounds } = payload;
    const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    const url = new URL("/api/companies", window.location.origin);
    url.searchParams.set("bbox", bbox);
    url.searchParams.set("limit", "200");
    if (keyword.trim()) {
      url.searchParams.set("q", keyword.trim());
    }
    try {
      setIsLoading(true);
      const response = await fetch(url.toString());
      const json = await response.json();
      setCompanies(json.data ?? []);
    } catch (error) {
      console.error("Failed to load companies", error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!lastMove) return undefined;
    const handle = window.setTimeout(() => {
      loadCompaniesForBbox(lastMove);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [lastMove, keyword]);

  const handleMapMove = (payload: MapMovePayload) => {
    if (!lastMove) {
      setLastMove(payload);
      return;
    }

    setHasMoved(true);
    setLastMove(payload);
    console.info("event:map_moved", payload);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6">
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
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
            <div className="hidden text-sm text-slate-500 md:block">
              {companyCount} companies
            </div>
          </div>
        </form>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Filters are wired for state only in phase 0.
            </div>
          </aside>
          <section className="relative h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <LeafletMap
              companies={companies}
              onSelectCompany={handleSelectCompany}
              onMapMove={handleMapMove}
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
                className="mt-6 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {selectedCompany.careers_url ? "Open careers page" : "Open website"}
              </button>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No careers or website link available for this company yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
