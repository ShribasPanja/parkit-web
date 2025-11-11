type StatChipProps = {
  label: string;
  value: string;
};

export function StatChip({ label, value }: StatChipProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg shadow-slate-200/70 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-emerald-100">
      <span className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {value}
      </span>
      <span className="mt-2 text-sm text-slate-500">{label}</span>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-200/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
