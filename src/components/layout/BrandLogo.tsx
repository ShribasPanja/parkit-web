"use client";

import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  textClassName?: string;
  taglineClassName?: string;
};

// Shared brand lockup for all navbars to keep logo and wordmark consistent.
export function BrandLogo({
  size = 44,
  showTagline = false,
  tagline = "Find & Reserve Parking",
  className = "",
  textClassName = "",
  taglineClassName = "",
}: BrandLogoProps) {
  const container = ["flex items-center gap-3", className]
    .filter(Boolean)
    .join(" ");
  const titleClasses = [
    "block text-lg md:text-xl font-bold tracking-tight text-slate-900",
    textClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const taglineClasses = [
    "hidden md:block text-xs text-slate-500 font-medium",
    taglineClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={container}>
      <Image
        src="/logo.png"
        alt="Parkit logo"
        width={size}
        height={size}
        className="rounded-xl object-cover shadow-sm"
        priority
      />
      <div className="leading-tight">
        <span className={titleClasses}>Parkit</span>
        {showTagline ? <span className={taglineClasses}>{tagline}</span> : null}
      </div>
    </div>
  );
}
