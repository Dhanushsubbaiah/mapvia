# Database Plan (Phase 0)

## Stack
- Postgres 15+
- PostGIS extension for geo queries

## Proposed Tables

### companies
Core table for companies with office or hiring location coordinates.

```sql
create extension if not exists postgis;

create table companies (
  id uuid primary key,
  name text not null,
  address text,
  careers_url text not null,
  tags text[] default '{}',
  location geography(point, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_location_gix on companies using gist (location);
create index companies_tags_gin on companies using gin (tags);
```

## Query Plan
- Bounding box search: `ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326)` + `ST_Intersects`
- Radius search: `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
- Keyword search: simple `ILIKE` on `name`, later full-text search

## API Contract Notes
- `bbox` expects `minLng,minLat,maxLng,maxLat`
- `q` used for keyword search
- `radius` in miles or meters (decide in phase 1)
- Pagination via `limit` + `cursor` (cursor encodes offset or last id)
