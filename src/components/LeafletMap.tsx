"use client";

import { useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Company } from "@/lib/types";


type MapMovePayload = {
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  zoom: number;
};

type LeafletMapProps = {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onMapMove: (payload: MapMovePayload) => void;
};

type MarkerItem =
  | {
      type: "company";
      company: Company;
    }
  | {
      type: "cluster";
      id: string;
      lat: number;
      lng: number;
      count: number;
      companies: Company[];
    };

const clusterCompanies = (companies: Company[], zoom: number): MarkerItem[] => {
  if (zoom >= 12) {
    return companies.map((company) => ({ type: "company", company }));
  }

  const gridSize = zoom <= 9 ? 0.2 : zoom <= 10 ? 0.12 : 0.07;
  const clusters = new Map<string, Company[]>();

  companies.forEach((company) => {
    const latKey = Math.round(company.lat / gridSize);
    const lngKey = Math.round(company.lng / gridSize);
    const key = `${latKey}:${lngKey}`;
    const bucket = clusters.get(key) ?? [];
    bucket.push(company);
    clusters.set(key, bucket);
  });

  const items: MarkerItem[] = [];

  clusters.forEach((bucket, key) => {
    if (bucket.length === 1) {
      items.push({ type: "company", company: bucket[0] });
      return;
    }

    const avgLat =
      bucket.reduce((sum, company) => sum + company.lat, 0) / bucket.length;
    const avgLng =
      bucket.reduce((sum, company) => sum + company.lng, 0) / bucket.length;

    items.push({
      type: "cluster",
      id: `cluster-${key}`,
      lat: avgLat,
      lng: avgLng,
      count: bucket.length,
      companies: bucket,
    });
  });

  return items;
};

function MapEvents({
  onMapMove,
  onZoomChange,
}: {
  onMapMove: LeafletMapProps["onMapMove"];
  onZoomChange: (zoom: number) => void;
}) {
  const skipMoveEvent = useRef(false);
  const map = useMapEvents({
    moveend: () => {
      if (skipMoveEvent.current) {
        skipMoveEvent.current = false;
        return;
      }
      const center = map.getCenter();
      const bounds = map.getBounds();
      onMapMove({
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        zoom: map.getZoom(),
      });
    },
    zoomend: () => {
      onZoomChange(map.getZoom());
      const center = map.getCenter();
      const bounds = map.getBounds();
      skipMoveEvent.current = true;
      onMapMove({
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        zoom: map.getZoom(),
      });
    },
  });

  return null;
}

function ClusterMarker({
  lat,
  lng,
  count,
}: {
  lat: number;
  lng: number;
  count: number;
}) {
  const map = useMap();
  const icon = useMemo(
    () =>
      L.divIcon({
        html: `<div class="cluster-marker"><span>${count}</span></div>`,
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    [count]
  );

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          map.setView([lat, lng], Math.min(map.getZoom() + 2, 14));
        },
      }}
    />
  );
}

function CompanyMarker({
  lat,
  lng,
  name,
  onClick,
}: {
  lat: number;
  lng: number;
  name: string;
  onClick: () => void;
}) {
  return (
    <CircleMarker
      center={[lat, lng]}
      radius={6}
      pathOptions={{
        color: "#0f172a",
        fillColor: "#0f172a",
        fillOpacity: 0.85,
        weight: 2,
      }}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-slate-900">{name}</p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function LeafletMap({
  companies,
  onSelectCompany,
  onMapMove,
}: LeafletMapProps) {
  const [zoom, setZoom] = useState(11);

  const items = useMemo(
    () => clusterCompanies(companies, zoom),
    [companies, zoom]
  );

  return (
    <MapContainer
      center={[34.0522, -118.2437]}
      zoom={11}
      minZoom={9}
      maxZoom={17}
      preferCanvas
      zoomSnap={0.5}
      zoomDelta={0.5}
      wheelDebounceTime={80}
      wheelPxPerZoomLevel={120}
      inertia
      inertiaDeceleration={3000}
      inertiaMaxSpeed={1500}
      zoomAnimation
      fadeAnimation
      markerZoomAnimation
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onMapMove={onMapMove} onZoomChange={setZoom} />
      {items.map((item) => {
        if (item.type === "cluster") {
          return (
            <ClusterMarker
              key={item.id}
              lat={item.lat}
              lng={item.lng}
              count={item.count}
            />
          );
        }
        return (
          <CompanyMarker
            key={item.company.id}
            lat={item.company.lat}
            lng={item.company.lng}
            name={item.company.name}
            onClick={() => onSelectCompany(item.company)}
          />
        );
      })}
    </MapContainer>
  );
}
