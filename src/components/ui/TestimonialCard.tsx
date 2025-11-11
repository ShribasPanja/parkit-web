type TestimonialCardProps = {
  quote: string;
  name: string;
  role: string;
};

export function TestimonialCard({ quote, name, role }: TestimonialCardProps) {
  return (
    <figure className="relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/80 to-white p-8 text-slate-900 shadow-xl shadow-slate-200/70">
      <p className="text-lg leading-relaxed text-slate-700 sm:text-xl">
        “{quote}”
      </p>
      <figcaption className="mt-auto text-sm">
        <span className="font-semibold text-slate-900">{name}</span>
        <span className="block text-slate-500">{role}</span>
      </figcaption>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-emerald-100 via-transparent to-transparent" />
    </figure>
  );
}
