const steps = [
  {
    title: "Search",
    description:
      "Enter a neighbourhood and filter for chargers, covered spots, or overnight stays. Live Google Maps data keeps everything accurate.",
  },
  {
    title: "Book or host",
    description:
      "Reserve instantly with saved payment methods, or list your driveway with flexible pricing and availability controls.",
  },
  {
    title: "Arrive happy",
    description:
      "Navigate with turn-by-turn Google Maps directions, quick re-routes, and friendly reminders for both guests and hosts.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden bg-slate-50 py-24 sm:py-32"
    >
      <div
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center text-slate-900">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Three friendly steps from search to arrival.
          </h2>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Parkit removes the stress from urban parking. Guests discover
            trusted spaces, while hosts earn effortlessly with built-in
            guidance.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-lg shadow-slate-200/70 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-emerald-100"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-lg font-semibold text-emerald-700">
                0{index + 1}
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-100/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
