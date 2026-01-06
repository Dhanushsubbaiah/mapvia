# Mapvia

Map-first job discovery for Los Angeles tech companies. This prototype
includes an interactive globe landing page, a Leaflet-based map view with
real company pins from OpenStreetMap, clustering, and a company detail drawer.

## Features
- Landing page with interactive 3D globe
- Map view with pins, clustering, and detail drawer
- Real company data via OpenStreetMap (Overpass API)
- Careers link enrichment (scraped from company sites)
- API endpoint for companies with bbox + keyword + tag filtering

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Leaflet + React-Leaflet
- globe.gl + three.js

## Data Pipeline
- Overpass crawl: `scripts/crawl_osm_overpass.py`
- Careers link enrichment: `scripts/enrich_careers_links.py`
- Output CSV: `data/osm_companies.csv`

## Local Development
```bash
npm install
npm run dev
```

## API
`GET /api/companies` supports:
- `bbox=minLng,minLat,maxLng,maxLat`
- `q=keyword`
- `tags=tag1,tag2`
- `limit` and `cursor`

## Notes
- Data is sourced from OpenStreetMap and may be incomplete.
- Careers links are best-effort and should be validated.
