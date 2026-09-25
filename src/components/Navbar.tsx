"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type User = {
  id?: number | string;
  fullName?: string;
  email?: string;
  role?: string | { name?: string };
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Read auth state on mount AND whenever the route changes
  useEffect(() => {
    function readAuth() {
      try {
        const raw = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        setUser(token && raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    }
    readAuth();
    setHydrated(true);
    // re-check when navigating
  }, [pathname]);

  // Also listen for storage changes (login/logout in another tab)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "token" || e.key === "user") {
        const raw = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        setUser(token && raw ? JSON.parse(raw) : null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.name ?? "";

  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900">
              Self<span className="text-indigo-600">Storage</span>
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/locations" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Locations
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/support" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Support
            </Link>

            {hydrated && user && (
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Dashboard
              </Link>
            )}

            {hydrated && (roleName === "STAFF" || roleName === "ADMIN") && (
              <Link
                href="/staff"
                className="text-sm font-semibold text-[#4f39f6] hover:text-[#432fe0] transition-colors flex items-center gap-1"
              >
                Staff Portal
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Don't render auth-dependent UI until we've read localStorage,
                otherwise you get a flash of "Login" on every page load */}
            {!hydrated ? (
              <div className="w-20 h-9" /> // placeholder to avoid layout shift
            ) : user ? (
              <>
                <span className="hidden md:block text-sm font-medium text-slate-600">
                  Hi, {user.fullName?.split(" ")[0] || user.email || "there"}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>
            )}

            <Link
              href="/locations"
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-sm hover:shadow-md"
            >
              Book a Unit
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}