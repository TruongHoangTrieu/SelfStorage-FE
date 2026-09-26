'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Inbox,
  ArrowUpRight,
  MapPin,
  LifeBuoy,
  Settings,
  Boxes,
  LogOut,
  UserCheck,
  LogIn
} from 'lucide-react';
import { StaffTab, StaffUser } from '../types';

interface SidebarProps {
  activeTab: StaffTab;
  onSelectTab: (tab: StaffTab) => void;
  pendingCount: number;
  currentUser?: StaffUser | null;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  pendingCount,
  currentUser,
  onOpenLoginModal,
  onLogout,
}: SidebarProps) {
  const staffName = currentUser?.fullName || 'Trần Hùng (NV04)';
  const staffRole = currentUser?.role ? currentUser.role.replace('FACILITY_', '') : 'STAFF';
  const facilityName = currentUser?.facilityName || 'Cơ sở Landmark 81';

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#4f39f6] flex items-center justify-center text-white font-bold shadow-lg shadow-[#4f39f6]/30 group-hover:scale-105 transition-transform">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              SelfStorage
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#4f39f6]/20 text-[#818cf8] border border-[#4f39f6]/30">
                {staffRole}
              </span>
            </div>
            <p className="text-xs text-slate-400">Cổng Vận Hành Cơ Sở</p>
          </div>
        </Link>

        {/* Chi nhánh hiện tại */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-white truncate">{facilityName}</div>
            <div className="text-[10px] text-slate-400 truncate">Khu B - Bình Thạnh, TP.HCM</div>
          </div>
        </div>
      </div>

      {/* Task-Oriented Navigation Menu */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Bảng điều khiển</span>
        </button>

        {/* Hàng đợi nhận kho (Luồng 2 đang hoạt động) */}
        <button
          onClick={() => onSelectTab('queue')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'queue'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Inbox className="w-4 h-4" />
            <span>Hàng đợi nhận kho</span>
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'queue' ? 'bg-white text-[#4f39f6]' : 'bg-[#4f39f6] text-white'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        {/* Trả kho / Thanh lý */}
        <button
          onClick={() => onSelectTab('checkout')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'checkout'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Trả kho / Thanh lý</span>
        </button>

        {/* Sơ đồ cơ sở / Trạng thái ô kho */}
        <button
          onClick={() => onSelectTab('facility')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'facility'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Sơ đồ / Trạng thái ô kho</span>
        </button>

        {/* Hỗ trợ & Sự cố */}
        <button
          onClick={() => onSelectTab('support')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'support'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-4 h-4" />
            <span>Hỗ trợ & Sự cố</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-amber-400" />
        </button>

        {/* Cài đặt (Tối giản cho nhân viên) */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cài đặt</span>
        </button>
      </nav>

      {/* Staff Profile & Shift Info at Bottom */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white text-sm border border-slate-700">
                {staffName.split(' ').slice(-2).map(n => n[0]).join('') || 'NV'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate" title={staffName}>
                {staffName}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                {currentUser?.email ? 'Đã xác thực JWT' : 'Ca trực hôm nay'}
              </div>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="p-1.5 text-slate-400 hover:text-[#4f39f6] hover:bg-slate-800 rounded-lg transition-colors"
              title="Đăng nhập Staff Backend"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
