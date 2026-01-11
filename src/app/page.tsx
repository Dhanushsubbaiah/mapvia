import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import HomeGlobe from "@/components/HomeGlobe";
import FeedbackForm from "@/components/FeedbackForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 sm:py-16">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/80 p-8 shadow-sm sm:p-10">
          <div className="pointer-events-none absolute inset-0 hero-sheen" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Bay Area tech map
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] text-slate-900 md:text-5xl lg:text-6xl">
                Discover Bay Area tech companies{" "}
                <span className="text-emerald-700">on a living map</span>.
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                Mapvia lets you scan neighborhoods, spot hiring clusters, and
                jump straight to official company websites.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Explore the map
                </Link>
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Browse companies
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Tech companies", value: "800+" },
                  { label: "Website links", value: "750+" },
                  { label: "Bay Area hubs", value: "12+" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm"
                  >
                    <p className="text-lg font-semibold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative grid gap-6">
              <div className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Live snapshot
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  The Bay Area, clustered in minutes
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Move the map to reveal new clusters and verified links.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div className="grid place-items-center">
                  <HomeGlobe />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Neighborhood density",
                  "Verified locations",
                  "Fast outbound",
                  "Keyword filters",
                ].map((item) => (
                  <div
                    key={item}
                    className="animate-fade-up rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-slate-900">
              What you can do
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Scan tech density, validate locations, and jump directly to
              official websites without leaving the map.
            </p>
            <div className="mt-6 grid gap-4">
              {[
                {
                  title: "Neighborhood scouting",
                  body: "Compare hiring clusters before you book meetings or tours.",
                },
                {
                  title: "Target list building",
                  body: "Exportable company context with clean links and tags.",
                },
                {
                  title: "Fast outbound",
                  body: "Open verified websites instantly to start outreach.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                Search-friendly by design
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Use keywords to zoom into the right industries fast.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "AI & ML",
                  "SaaS",
                  "Fintech",
                  "Healthcare",
                  "Climate",
                  "Developer tools",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                Explore real neighborhoods
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Compare hiring density in SOMA, Palo Alto, South Bay, and
                Oakland.
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  { label: "SOMA / Mission Bay", key: "soma" },
                  { label: "Palo Alto", key: "palo-alto" },
                  { label: "Mountain View", key: "mountain-view" },
                  { label: "Berkeley", key: "berkeley" },
                ].map((place) => (
                  <Link
                    key={place.key}
                    href={`/map?area=${place.key}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    <span>{place.label}</span>
                    <span className="text-xs font-semibold text-emerald-700">
                      Explore
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Always map-first",
              body: "Keep location context as you search, filter, and explore.",
            },
            {
              title: "Official websites",
              body: "Outbound links go straight to verified company sites.",
            },
            {
              title: "Cleaner targeting",
              body: "Skip noisy lists and focus on high-density corridors.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-lg font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Built for real workflows
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Whether you are scouting a new market or building a target list,
              Mapvia keeps you in a map-first workflow.
            </p>
            <div className="mt-6 grid gap-4">
              {[
                {
                  title: "Founders & operators",
                  body: "Scan neighborhoods to benchmark company density and local competition.",
                },
                {
                  title: "Recruiters",
                  body: "Discover adjacent hubs and jump to official websites in one click.",
                },
                {
                  title: "Job seekers",
                  body: "Explore tech clusters and prioritize where to focus your outreach.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Data and coverage
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              A curated Bay Area tech dataset powers the map, normalized for
              consistent locations and links.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Companies indexed", value: "800+" },
                { label: "Website links", value: "750+" },
                { label: "Neighborhood hubs", value: "12+" },
                { label: "Updated", value: "Curated list" },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm"
                >
                  <p className="text-lg font-semibold text-slate-900">
                    {metric.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Share feedback
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Tell us what you want to see next. We read every note.
            </p>
            <div className="mt-6 grid gap-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                Suggest a new Bay Area hub to spotlight.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                Request a new filter or industry tag.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                Report a company link that needs fixing.
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <FeedbackForm />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-900">
                Questions teams ask
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Short answers to common questions about Mapvia.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                {
                  q: "Is this live data?",
                  a: "Mapvia starts from a curated tech list and normalizes links for quick outbound.",
                },
                {
                  q: "Can I search by niche?",
                  a: "Yes. Keyword filters let you narrow down by industry or focus area.",
                },
                {
                  q: "Do you store job posts?",
                  a: "No. We link you directly to official company websites.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.a}</p>
                </div>
              ))}
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Have a question we missed? Send feedback below and we will add
                it to the FAQ.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-emerald-900">
              Ready to explore the Bay Area tech map?
            </h2>
            <p className="mt-2 text-sm text-emerald-800">
              Discover where companies cluster and find official websites in
              seconds.
            </p>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Open Mapvia
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-white px-6 py-3 text-sm font-semibold text-emerald-800"
            >
              Start searching
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
