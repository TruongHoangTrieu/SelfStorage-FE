"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Phone, ChevronDown, User, LogOut, Menu, X, ShieldCheck } from "lucide-react";

type UserType = {
  id?: number | string;
  fullName?: string;
  email?: string;
  role?: string | { name?: string };
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"VI" | "EN">("VI");

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
  }, [pathname]);

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

  const navLinks = [
    { label: "Dịch Vụ", href: "/#services" },
    { label: "B2B", href: "/#b2b" },
    { label: "Địa Điểm Kho", href: "/#locations" },
    { label: "Về Chúng Tôi", href: "/#how-it-works" },
    { label: "Xem giá", href: "/locations" },
    { label: "Liên Hệ", href: "/#contact" },
    { label: "Theo dõi ngay", href: "/#reviews" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/98 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      <div className="w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between xl:justify-center xl:gap-5 2xl:gap-6 h-20">
          
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="inline-flex items-center group">
              <img
                src="/logo.png"
                alt="SelfStorage Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center text-[15px] font-semibold text-slate-800 shrink-0">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}

            {hydrated && user && (
              <Link
                href="/dashboard"
                className="px-2.5 py-1.5 rounded-lg text-indigo-600 font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Kho Của Tôi
              </Link>
            )}

            {hydrated && (roleName === "STAFF" || roleName === "ADMIN") && (
              <Link
                href="/staff"
                className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 font-bold text-xs hover:bg-purple-200 transition whitespace-nowrap"
              >
                Staff Portal
              </Link>
            )}
          </nav>

          {/* Right Action Items: Language, Phone, Auth, CTA Button */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Language Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="text-base">{currentLang === "VI" ? "🇻🇳" : "🇬🇧"}</span>
                <span>{currentLang}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs font-semibold animate-in fade-in">
                  <button
                    onClick={() => { setCurrentLang("VI"); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 ${currentLang === "VI" ? "text-blue-600 font-bold" : "text-slate-700"}`}
                  >
                    <span>🇻🇳</span> Tiếng Việt
                  </button>
                  <button
                    onClick={() => { setCurrentLang("EN"); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 ${currentLang === "EN" ? "text-blue-600 font-bold" : "text-slate-700"}`}
                  >
                    <span>🇬🇧</span> English
                  </button>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <a
                href="tel:02877700117"
                className="text-[15px] font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span>028 7770 0117</span>
              </a>
            </div>

            {/* Auth status if logged in */}
            {hydrated && user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-24 truncate">{user.fullName || user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : hydrated && !user ? (
              <div>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 px-2 py-1.5 transition whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
              </div>
            ) : null}

            {/* Orange CTA Pill Button */}
            <div>
              <Link
                href="/locations"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-black text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 transition-all uppercase tracking-wide whitespace-nowrap"
              >
                ĐẶT KHO NGAY
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-2">
            <a
              href="tel:02877700117"
              className="text-xs font-bold text-blue-600 flex items-center gap-1 mr-1"
            >
              <Phone className="w-3.5 h-3.5" />
              028 7770 0117
            </a>
            <Link
              href="/locations"
              className="px-4 py-2 rounded-full text-xs font-black text-white bg-orange-500 shadow-sm uppercase tracking-wider"
            >
              ĐẶT KHO
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition ml-1"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-1 shadow-xl animate-slide-up-fade">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/locations"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-full bg-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-md"
            >
              ĐẶT KHO NGAY
            </Link>
            {user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                <Link href="/dashboard" className="text-sm font-semibold text-blue-600">
                  Tài khoản ({user.fullName || user.email})
                </Link>
                <button onClick={handleLogout} className="text-xs text-rose-600 font-bold">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50"
              >
                Đăng Nhập Khách Hàng
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}