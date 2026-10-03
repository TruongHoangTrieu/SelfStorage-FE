'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  CreditCard,
  KeyRound,
  FileText,
  Headphones,
  User,
  ChevronRight,
  LogOut,
  Globe,
  Menu
} from 'lucide-react';
import { CustomerTab, CustomerUser } from '../types';

interface CustomerSidebarProps {
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  activeUnitCount: number;
  customerUser?: CustomerUser | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function CustomerSidebar({
  activeTab,
  onSelectTab,
  activeUnitCount,
  customerUser,
  onOpenLogin,
  onLogout,
  isCollapsed = false,
  isOpen = true,
  onToggle,
}: CustomerSidebarProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'KH';
  };

  const mainNavItems = [
    { id: 'my_units' as CustomerTab, label: 'Ô kho của tôi', icon: Home, badge: activeUnitCount },
    { id: 'billing' as CustomerTab, label: 'Thanh toán & Hóa đơn', icon: CreditCard },
    { id: 'access' as CustomerTab, label: 'Truy cập & Mã khóa', icon: KeyRound },
    { id: 'documents' as CustomerTab, label: 'Hợp đồng & Biên lai', icon: FileText },
  ];

  const serviceNavItems = [
    { id: 'support' as CustomerTab, label: 'Hỗ trợ kỹ thuật', icon: Headphones, dot: true },
    { id: 'profile' as CustomerTab, label: 'Hồ sơ & Đổi mật khẩu', icon: User },
  ];

  return (
    <aside
      className={`bg-white text-slate-800 border-r border-slate-200 flex flex-col shrink-0 select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] fixed lg:sticky top-0 lg:top-18 h-screen lg:h-[calc(100vh-4.5rem)] z-40 ${
        // Mobile: slide in/out drawer
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        // Desktop: YouTube full 240px or YouTube mini 72px
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-60'
      } w-64`}
    >
      {/* Mobile Drawer Header: Hiện logo và nút đóng khi ở trên màn hình nhỏ */}
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
        <Link href="/" className="inline-flex items-center group pr-4">
          <img
            src="/logo.png"
            alt="SelfStorage Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Navigation Menu (Laser-aligned along exact x=36px axis) */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {/* ================= SECTION 1: QUẢN LÝ KHO ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Quản Lý Kho</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {mainNavItems.map((item) => {
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

              {item.badge !== undefined && (
                <span
                  className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300 ease-in-out shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700'
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

        {/* ================= SECTION 2: DỊCH VỤ & TÀI KHOẢN ================= */}
        <div
          className={`px-3 pt-2 pb-1 text-[13px] font-bold text-slate-900 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-8 opacity-100'
          }`}
        >
          <span>Dịch Vụ & Tài Khoản</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {serviceNavItems.map((item) => {
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
          href="/"
          className="w-full flex items-center h-12 rounded-xl transition-colors duration-200 cursor-pointer overflow-hidden text-slate-700 hover:bg-slate-100 font-medium"
          title={isCollapsed ? 'Về Trang Chủ' : undefined}
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
            Về Trang Chủ
          </span>
        </Link>
      </nav>

      {/* Customer User Footer in Sidebar (Laser-aligned along exact x=36px axis) */}
      <div className="py-3 px-2 border-t border-slate-200 bg-slate-50/80 mt-auto shrink-0 overflow-hidden">
        <div className="flex items-center">
          {/* Căn giữa tuyệt đối Avatar trong khung 56px (tâm đúng x=36px) */}
          <div className="w-[56px] shrink-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 tracking-wider"
              title={isCollapsed ? (customerUser?.fullName || 'Tài khoản') : undefined}
            >
              {getInitials(customerUser?.fullName, customerUser?.email)}
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex-1 min-w-0 ${
              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[125px] opacity-100'
            }`}
          >
            <div className="text-xs font-bold text-slate-800 truncate">
              {customerUser?.fullName || 'Khách thuê kho'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {customerUser?.email || 'customer@selfstorage.vn'}
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
