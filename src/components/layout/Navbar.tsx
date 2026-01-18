"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LoginModal } from "../modals/LoginModal";
import { BecomeHostModal } from "../modals/BecomeHostModal";
import axios from "axios";
import { BrandLogo } from "./BrandLogo";

const navItems: { label: string; href: string }[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Solutions", href: "#solutions" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { data: session, status } = useSession();

  // Check if user is a host
  useEffect(() => {
    const checkHostStatus = async () => {
      if (session?.accessToken) {
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
          const response = await axios.get(`${backendUrl}/landOwner/me`, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          setIsHost(response.data.isHost);
        } catch (error: unknown) {
          // Silently fail - user is not a host or backend is down
          console.debug(
            "Host status check:",
            axios.isAxiosError(error) ? error.response?.status : "failed"
          );
          setIsHost(false);
        }
      } else {
        setIsHost(false);
      }
    };

    checkHostStatus();
  }, [session?.accessToken]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="Parkit home">
            <BrandLogo size={40} />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-slate-200"></div>
          ) : session ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  {session.user.name?.[0]?.toUpperCase() ||
                    session.user.email[0].toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {session.user.name || session.user.email.split("@")[0]}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl shadow-slate-900/10 border border-slate-200">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/user/bookings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                  >
                    My Bookings
                  </Link>
                  {isHost ? (
                    <>
                      <Link
                        href="/host/bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        Manage Bookings
                      </Link>
                      <Link
                        href="/host/earnings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        Earnings
                      </Link>
                      <Link
                        href="/host/listings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        My Listings
                      </Link>
                      <Link
                        href="/host/reviews"
                        onClick={() => setUserMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        Reviews
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setHostModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                    >
                      Become a Host
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition mt-1 border-t border-slate-200 pt-3"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition hover:-translate-y-0.5 hover:bg-emerald-600"
              onClick={() => setLoginOpen(true)}
            >
              log in
            </button>
          )}
        </div>
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <BecomeHostModal
        open={hostModalOpen}
        onClose={() => setHostModalOpen(false)}
      />
    </>
  );
}
