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
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useNotifications } from "@/lib/useNotifications";

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

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(user?.id);

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

  const isManager =
    roleName === "FACILITY_MANAGER" ||
    roleName === "BUSINESS_OPERATIONS_MANAGER" ||
    roleName === "MANAGER" ||
    roleName.includes("MANAGER");

  const isPureStaff =
    !isManager && (
      roleName === "STAFF" ||
      roleName === "FACILITY_STAFF" ||
      roleName === "OPERATIONS_STAFF" ||
      roleName.includes("STAFF")
    );

  const isStaff = isPureStaff || isManager;

  const isAdmin =
    roleName === "ADMIN" ||
    roleName === "SYSTEM_ADMINISTRATOR" ||
    roleName.includes("ADMIN");

  const isStaffOrAdmin = isPureStaff || isManager || isAdmin;
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
        label: "Giám Đốc Vận Hành",
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

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    setNotificationOpen(false);

    const roleName = typeof user?.role === 'object' && user?.role !== null ? user.role.name : user?.role;
    const isManagerRole = ['FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN'].includes(
      String(roleName || '').toUpperCase()
    );
    const isPureStaffRole = ['FACILITY_STAFF', 'OPERATIONS_STAFF'].includes(
      String(roleName || '').toUpperCase()
    );

    const notifType = String(notif.type || '').toUpperCase();
    const entityType = String(notif.entityType || '').toUpperCase();
    const entityId = notif.entityId;
    const text = `${notif.title || ''} ${notif.body || ''}`.toLowerCase();

    let targetUrl = '';

    // 1. Yêu cầu hỗ trợ / Sự cố / Khiếu nại
    if (
      notifType === 'SUPPORT' ||
      entityType === 'SUPPORT_REQUEST' ||
      text.includes('hỗ trợ') ||
      text.includes('sự cố') ||
      text.includes('khiếu nại')
    ) {
      if (isManagerRole || isPureStaffRole) {
        targetUrl = `/manager?tab=support${entityId ? `&ticketId=${entityId}` : ''}`;
      } else {
        targetUrl = `/dashboard?tab=support`;
      }
    }
    // 2. Gia hạn / Quá hạn
    else if (
      notifType === 'RENEWAL' ||
      notifType === 'OVERDUE' ||
      text.includes('gia hạn') ||
      text.includes('quá hạn')
    ) {
      if (isManagerRole || isPureStaffRole) {
        targetUrl = '/manager?tab=checkout';
      } else {
        targetUrl = '/dashboard?tab=billing';
      }
    }
    // 3. Đặt chỗ / Nhận kho / Bàn giao
    else if (
      notifType === 'RESERVATION' ||
      notifType === 'HANDOVER' ||
      text.includes('nhận kho') ||
      text.includes('bàn giao') ||
      text.includes('đặt chỗ')
    ) {
      if (isManagerRole || isPureStaffRole) {
        targetUrl = '/manager?tab=queue';
      } else {
        targetUrl = '/dashboard?tab=my_units';
      }
    }
    // 4. Hợp đồng
    else if (notifType === 'CONTRACT' || text.includes('hợp đồng')) {
      if (isManagerRole || isPureStaffRole) {
        targetUrl = '/manager?tab=checkout';
      } else {
        targetUrl = '/dashboard?tab=documents';
      }
    }
    // 5. Thanh toán / Hóa đơn
    else if (notifType === 'PAYMENT' || text.includes('thanh toán') || text.includes('hóa đơn')) {
      if (isManagerRole || isPureStaffRole) {
        targetUrl = '/manager?tab=dashboard';
      } else {
        targetUrl = '/dashboard?tab=billing';
      }
    }
    // 6. Cơ sở / Mặt bằng / Ảnh
    else if (notifType === 'FACILITY' || text.includes('cơ sở') || text.includes('mặt bằng')) {
      if (isManagerRole || isPureStaffRole) {
        targetUrl = '/manager?tab=facility_photos';
      } else {
        targetUrl = '/locations';
      }
    }
    // 7. Mặc định theo vai trò
    else {
      if (isManagerRole) {
        targetUrl = '/manager';
      } else if (isPureStaffRole) {
        targetUrl = '/staff';
      } else {
        targetUrl = '/dashboard';
      }
    }

    if (targetUrl) {
      const [targetPath] = targetUrl.split('?');
      if (typeof window !== 'undefined') {
        if (window.location.pathname === targetPath) {
          window.history.pushState({}, '', targetUrl);
          window.dispatchEvent(new Event('manager-tab-change'));
          window.dispatchEvent(new Event('custom-tab-change'));
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          router.push(targetUrl);
        }
      } else {
        router.push(targetUrl);
      }
    }
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
              <Link
                key={idx}
                href={link.href}
                className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
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

            {/* AI Assistant Trigger Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-ai-chat"));
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200 shadow-2xs hover:shadow-indigo-200/50 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Nhấn để mở Trợ lý AI tư vấn kích thước kho & chính sách"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Trợ lý AI</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white leading-none">
                AI
              </span>
            </button>

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
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2.5 w-84 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-slide-up-fade">
                    <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        <span>Thông Báo Của Bạn ({unreadCount})</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAsRead()}
                          className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Đã đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Chưa có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 hover:border-blue-300 hover:shadow-xs group ${
                              notif.isRead
                                ? 'bg-slate-50/60 border-slate-100 opacity-75'
                                : 'bg-blue-50/40 border-blue-100/80 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 text-[11px]">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                )}
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(notif.createdAt).toLocaleDateString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                              {notif.body}
                            </p>
                            <div className="flex items-center justify-end pt-0.5">
                              <span className="text-[10px] font-semibold text-blue-600 group-hover:underline flex items-center gap-0.5">
                                <span>Xem chi tiết</span>
                                <span>&rarr;</span>
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
                      <Link
                        href={isManager ? "/manager" : isPureStaff ? "/staff" : isAdmin ? "/admin" : "/dashboard"}
                        onClick={() => setNotificationOpen(false)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        {isManager ? "Đến Cổng Quản Lý →" : isPureStaff ? "Đến Cổng Nhân Viên →" : isAdmin ? "Đến Cổng Quản Trị →" : "Đến trang Quản lý kho →"}
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
                      {isAdmin ? (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50/70 border border-rose-200/60 text-rose-900 hover:bg-rose-100/70 transition"
                          >
                            <Settings className="w-4 h-4 text-rose-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-rose-950 font-bold">Quản Trị Hệ Thống</div>
                              <div className="text-[10px] text-rose-700/80 font-normal">
                                Toàn quyền cấu hình nền tảng &amp; phân quyền
                              </div>
                            </div>
                          </Link>
                          <Link
                            href="/manager"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-50 text-indigo-700 transition"
                          >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="font-bold text-xs">Cổng Quản Lý Chi Nhánh</span>
                          </Link>
                          <Link
                            href="/staff"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 transition"
                          >
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span className="font-bold text-xs">Cổng Nhân Viên Vận Hành</span>
                          </Link>
                        </>
                      ) : isManager ? (
                        <>
                          {/* Manager Portal */}
                          <Link
                            href="/manager"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-indigo-900 hover:bg-indigo-100/70 transition"
                          >
                            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-indigo-950 font-bold">Cổng Quản Lý Cơ Sở</div>
                              <div className="text-[10px] text-indigo-700/80 font-normal">
                                Phân công ca trực, duyệt bảng giá &amp; giám sát
                              </div>
                            </div>
                          </Link>

                          {/* Manager Profile & Password */}
                          <Link
                            href="/manager?tab=profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition"
                          >
                            <User className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="flex-1">
                              <div className="text-slate-900 font-bold">Hồ Sơ &amp; Đổi Mật Khẩu</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Thông tin tài khoản quản lý &amp; bảo mật
                              </div>
                            </div>
                          </Link>

                          {/* Quick link to Staff desk */}
                          <Link
                            href="/staff"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 text-[11px] font-semibold">
                              Chuyển sang Quầy Nhân Viên
                            </div>
                          </Link>
                        </>
                      ) : isPureStaff ? (
                        <>
                          {/* Staff Portal */}
                          <Link
                            href="/staff"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-900 hover:bg-blue-100/70 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-blue-950 font-bold">Cổng Nhân Viên Vận Hành</div>
                              <div className="text-[10px] text-blue-700/80 font-normal">
                                Bàn giao kho, tiếp nhận khách &amp; vận hành quầy
                              </div>
                            </div>
                          </Link>

                          {/* Staff Profile & Password */}
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
                {isAdmin ? (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition shadow-xs"
                    >
                      Quản Trị Viên
                    </Link>
                    <Link
                      href="/manager"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition shadow-xs"
                    >
                      Cổng Quản Lý
                    </Link>
                  </>
                ) : isManager ? (
                  <>
                    <Link
                      href="/manager"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition shadow-xs"
                    >
                      Cổng Quản Lý
                    </Link>
                    <Link
                      href="/manager?tab=profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Hồ Sơ Quản Lý
                    </Link>
                  </>
                ) : isPureStaff ? (
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
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}

          {/* AI Assistant Mobile Action */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent("open-ai-chat"));
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-indigo-900 font-bold text-sm hover:from-blue-100 hover:to-indigo-100 transition shadow-2xs text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Trợ Lý AI Tư Vấn Kho</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
              Gợi ý ngay
            </span>
          </button>

          {hydrated && isManager && (
            <Link
              href="/manager"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition"
            >
              Cổng Quản Lý Cơ Sở
            </Link>
          )}

          {hydrated && isPureStaff && (
            <Link
              href="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-blue-700 hover:bg-blue-50 transition"
            >
              Cổng Nhân Viên Vận Hành
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