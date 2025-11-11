"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LoginModal } from "../modals/LoginModal";
import { BecomeHostModal } from "../modals/BecomeHostModal";
import axios from "axios";

export function MapNavbar() {
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
      <nav className="z-30 relative border-b border-slate-200/50 bg-white/95 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 md:py-4">
          {/* Left - Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <svg
                  className="h-5 w-5 md:h-6 md:w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-tight">
                <span className="text-slate-900">Park</span>
                <span className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  it
                </span>
              </h1>
              <p className="hidden md:block text-xs text-slate-500 font-medium">
                Find & Reserve Parking
              </p>
            </div>
          </Link>

          {/* Right - User Menu */}
          <div className="flex items-center gap-4">
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
        </div>
      </nav>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <BecomeHostModal
        open={hostModalOpen}
        onClose={() => setHostModalOpen(false)}
      />
    </>
  );
}
