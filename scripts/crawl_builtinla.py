import argparse
import json
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

BASE_LIST_URL = "https://www.builtinla.com/companies"
API_BASE_URL = "https://api.builtin.com/companies"


def fetch_text(url: str) -> str:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req) as response:
        return response.read().decode("utf-8", errors="ignore")


def fetch_json(url: str) -> Dict[str, Any]:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def parse_company_cards(html: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(".company-card-horizontal")
    results = []
    for card in cards:
        overlay = card.select_one("a.company-card-overlay")
        if not overlay:
            continue
        company_id = overlay.get("data-company-id")
        profile_href = overlay.get("href")
        name_el = card.select_one("h2")
        tags_el = card.select_one(".company-info-section .text-gray-04")
        if not company_id or not name_el:
            continue
        tag_text = tags_el.get_text(" ", strip=True) if tags_el else ""
        tags = [t.strip() for t in tag_text.split("\u2022") if t.strip()]
        results.append(
            {
                "company_id": company_id,
                "name": name_el.get_text(strip=True),
                "profile_url": urljoin(BASE_LIST_URL, profile_href)
                if profile_href
                else None,
                "tags": tags,
            }
        )
    return results


def enrich_company(company: Dict[str, Any]) -> Dict[str, Any]:
    company_id = company["company_id"]
    overview_url = f"{API_BASE_URL}/{company_id}/overview"
    overview = fetch_json(overview_url)
    website = overview.get("url")
    industries = overview.get("industries") or []
    raw_tags = company.get("tags") or []
    if industries:
        tags = industries
    else:
        tags = raw_tags
    careers_url = f"https://www.builtinla.com/jobs?companyId={company_id}"
    return {
        **company,
        "website": website,
        "careers_url": careers_url,
        "tags": tags,
        "source": "built-in-la",
    }


def crawl(limit: int, delay: float) -> List[Dict[str, Any]]:
    results: Dict[str, Dict[str, Any]] = {}
    page = 1
    while len(results) < limit:
        url = f"{BASE_LIST_URL}?country=USA&page={page}"
        html = fetch_text(url)
        companies = parse_company_cards(html)
        if not companies:
            break
        for company in companies:
            if company["company_id"] in results:
                continue
            results[company["company_id"]] = company
            if len(results) >= limit:
                break
        page += 1
        time.sleep(delay)
    enriched: List[Dict[str, Any]] = []
    for company in list(results.values())[:limit]:
        enriched.append(enrich_company(company))
        time.sleep(delay)
    return enriched


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crawl Built In LA companies and output raw JSON."
    )
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--delay", type=float, default=0.4)
    parser.add_argument("--output", default="data/companies_raw.json")
    args = parser.parse_args()

    companies = crawl(args.limit, args.delay)
    output_path = args.output
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(companies, handle, ensure_ascii=False, indent=2)

    print(f"Saved {len(companies)} companies to {output_path}")


if __name__ == "__main__":
    main()
