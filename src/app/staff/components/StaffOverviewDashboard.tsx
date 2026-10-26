'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  MapPin,
  ArrowUpRight,
  Shield,
  Layers,
  Users,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { StaffTab } from '../types';

interface StaffOverviewDashboardProps {
  facilityName?: string;
  onNavigateTab: (tab: StaffTab) => void;
  pendingCheckInsCount: number;
}

export default function StaffOverviewDashboard({
  facilityName = 'Chi nhánh Landmark 81',
  onNavigateTab,
  pendingCheckInsCount,
}: StaffOverviewDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
            Ca Trực Vận Hành Hôm Nay
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Bảng Điều Khiển Tổng Quan - {facilityName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ bàn giao khách hàng, sơ đồ mặt bằng ô kho 24/7 và kiểm soát quá hạn tự động.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('queue')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Hàng Đợi Check-in ({pendingCheckInsCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('queue')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Check-in Hôm Nay</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{pendingCheckInsCount} cuộc hẹn</div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Đang chờ bàn giao chìa & mã PIN</p>
        </div>

        <div
          onClick={() => onNavigateTab('facility')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tỷ Lệ Lấp Đầy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">69.4%</div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">25/36 ô kho đang hoạt động</p>
        </div>

        <div
          onClick={() => onNavigateTab('checkout')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Trả Kho &amp; Gia Hạn</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">Nghiệm thu trả kho</div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Đối soát ảnh kho trống, hoàn cọc &amp; gia hạn</p>
        </div>

        <div
          onClick={() => onNavigateTab('support')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-rose-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Yêu Cầu Sự Cố</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">2 ticket</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">1 sự cố khóa cần kỹ thuật viên</p>
        </div>
      </div>

      {/* Operational Highlights & Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Trạng Thái An Ninh & Khóa Điện Tử
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Bộ phát tín hiệu trung tâm (Gateway)</p>
                <p className="text-[11px] text-slate-400">Kết nối 36 ổ khóa thông minh qua giao thức Zigbee/Mesh</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Online 100%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Cảm biến môi trường nhiệt độ/độ ẩm</p>
                <p className="text-[11px] text-slate-400">Nhiệt độ trung bình 24°C • Độ ẩm 52% (Chuẩn kho mát)</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tối ưu
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Lối Tắt Thao Tác Nghiệp Vụ
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('queue')}
              className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition cursor-pointer"
            >
              <p className="font-bold text-slate-900">Check-in Khách</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Cấp PIN & Thẻ từ RFID</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('facility')}
              className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition cursor-pointer"
            >
              <p className="font-bold text-slate-900">Sơ Đồ Mặt Bằng</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tra cứu vị trí ô kho</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('checkout')}
              className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition cursor-pointer"
            >
              <p className="font-bold text-slate-900">Thủ Tục Trả Kho</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Nghiệm thu, hoàn cọc &amp; gia hạn</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('support')}
              className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition cursor-pointer"
            >
              <p className="font-bold text-slate-900">Xử Lý Sự Cố</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tiếp nhận hỗ trợ kỹ thuật</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
