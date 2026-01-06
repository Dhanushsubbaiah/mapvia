import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          Mapvia
        </span>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          Beta
        </span>
      </Link>
      <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <Link
          href="/map"
          className="rounded-full border border-slate-200 px-4 py-2 text-slate-900 transition hover:border-slate-900"
        >
          Explore map
        </Link>
      </nav>
    </header>
  );
}
