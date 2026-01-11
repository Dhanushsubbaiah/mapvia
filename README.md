# Mapvia

Map-first discovery for Bay Area tech companies. This prototype includes an
interactive globe landing page, a Leaflet-based map view with clustered pins,
and a company detail drawer with outbound website links.

## Features
- Landing page with interactive 3D globe
- Map view with pins, clustering, and detail drawer
- Bay Area tech company dataset with website links
- Keyword filtering from company tags
- API endpoint for companies with bbox + keyword + tag filtering

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Leaflet + React-Leaflet
- globe.gl + three.js

## Data Pipeline
- Source CSV: `data/Bay-Area-Companies-List.csv`
- Parsed into the API response shape in `src/app/api/companies/route.ts`

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
- Data is sourced from a curated Bay Area tech list and may be incomplete.
- Website links are best-effort and should be validated.
