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
  Boxes,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { CustomerTab } from '../types';

interface CustomerSidebarProps {
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  activeUnitCount: number;
}

export default function CustomerSidebar({
  activeTab,
  onSelectTab,
  activeUnitCount,
}: CustomerSidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#4f39f6] flex items-center justify-center text-white font-bold shadow-lg shadow-[#4f39f6]/30 group-hover:scale-105 transition-transform">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              SelfStorage
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Portal
              </span>
            </div>
            <p className="text-xs text-slate-400">Cổng Khách Hàng Tự Quản</p>
          </div>
        </Link>
      </div>

      {/* SaaS / Banking Menu */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Quản Lý Kho Của Tôi
        </div>

        {/* 🏠 Ô kho của tôi (Luồng 3 đang hoạt động) */}
        <button
          onClick={() => onSelectTab('my_units')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'my_units'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home className="w-4 h-4" />
            <span>Ô kho của tôi</span>
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'my_units'
                ? 'bg-white text-[#4f39f6]'
                : 'bg-[#4f39f6]/20 text-[#818cf8]'
            }`}
          >
            {activeUnitCount}
          </span>
        </button>

        {/* 💳 Thanh toán & Hóa đơn (Liên kết với Luồng 4) */}
        <button
          onClick={() => onSelectTab('billing')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'billing'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Thanh toán & Hóa đơn</span>
        </button>

        {/* 🔑 Truy cập & Bảo mật (Quản lý mã/thẻ) */}
        <button
          onClick={() => onSelectTab('access')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'access'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Truy cập & Bảo mật</span>
        </button>

        {/* 📄 Tài liệu (Hợp đồng, biên lai) */}
        <button
          onClick={() => onSelectTab('documents')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'documents'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tài liệu & Hợp đồng</span>
        </button>

        <div className="pt-3 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Dịch Vụ & Hỗ Trợ
        </div>

        {/* 🎧 Hỗ trợ & Trợ giúp (Liên kết với Luồng 7) */}
        <button
          onClick={() => onSelectTab('support')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'support'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Headphones className="w-4 h-4" />
            <span>Hỗ trợ & Trợ giúp</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* 👤 Hồ sơ & Cài đặt */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-[#4f39f6] text-white shadow-md shadow-[#4f39f6]/25 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ sơ & Cài đặt</span>
        </button>
      </nav>

      {/* Customer Profile & Security Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4f39f6] to-[#7c3aed] flex items-center justify-center font-bold text-white text-sm shadow-md">
              NH
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-semibold text-white truncate">Nguyễn Văn Hải</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Đã xác thực CCCD
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
