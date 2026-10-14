'use client';

import React, { useState } from 'react';
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
  Menu,
  Building2,
  Boxes,
  User,
  LogIn,
  Clock,
} from 'lucide-react';
import { StaffTab, StaffUser } from '../types';

interface SidebarProps {
  activeTab: StaffTab;
  onSelectTab: (tab: StaffTab) => void;
  pendingCount: number;
  pendingRenewalsCount?: number;
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
  pendingRenewalsCount,
  currentUser,
  onOpenLoginModal,
  onLogout,
  isCollapsed = false,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);

  const handleItemHover = (e: React.MouseEvent<HTMLElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      text: label,
      top: rect.top + rect.height / 2,
      left: isCollapsed ? rect.right + 12 : rect.left + 54,
    });
  };

  const handleItemLeave = () => {
    setHoveredTooltip(null);
  };

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

  const staffName = currentUser?.fullName || 'Nhân viên vận hành';
  const staffRole = currentUser?.role ? currentUser.role.replace('FACILITY_', '') : 'STAFF';
  const rawFacilityName =
    currentUser?.assignedFacility?.name ||
    currentUser?.facilityName ||
    'Trụ Sở Chính Võ Nguyên Giáp';
  const facilityName = rawFacilityName.replace(/^Kho\s+Tự\s+Quản\s+/i, '').trim();

  const roleName = (currentUser?.role || '').toUpperCase();
  const isManager = Boolean(
    currentUser && (
      roleName === 'FACILITY_MANAGER' ||
      roleName === 'BUSINESS_OPERATIONS_MANAGER' ||
      roleName === 'SYSTEM_ADMINISTRATOR' ||
      roleName === 'ADMIN' ||
      roleName.includes('MANAGER')
    )
  );

  const operationalNavItems = [
    { id: 'queue' as StaffTab, label: 'Hàng đợi nhận kho', icon: Inbox, badge: pendingCount },
    {
      id: 'checkout' as StaffTab,
      label: 'Gia hạn & Quá hạn',
      icon: Clock,
      badge: pendingRenewalsCount && pendingRenewalsCount > 0 ? pendingRenewalsCount : undefined,
    },
    { id: 'facility' as StaffTab, label: 'Sơ đồ & Ô kho 24/7', icon: MapPin },
    { id: 'support' as StaffTab, label: 'Tiếp nhận sự cố', icon: LifeBuoy, dot: true },
  ];

  const personalNavItems = [
    { id: 'dashboard' as StaffTab, label: 'Tổng quan ca trực', icon: LayoutDashboard },
    { id: 'profile' as StaffTab, label: 'Hồ sơ & Đổi mật khẩu', icon: User },
  ];

  return (
    <aside
      className={`bg-white text-slate-800 border-r border-slate-200 flex flex-col shrink-0 select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } fixed lg:static inset-y-0 left-0 z-50 lg:z-30 h-screen lg:h-full ${
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-72'
      } w-72`}
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
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-slate-900">
              SmartStorage
            </span>
            <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              Cổng Quản Lý &amp; Vận Hành
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu (Laser-aligned along exact x=36px axis) */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        
        {/* Facility Info Card (visible when expanded) */}
        <div
          className={`mx-2 mb-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 transition-all duration-300 ${
            isCollapsed ? 'max-h-0 opacity-0 p-0 m-0 border-0 overflow-hidden' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-950">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="line-clamp-2 leading-tight break-words flex-1" title={facilityName}>
              {facilityName}
            </span>
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
              onMouseEnter={(e) => handleItemHover(e, item.label)}
              onMouseLeave={handleItemLeave}
              className={`w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={item.label}
            >
              {/* Căn giữa tuyệt đối trong khung 56px (tâm đúng x=36px) */}
              <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-600'}`} />
              </div>

              <span
                className={`text-[14px] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ease-in-out text-left flex-1 ${
                  isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
                }`}
              >
                {item.label}
              </span>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300 ease-in-out shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-800'
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

        {/* ================= SECTION 2: CÁ NHÂN & CA TRỰC ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Cá Nhân &amp; Ca Trực</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {personalNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              onMouseEnter={(e) => handleItemHover(e, item.label)}
              onMouseLeave={handleItemLeave}
              className={`w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={item.label}
            >
              <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-600'}`} />
              </div>

              <span
                className={`text-[14px] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ease-in-out text-left flex-1 ${
                  isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Link back to Manager Portal if user has manager role */}
        {isManager && (
          <Link
            href="/manager"
            onMouseEnter={(e) => handleItemHover(e, 'Chuyển sang Cổng Quản Lý (/manager)')}
            onMouseLeave={handleItemLeave}
            className="w-full flex items-center h-12 rounded-xl text-indigo-700 hover:bg-indigo-50 font-bold transition-colors cursor-pointer overflow-hidden group mt-1"
            title="Chuyển sang Cổng Quản Lý (/manager)"
          >
            <div className="w-[56px] h-12 shrink-0 flex items-center justify-center">
              <Building2 className="w-5 h-5 shrink-0 text-indigo-600 group-hover:scale-105 transition-transform" />
            </div>
            <span
              className={`text-[13px] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ease-in-out text-left flex-1 text-indigo-700 ${
                isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
              }`}
            >
              Cổng Quản Lý →
            </span>
          </Link>
        )}
      </nav>

      {/* Staff User Footer in Sidebar */}
      <div className="py-3 px-2 border-t border-slate-200 bg-slate-50/80 mt-auto shrink-0 overflow-hidden">
        {currentUser ? (
          <div className="flex items-center">
            {/* Căn giữa tuyệt đối Avatar trong khung 56px (tâm đúng x=36px) */}
            <div
              onClick={() => onSelectTab('profile')}
              onMouseEnter={(e) =>
                handleItemHover(
                  e,
                  `${currentUser.fullName} (${staffRole}) • ${currentUser.email}`
                )
              }
              onMouseLeave={handleItemLeave}
              className="flex items-center flex-1 min-w-0 cursor-pointer group"
              title={currentUser.fullName}
            >
              <div className="w-[56px] shrink-0 flex items-center justify-center">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 group-hover:scale-105 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 tracking-wider transition-transform"
                >
                  {getInitials(currentUser.fullName, currentUser.email)}
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex-1 min-w-0 pr-1 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'opacity-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5 group-hover:text-emerald-600 transition-colors">
                  <span className="truncate">{currentUser.fullName}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase shrink-0">
                    {staffRole}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentUser.email}
                </div>
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
        ) : (
          <div className="px-1 py-1">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Đăng nhập Staff</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Interactive Full-Text Floating Popover / Tooltip when Hovered */}
      {hoveredTooltip && (
        <div
          style={{
            top: `${hoveredTooltip.top}px`,
            left: `${hoveredTooltip.left}px`,
          }}
          className={`fixed -translate-y-1/2 z-[100] pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 whitespace-nowrap flex items-center gap-2 ${
            isCollapsed
              ? 'bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700'
              : 'bg-white text-emerald-950 font-bold text-[13.5px] px-3.5 py-2 rounded-xl shadow-2xl border border-emerald-200 ring-4 ring-emerald-500/10'
          }`}
        >
          {!isCollapsed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
          <span>{hoveredTooltip.text}</span>
        </div>
      )}
    </aside>
  );
}
