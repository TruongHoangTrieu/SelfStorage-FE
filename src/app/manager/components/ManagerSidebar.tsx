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
  DoorClosed,
  Shield,
  Users,
  Camera,
} from 'lucide-react';
import { ManagerTab, StaffUser } from '../types';

interface ManagerSidebarProps {
  activeTab: ManagerTab;
  onSelectTab: (tab: ManagerTab) => void;
  pendingCount: number;
  pendingRenewalsCount?: number;
  currentUser?: StaffUser | null;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ManagerSidebar({
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
}: ManagerSidebarProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'QL';
  };

  const managerName = currentUser?.fullName || 'Quản lý cơ sở';
  const managerRole = currentUser?.role ? currentUser.role.replace('FACILITY_', '') : 'MANAGER';
  const rawFacilityName =
    currentUser?.assignedFacility?.name ||
    currentUser?.facilityName ||
    'Trụ Sở Chính Võ Nguyên Giáp';
  const facilityName = rawFacilityName.replace(/^Kho\s+Tự\s+Quản\s+/i, '').trim();

  const coreManagementItems = [
    { id: 'dashboard' as ManagerTab, label: 'Bảng điều khiển cơ sở', icon: LayoutDashboard },
    { id: 'facility' as ManagerTab, label: 'Sơ đồ & Phân công NV', icon: MapPin },
    { id: 'facility_photos' as ManagerTab, label: 'Hình ảnh cơ sở', icon: Camera },
    { id: 'unit_types' as ManagerTab, label: 'Loại kho & Bảng giá', icon: Boxes },
    {
      id: 'checkout' as ManagerTab,
      label: 'Thủ tục trả kho & Gia hạn',
      icon: DoorClosed,
      badge: pendingRenewalsCount && pendingRenewalsCount > 0 ? pendingRenewalsCount : undefined,
    },
  ];

  const operationalMonitoringItems = [
    {
      id: 'queue' as ManagerTab,
      label: 'Giám sát nhận kho',
      icon: Inbox,
      badge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'support' as ManagerTab, label: 'Sự cố & Khiếu nại', icon: LifeBuoy, dot: true },
  ];

  const accountItems = [
    { id: 'profile' as ManagerTab, label: 'Hồ sơ & Đổi mật khẩu', icon: User },
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
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-slate-900">
              SmartStorage
            </span>
            <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
              Cổng Quản Lý Cơ Sở
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">

        {/* ================= SECTION 1: QUẢN TRỊ CƠ SỞ ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Quản Trị Cơ Sở</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {coreManagementItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center h-12 rounded-xl transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={item.label}
            >
              <div className="w-[50px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-600'}`} />
              </div>

              <div className="flex-1 min-w-0 pr-1 text-left relative">
                <span
                  className={`text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis block transition-all duration-300 ${
                    isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300 ease-in-out shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-100 text-indigo-800'
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

        {/* ================= SECTION 2: GIÁM SÁT VẬN HÀNH ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Giám Sát Vận Hành</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {operationalMonitoringItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center h-12 rounded-xl transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={item.label}
            >
              <div className="w-[50px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-600'}`} />
              </div>

              <div className="flex-1 min-w-0 pr-1 text-left relative">
                <span
                  className={`text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis block transition-all duration-300 ${
                    isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300 ease-in-out shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-100 text-indigo-800'
                  } ${isCollapsed ? 'max-w-0 opacity-0 overflow-hidden px-0 pointer-events-none' : 'max-w-[40px] opacity-100'}`}
                >
                  {item.badge}
                </span>
              )}

              {item.dot && (
                <span
                  className={`mr-3 w-2 h-2 rounded-full bg-indigo-500 shrink-0 transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* ================= DIVIDER ================= */}
        <hr className="my-2 border-slate-200 mx-1" />

        {/* ================= SECTION 3: TÀI KHOẢN & CÁ NHÂN ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Tài Khoản &amp; Cá Nhân</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {accountItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center h-12 rounded-xl transition-all duration-200 cursor-pointer relative group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
              title={item.label}
            >
              <div className="w-[50px] h-12 shrink-0 flex items-center justify-center">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-600'}`} />
              </div>

              <div className="flex-1 min-w-0 pr-1 text-left relative">
                <span
                  className={`text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis block transition-all duration-300 ${
                    isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Manager User Footer */}
      <div className="py-3 px-2 border-t border-slate-200 bg-slate-50/80 mt-auto shrink-0 overflow-hidden">
        {currentUser ? (
          <div className="flex items-center">
            <div
              onClick={() => onSelectTab('profile')}
              className="flex items-center flex-1 min-w-0 cursor-pointer group"
              title={currentUser.fullName}
            >
              <div className="w-[56px] shrink-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 group-hover:scale-105 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 tracking-wider transition-transform">
                  {getInitials(currentUser.fullName, currentUser.email)}
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex-1 min-w-0 pr-1 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'opacity-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                  <span className="truncate">{currentUser.fullName}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-extrabold uppercase shrink-0">
                    {managerRole}
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Đăng nhập Manager</span>}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
