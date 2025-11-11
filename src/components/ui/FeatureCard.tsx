type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg shadow-slate-200/70 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-emerald-100">
      <span className="text-3xl sm:text-4xl" aria-hidden>
        {icon}
      </span>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-emerald-100/50 via-transparent to-transparent" />
    </div>
  );
}
