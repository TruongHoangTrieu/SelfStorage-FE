"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Phone,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Box,
  Settings,
  Bell,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type UserType = {
  id?: number | string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string | { name?: string };
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Sync auth state from localStorage and verify session with backend via /auth/me
  const verifySession = async () => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      setUser(null);
    }

    try {
      const me = await api.get("/auth/me");
      if (me && me.id) {
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } else {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("customer_user");
      }
    } catch {
      // Session expired or unauthenticated
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("customer_user");
    } finally {
      setHydrated(true);
    }
  };

  useEffect(() => {
    verifySession();
  }, [pathname]);

  // Listen to storage & custom auth-change events
  useEffect(() => {
    const handleAuthSync = () => {
      verifySession();
    };

    window.addEventListener("storage", handleAuthSync);
    window.addEventListener("auth-change", handleAuthSync);

    return () => {
      window.removeEventListener("storage", handleAuthSync);
      window.removeEventListener("auth-change", handleAuthSync);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    };

    if (userMenuOpen || notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen, notificationOpen]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Backend logout notice:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("customer_user");
      sessionStorage.clear();
      setUser(null);
      setUserMenuOpen(false);
      setNotificationOpen(false);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-change"));
      toast.success("Đã đăng xuất tài khoản thành công");
      window.location.href = "/";
    }
  };

  const roleName = (
    typeof user?.role === "string" ? user.role : user?.role?.name ?? ""
  ).toUpperCase();

  const isStaff =
    roleName === "STAFF" ||
    roleName === "FACILITY_STAFF" ||
    roleName === "OPERATIONS_STAFF" ||
    roleName === "FACILITY_MANAGER" ||
    roleName === "BUSINESS_OPERATIONS_MANAGER" ||
    roleName.includes("STAFF") ||
    roleName.includes("MANAGER");

  const isAdmin =
    roleName === "ADMIN" ||
    roleName === "SYSTEM_ADMINISTRATOR" ||
    roleName.includes("ADMIN");

  const isStaffOrAdmin = isStaff || isAdmin;
  const isStorageCustomer = Boolean(user && roleName === "STORAGE_CUSTOMER");
  // Chỉ khách vãng lai hoặc tài khoản STORAGE_CUSTOMER mới thấy các nút thuê kho
  const canRentStorage = !user || isStorageCustomer;

  const getRoleTheme = () => {
    if (roleName === "SYSTEM_ADMINISTRATOR" || roleName === "ADMIN") {
      return {
        label: "Quản Trị Viên",
        pillHover: "hover:border-rose-400",
        avatarGrad: "from-rose-600 to-red-600",
        badge: "bg-rose-100 text-rose-800 border border-rose-200",
        nameHover: "group-hover:text-rose-600",
      };
    }
    if (roleName === "BUSINESS_OPERATIONS_MANAGER" || roleName === "OPS") {
      return {
        label: "Quản Lý Chuỗi",
        pillHover: "hover:border-amber-400",
        avatarGrad: "from-amber-500 to-orange-600",
        badge: "bg-amber-100 text-amber-800 border border-amber-200",
        nameHover: "group-hover:text-amber-600",
      };
    }
    if (roleName === "FACILITY_MANAGER" || roleName === "MANAGER") {
      return {
        label: "Quản Lý Chi Nhánh",
        pillHover: "hover:border-indigo-400",
        avatarGrad: "from-indigo-600 to-purple-600",
        badge: "bg-indigo-100 text-indigo-800 border border-indigo-200",
        nameHover: "group-hover:text-indigo-600",
      };
    }
    if (isStaff) {
      return {
        label: "Nhân Viên Vận Hành",
        pillHover: "hover:border-emerald-400",
        avatarGrad: "from-emerald-600 to-teal-600",
        badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        nameHover: "group-hover:text-emerald-600",
      };
    }
    return {
      label: "Khách Hàng",
      pillHover: "hover:border-blue-400",
      avatarGrad: "from-blue-600 to-indigo-600",
      badge: "bg-blue-100 text-blue-700 border border-blue-200",
      nameHover: "group-hover:text-blue-600",
    };
  };

  const roleTheme = getRoleTheme();
  const getRoleBadgeLabel = () => roleTheme.label;

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "SS";
  };

  // Concise name for top navbar pill (prevents layout crowding)
  const getConciseName = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const words = name.trim().split(/\s+/);
      if (words.length > 2) {
        return words.slice(-2).join(" ");
      }
      return name;
    }
    if (email) {
      return email.split("@")[0];
    }
    return "Tài khoản";
  };

  // Optimized, non-redundant nav links
  const navLinks = [
    { label: "Dịch Vụ", href: "/#services" },
    { label: "Bảng Giá & Cơ Sở", href: "/locations" },
    { label: "Quy Trình Hoạt Động", href: "/#how-it-works" },
    { label: "Câu Hỏi Thường Gặp", href: "/#faq" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs transition-all">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20 sm:h-22 gap-4">
          
          {/* 1. BRAND LOGO (Anchored to the left) */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="inline-flex items-center group py-2">
              <img
                src="/logo.png"
                alt="SelfStorage Logo"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </Link>
          </div>

          {/* 2. MAIN NAVIGATION (Clean, non-redundant) */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2 text-[15px] font-semibold text-slate-700">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* 3. RIGHT ACTIONS (Hotline, Notifications, User Profile & CTA) */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            {/* Hotline Badge */}
            <a
              href="tel:02877700117"
              className="text-xs lg:text-[13px] font-bold text-slate-700 hover:text-blue-600 transition flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 border border-slate-100 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span className="tabular-nums">028 7770 0117</span>
            </a>

            {/* Notification Bell (Visible when logged in) */}
            {hydrated && user && (
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  aria-label="Thông báo tài khoản"
                  title="Thông báo tài khoản"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white animate-pulse" />
                </button>

                {/* Notifications Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-slide-up-fade">
                    <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        <span>Thông Báo Của Bạn</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Hệ thống 24/7
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Smart Key đã sẵn sàng</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Mã số PIN mở khóa cửa kho và cổng điện tử đã được kích hoạt trực tiếp trong mục Quản lý kho.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                        <div className="font-bold text-blue-900 flex items-center gap-1.5 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Hỗ trợ nhận đồ linh hoạt</span>
                        </div>
                        <p className="text-[11px] text-blue-700/80 leading-relaxed">
                          Bạn có thể điều khiển hoặc chia sẻ mã PIN cho người thân qua mục Thẻ Khách (Guest Pass).
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
                      <Link
                        href={isStaffOrAdmin ? "/staff" : "/dashboard"}
                        onClick={() => setNotificationOpen(false)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        {isStaffOrAdmin ? "Đến Cổng Nhân Viên →" : "Đến trang Quản lý kho →"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Pill & Dropdown */}
            {hydrated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 ${roleTheme.pillHover} bg-slate-50/80 hover:bg-white transition-all shadow-2xs group cursor-pointer focus:outline-hidden`}
                  aria-expanded={userMenuOpen}
                  aria-label="Thông tin tài khoản"
                >
                  {/* Avatar Circle with initials */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${roleTheme.avatarGrad} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 tracking-wider`}>
                    {getInitials(user.fullName, user.email)}
                  </div>

                  {/* Concise User Name */}
                  <div className="text-left hidden lg:block">
                    <div className={`text-xs font-bold text-slate-800 ${roleTheme.nameHover} transition-colors truncate max-w-[130px] xl:max-w-[150px] leading-tight`}>
                      {getConciseName(user.fullName, user.email)}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 z-50 animate-slide-up-fade">
                    {/* Full User Details Card */}
                    <div className="p-3.5 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 rounded-xl border border-slate-100 mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${roleTheme.avatarGrad} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 tracking-wider`}>
                          {getInitials(user.fullName, user.email)}
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate leading-snug">
                            {user.fullName || user.email?.split("@")[0] || "Tài khoản"}
                          </p>
                          <p className="text-xs text-slate-500 truncate leading-snug" title={user.email}>
                            {user.email}
                          </p>
                          <div className="mt-1">
                            <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${roleTheme.badge}`}>
                              {roleTheme.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="space-y-1 text-xs font-semibold text-slate-700">
                      {isStaffOrAdmin ? (
                        <>
                          {/* 1. Staff Portal - Primary for Staff */}
                          <Link
                            href="/staff"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-900 hover:bg-blue-100/70 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-blue-950 font-bold">Cổng Nhân Viên &amp; Quản Lý</div>
                              <div className="text-[10px] text-blue-700/80 font-normal">
                                Bàn giao kho, tiếp nhận khách &amp; vận hành
                              </div>
                            </div>
                          </Link>

                          {/* 2. Staff Profile & Password */}
                          <Link
                            href="/staff?tab=profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition"
                          >
                            <User className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="flex-1">
                              <div className="text-slate-900 font-bold">Hồ Sơ &amp; Đổi Mật Khẩu</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Xem thông tin nhân sự &amp; bảo mật tài khoản
                              </div>
                            </div>
                          </Link>

                          {/* 3. System Administrator if Admin */}
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-700 transition"
                            >
                              <Settings className="w-4 h-4 text-rose-600 shrink-0" />
                              <div className="flex-1">
                                <div className="text-slate-900 font-bold">Quản Trị Hệ Thống</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  Cấu hình tài chính &amp; phân quyền
                                </div>
                              </div>
                            </Link>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Customer Navigation */}
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition"
                          >
                            <Box className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-slate-900 font-bold">Kho Của Tôi</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Xem kho đang thuê &amp; Smart Key
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/dashboard?tab=profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition text-left cursor-pointer"
                          >
                            <User className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-slate-900 font-bold">Thông Tin Cá Nhân</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Cập nhật họ tên, SĐT &amp; mật khẩu
                              </div>
                            </div>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : hydrated && !user ? (
              <div>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
              </div>
            ) : null}

            {/* Smart Action Button (Dynamic CTA) - Chỉ hiện khi chưa đăng nhập hoặc là STORAGE_CUSTOMER */}
            {hydrated && canRentStorage && (
              <div>
                <Link
                  href="/locations"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs lg:text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 transition-all uppercase tracking-wider whitespace-nowrap"
                >
                  {user ? "THUÊ KHO MỚI" : "ĐẶT KHO NGAY"}
                </Link>
              </div>
            )}
          </div>

          {/* 4. MOBILE ACTIONS & DRAWER TOGGLE */}
          <div className="xl:hidden flex items-center gap-2">
            <a
              href="tel:02877700117"
              className="text-xs font-bold text-blue-600 flex items-center gap-1 mr-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">028 7770 0117</span>
            </a>

            {/* Mobile avatar shortcut */}
            {hydrated && user && (
              <Link
                href="/dashboard"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase tracking-wider"
                title={user.fullName || user.email}
              >
                {getInitials(user.fullName, user.email)}
              </Link>
            )}

            {hydrated && canRentStorage && (
              <Link
                href="/locations"
                className="px-3 sm:px-4 py-2 rounded-full text-xs font-black text-white bg-orange-500 shadow-sm uppercase tracking-wider"
              >
                ĐẶT KHO
              </Link>
            )}

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

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-slide-up-fade">
          {/* User Info Card in Drawer */}
          {hydrated && user ? (
            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 mb-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center uppercase shrink-0 shadow-xs tracking-wider">
                  {getInitials(user.fullName, user.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {user.fullName || user.email?.split("@")[0] || "Tài khoản"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{user.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {isStaffOrAdmin ? (
                  <>
                    <Link
                      href="/staff"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition shadow-xs"
                    >
                      Cổng Nhân Viên
                    </Link>
                    <Link
                      href="/staff?tab=profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Hồ Sơ Nhân Viên
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition shadow-xs"
                    >
                      Kho Của Tôi
                    </Link>
                    <Link
                      href="/dashboard?tab=profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Hồ Sơ Cá Nhân
                    </Link>
                  </>
                )}
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 px-3 text-center bg-white border border-rose-200 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-50 transition cursor-pointer"
                >
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50"
              >
                Đăng Nhập Khách Hàng
              </Link>
            </div>
          )}

          {/* Cleaned links in mobile */}
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

          {hydrated && isStaffOrAdmin && (
            <Link
              href="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-blue-700 hover:bg-blue-50 transition"
            >
              Cổng Nhân Viên
            </Link>
          )}

          {hydrated && isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-rose-700 hover:bg-rose-50 transition"
            >
              Quản Trị Hệ Thống
            </Link>
          )}

          {hydrated && canRentStorage && (
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/locations"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center py-3 rounded-full bg-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-md"
              >
                {user ? "THUÊ KHO MỚI" : "ĐẶT KHO NGAY"}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}