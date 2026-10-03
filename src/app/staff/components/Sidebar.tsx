'use client';

import React from 'react';
import Link from 'next/link';
import {
  Inbox,
  LayoutDashboard,
  ArrowUpRight,
  MapPin,
  LifeBuoy,
  Settings,
  ChevronRight,
  LogOut,
  Globe,
  Menu,
  Building2,
  Boxes,
} from 'lucide-react';
import { StaffTab, StaffUser } from '../types';

interface SidebarProps {
  activeTab: StaffTab;
  onSelectTab: (tab: StaffTab) => void;
  pendingCount: number;
  currentUser?: StaffUser | null;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  pendingCount,
  currentUser,
  onOpenLoginModal,
  onLogout,
  isCollapsed = false,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'NV';
  };

  const staffName = currentUser?.fullName || 'Trần Hùng (NV04)';
  const staffRole = currentUser?.role ? currentUser.role.replace('FACILITY_', '') : 'STAFF';
  const facilityName = currentUser?.facilityName || 'Cơ sở Landmark 81';

  const operationalNavItems = [
    { id: 'queue' as StaffTab, label: 'Hàng đợi nhận kho', icon: Inbox, badge: pendingCount },
    { id: 'checkout' as StaffTab, label: 'Quản lý trả kho', icon: ArrowUpRight },
    { id: 'facility' as StaffTab, label: 'Sơ đồ & Ô kho 24/7', icon: MapPin },
  ];

  const managementNavItems = [
    { id: 'dashboard' as StaffTab, label: 'Bảng điều khiển cơ sở', icon: LayoutDashboard },
    { id: 'support' as StaffTab, label: 'Hỗ trợ & Xử lý sự cố', icon: LifeBuoy, dot: true },
    { id: 'settings' as StaffTab, label: 'Cài đặt cổng cơ sở', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white text-slate-800 border-r border-slate-200 flex flex-col shrink-0 select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] fixed lg:sticky top-0 lg:top-18 h-screen lg:h-[calc(100vh-4.5rem)] z-40 ${
        // Mobile: slide in/out drawer
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        // Desktop: YouTube full 240px or mini 72px
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-60'
      } w-64`}
    >
      {/* Mobile Drawer Header */}
      <div className="lg:hidden h-18 border-b border-slate-200 flex items-center bg-white shrink-0">
        <div className="w-[72px] h-full flex items-center justify-center shrink-0">
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
        <Link href="/" className="inline-flex items-center gap-2 pr-4">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-slate-900">
              SmartStorage
            </span>
            <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              Staff Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu (Laser-aligned along exact x=36px axis) */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        
        {/* Facility Info Card (visible when expanded) */}
        <div
          className={`mx-2 mb-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 transition-all duration-300 ${
            isCollapsed ? 'max-h-0 opacity-0 p-0 m-0 border-0 overflow-hidden' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{facilityName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">Hệ thống sẵn sàng đón khách</span>
          </div>
        </div>

        {/* ================= SECTION 1: VẬN HÀNH & BÀN GIAO ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Vận Hành &amp; Bàn Giao</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {operationalNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer overflow-hidden ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Căn giữa tuyệt đối trong khung 56px (tâm đúng x=36px) */}
              <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600'}`} />
              </div>

              <span
                className={`text-[14px] whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-left flex-1 ${
                  isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[140px] opacity-100 translate-x-0'
                }`}
              >
                {item.label}
              </span>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300 ease-in-out shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700'
                  } ${isCollapsed ? 'max-w-0 opacity-0 overflow-hidden px-0 pointer-events-none' : 'max-w-[40px] opacity-100'}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* ================= DIVIDER ================= */}
        <hr className="my-2 border-slate-200 mx-1" />

        {/* ================= SECTION 2: QUẢN LÝ CƠ SỞ ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Quản Lý Cơ Sở</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {managementNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer overflow-hidden ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Căn giữa tuyệt đối trong khung 56px (tâm đúng x=36px) */}
              <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600'}`} />
              </div>

              <span
                className={`text-[14px] whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-left flex-1 ${
                  isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[140px] opacity-100 translate-x-0'
                }`}
              >
                {item.label}
              </span>

              {item.dot && (
                <span
                  className={`mr-3 w-2 h-2 rounded-full bg-emerald-500 shrink-0 transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* ================= DIVIDER ================= */}
        <hr className="my-2 border-slate-200 mx-1" />

        {/* ================= SECTION 3: LIÊN KẾT NHANH ================= */}
        <Link
          href="/dashboard"
          className="w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer overflow-hidden text-slate-700 hover:bg-slate-100 font-medium"
          title={isCollapsed ? 'Cổng Khách Hàng' : undefined}
        >
          {/* Căn giữa tuyệt đối trong khung 56px (tâm đúng x=36px) */}
          <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
            <Globe className="w-5 h-5 shrink-0 text-slate-600" />
          </div>

          <span
            className={`text-[14px] whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-left flex-1 ${
              isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[140px] opacity-100 translate-x-0'
            }`}
          >
            Cổng Khách Hàng
          </span>
        </Link>
      </nav>

      {/* Staff User Footer in Sidebar (Laser-aligned along exact x=36px axis) */}
      <div className="py-3 px-2 border-t border-slate-200 bg-slate-50/80 mt-auto shrink-0 overflow-hidden">
        <div className="flex items-center">
          {/* Căn giữa tuyệt đối Avatar trong khung 56px (tâm đúng x=36px) */}
          <div className="w-[56px] shrink-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 tracking-wider"
              title={isCollapsed ? (currentUser?.fullName || 'Nhân viên') : undefined}
            >
              {getInitials(currentUser?.fullName, currentUser?.email)}
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex-1 min-w-0 ${
              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[125px] opacity-100'
            }`}
          >
            <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
              <span>{currentUser?.fullName || staffName}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-extrabold uppercase">
                {staffRole}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {currentUser?.email || 'staff@selfstorage.vn'}
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto mr-1 ${
                isCollapsed ? 'hidden' : 'block'
              }`}
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
