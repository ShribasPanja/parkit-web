"use client";

import { MapNavbar } from "./MapNavbar";

interface CommonLayoutProps {
  children: React.ReactNode;
}

export function CommonLayout({ children }: CommonLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <MapNavbar />
      <main>{children}</main>
    </div>
  );
}
