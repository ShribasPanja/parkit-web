"use client";

import Image from "next/image";

import { SearchForm } from "@/components/forms/SearchForm";
import { StatChip } from "@/components/ui/StatChip";

const stats = [
  { label: "Verified hosts", value: "12K+" },
  { label: "EV-ready spots", value: "320K" },
  { label: "Guest rating", value: "4.8/5" },
];

export function HeroSection() {
  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 h-screen"
      id="top"
    >
      <div className="absolute inset-0 -z-20">
        <Image
          src="/image.png"
          alt="Illustrated city map showing parking and charging icons"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-sky-100/65"
          aria-hidden
        />
      </div>
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-white/60 to-transparent" />
      <div className="absolute -right-20 top-24 -z-10 hidden h-72 w-72 rounded-full bg-emerald-100 blur-3xl lg:block" />
      <div className="absolute -left-24 bottom-0 -z-10 hidden h-64 w-64 rounded-full bg-sky-100 blur-3xl lg:block" />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20 pt-10 sm:pb-24 sm:pt-16 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-8 text-slate-900">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600 shadow-sm shadow-emerald-100">
              Parking made personal
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Find and host parking spots you will love.
            </h1>
            <p className="max-w-xl text-base text-slate-600 sm:text-lg">
              Parkit feels like Airbnb for your EV or bike. Explore welcoming
              driveways, book secure chargers, or unlock extra income by hosting
              your own space—all with Google Maps built in.
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/90 text-xs font-semibold text-white shadow-lg shadow-emerald-100/60">
                    LC
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-lg shadow-slate-300/60">
                    MS
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/90 text-xs font-semibold text-white shadow-lg shadow-sky-200/60">
                    IR
                  </span>
                </div>
                <span>Trusted by 200K+ guests & hosts worldwide</span>
              </div>
            </div>
          </div>
          <SearchForm />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <StatChip key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  );
}
