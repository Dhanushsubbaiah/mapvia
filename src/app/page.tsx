import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import HomeGlobe from "@/components/HomeGlobe";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-12 sm:py-16">
        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-12">
          <div className="space-y-6">
            <h1 className="max-w-[18ch] text-4xl font-semibold leading-[1.05] text-slate-900 md:text-5xl lg:text-6xl">
              A map-first way to discover real tech teams in Los Angeles.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              Mapvia highlights open roles around you, clusters dense hiring
              corridors, and lets you jump straight to verified career pages.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/map"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open the map
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Join the waitlist
              </button>
            </div>
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Live filters
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Search by keyword and radius, then refine results without
                  leaving the map.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Real-time map
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Move the map to load new companies and see clusters collapse
                  into individual pins.
                </p>
              </div>
            </div>
          </div>
          <div className="relative min-h-[480px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.12),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.12),transparent_60%)]" />
            <div className="relative grid gap-6">
              <div className="rounded-2xl bg-slate-100/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Live snapshot
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Real companies, mapped in seconds
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Built for fast location scouting across the LA tech ecosystem.
                </p>
              </div>
              <div className="grid place-items-center">
                <HomeGlobe />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Map-first browsing",
                  "Clustering at a glance",
                  "Quick career links",
                  "Saved searches",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-3">
          {[
            {
              title: "Pinpoint radius",
              body: "Use a flexible radius filter to focus on specific neighborhoods.",
            },
            {
              title: "Signals over noise",
              body: "Surface relevant tags without overwhelming long lists.",
            },
            {
              title: "Fast outbound",
              body: "Jump directly to career pages with a single click.",
            },
          ].map((card) => (
            <div key={card.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="text-sm text-slate-600">{card.body}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              Why a map-first job search-
            </h2>
            <p className="text-sm text-slate-600">
              Most job boards bury location context. Mapvia keeps geography
              front and center so you can compare commute distance, discover
              new neighborhoods, and decide where to focus outreach.
            </p>
            <ul className="grid gap-2 text-sm text-slate-600">
              <li>Instant map clustering for quick density checks.</li>
              <li>Company drawer with tags and direct outbound links.</li>
              <li>Search-this-area interactions for new territory scouting.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Built for hiring now
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Verified company data, enriched links, and location-aware
              filtering so you can prioritize outreach fast.
            </p>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <div>- Data sourced from live company directories.</div>
              <div>- Enriched careers links for quick outbound.</div>
              <div>- Saved searches and alerts.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
