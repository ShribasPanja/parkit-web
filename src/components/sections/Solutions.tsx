const solutions = [
  {
    title: "For guests",
    points: [
      "Discover verified hosts with transparent reviews",
      "Filter by chargers, security, height limits, or overnight",
      "Save favourites and sync bookings with your calendar",
    ],
  },
  {
    title: "For hosts",
    points: [
      "Set your own availability and instant-book rules",
      "Automated guest messaging and payouts within 24 hours",
      "Insurance and support teams included with every stay",
    ],
  },
  {
    title: "For teams",
    points: [
      "Share fleet routes with live charger recommendations",
      "Export analytics on dwell times and utilisation",
      "Integrate with dispatch systems via our open API",
    ],
  },
];

export function SolutionsSection() {
  return (
    <section
      id="solutions"
      className="relative isolate overflow-hidden bg-white py-24 sm:py-32"
    >
      <div
        className="absolute inset-x-0 top-0 h-56 -translate-y-1/2 rounded-full bg-emerald-100/60 blur-3xl"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-6 text-slate-900">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for guests, hosts, and mobility teams alike.
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              Parkit gives drivers a warm welcome, empowers hosts to earn with
              confidence, and provides fleets with the data they need to stay on
              schedule.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-lg shadow-slate-200/70">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Seamless payouts
                </span>
                <p className="mt-3 text-base text-slate-900">
                  Hosts receive bank transfers 24 hours after checkout with
                  automatic receipts for every guest.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-lg shadow-slate-200/70">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Open platform
                </span>
                <p className="mt-3 text-base text-slate-900">
                  Use Parkit’s API to embed bookings, sync calendars, or power
                  smart-city dashboards in minutes.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {solutions.map((solution) => (
              <div
                key={solution.title}
                className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/70 to-white p-6 text-slate-900 shadow-lg shadow-slate-200/70"
              >
                <h3 className="text-lg font-semibold tracking-tight">
                  {solution.title}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {solution.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span
                        className="mt-1 h-2 w-2 rounded-full bg-emerald-400"
                        aria-hidden
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
