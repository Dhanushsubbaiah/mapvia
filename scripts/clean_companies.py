import argparse
import csv
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote_plus, urlparse
from urllib.request import Request, urlopen

LA_BBOX = (-118.7, 33.7, -118.1, 34.4)


def normalize_name(name: str) -> str:
    lowered = name.lower()
    lowered = re.sub(r"[^\w\s]", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    suffixes = [
        "inc",
        "llc",
        "ltd",
        "corp",
        "corporation",
        "company",
        "co",
        "incorporated",
    ]
    for suffix in suffixes:
        lowered = re.sub(rf"\b{suffix}\b", "", lowered).strip()
    lowered = re.sub(r"\s+", " ", lowered).strip()
    return lowered


def clean_url(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return value
    return None


def geocode(query: str) -> Optional[Dict[str, str]]:
    encoded_query = quote_plus(query)
    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?q={encoded_query}&format=json&limit=1"
    )
    req = Request(url, headers={"User-Agent": "mapvia/0.1 (data crawl)"})
    with urlopen(req) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not payload:
        return None
    return payload[0]


def in_bbox(lat: float, lng: float, bbox: Tuple[float, float, float, float]) -> bool:
    min_lng, min_lat, max_lng, max_lat = bbox
    return min_lat <= lat <= max_lat and min_lng <= lng <= max_lng


def load_raw(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_csv(path: Path, rows: List[Dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "name",
        "address",
        "city",
        "state",
        "website",
        "careers_url",
        "tags",
        "lat",
        "lng",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean + geocode company data.")
    parser.add_argument("--input", default="data/companies_raw.json")
    parser.add_argument("--output", default="data/companies_clean.csv")
    parser.add_argument("--failures", default="data/geocode_failures.csv")
    parser.add_argument("--cache", default="data/geocode_cache.json")
    parser.add_argument("--delay", type=float, default=1.0)
    parser.add_argument("--bbox", default=",".join(str(x) for x in LA_BBOX))
    parser.add_argument("--no-geocode", action="store_true")
    args = parser.parse_args()

    bbox_parts = [float(x) for x in args.bbox.split(",")]
    bbox = (bbox_parts[0], bbox_parts[1], bbox_parts[2], bbox_parts[3])

    raw = load_raw(Path(args.input))
    deduped: Dict[str, Dict[str, str]] = {}
    for item in raw:
        name = item.get("name", "").strip()
        if not name:
            continue
        key = normalize_name(name)
        if key in deduped:
            continue
        deduped[key] = item

    cache_path = Path(args.cache)
    cache: Dict[str, Dict[str, str]] = {}
    if cache_path.exists():
        cache = json.loads(cache_path.read_text(encoding="utf-8"))

    rows: List[Dict[str, str]] = []
    failures: List[Dict[str, str]] = []
    for item in deduped.values():
        name = item.get("name", "").strip()
        website = clean_url(item.get("website"))
        careers_url = clean_url(item.get("careers_url"))
        tags = item.get("tags") or []
        if isinstance(tags, list):
            tags_value = "|".join(tag.strip() for tag in tags if tag.strip())
        else:
            tags_value = str(tags)

        city = "Los Angeles"
        state = "CA"
        address = ""
        lat = ""
        lng = ""

        if not args.no_geocode:
            query = f"{name}, {city}, {state}"
            if query in cache:
                result = cache[query]
            else:
                result = geocode(query)
                time.sleep(args.delay)
                cache[query] = result or {}

            if result:
                lat_val = float(result["lat"])
                lng_val = float(result["lon"])
                if not in_bbox(lat_val, lng_val, bbox):
                    failures.append(
                        {
                            "name": name,
                            "query": query,
                            "reason": "out_of_bbox",
                        }
                    )
                else:
                    address = result.get("display_name", "")
                    lat = f"{lat_val:.6f}"
                    lng = f"{lng_val:.6f}"
            else:
                failures.append(
                    {
                        "name": name,
                        "query": query,
                        "reason": "no_results",
                    }
                )

        rows.append(
            {
                "name": name,
                "address": address,
                "city": city,
                "state": state,
                "website": website or "",
                "careers_url": careers_url or "",
                "tags": tags_value,
                "lat": lat,
                "lng": lng,
            }
        )

    save_csv(Path(args.output), rows)
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

    failures_path = Path(args.failures)
    failures_path.parent.mkdir(parents=True, exist_ok=True)
    with failures_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "query", "reason"])
        writer.writeheader()
        writer.writerows(failures)

    print(f"Saved {len(rows)} rows to {args.output}")
    print(f"Logged {len(failures)} failures to {args.failures}")


if __name__ == "__main__":
    main()
