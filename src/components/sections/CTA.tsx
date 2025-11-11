export function CTASection() {
  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-100 via-white to-sky-50 py-24"
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.35),_transparent_55%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-5xl px-6 text-center text-slate-900 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
          Ready when you are
        </span>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Start parking or hosting with Parkit today.
        </h2>
        <p className="mt-4 text-sm text-slate-600 sm:text-base">
          Join thousands of neighbours, travellers, and teams who rely on Parkit
          for stress-free parking and welcoming hosting experiences.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:hello@parkit.io"
            className="inline-flex items-center rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-emerald-200/80 transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            Become a host
          </a>
          <a
            href="#features"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            Find parking
          </a>
        </div>
      </div>
    </section>
  );
}
