'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  MapPin,
  Shield,
  Layers,
  Users,
  Building2,
  ChevronRight,
  TrendingUp,
  Boxes,
  Key,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Loader2,
  Bot,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiApi } from '@/lib/api/ai';
import { ManagerTab } from '../types';

interface ManagerOverviewDashboardProps {
  facilityName?: string;
  facilityId?: string | number;
  managerName?: string;
  managerRole?: string;
  onNavigateTab: (tab: ManagerTab) => void;
  pendingCheckInsCount: number;
  pendingRenewalsCount: number;
}

export default function ManagerOverviewDashboard({
  facilityName = 'Chi nhánh Landmark 81',
  facilityId,
  managerName = 'Quản lý cơ sở',
  managerRole = 'FACILITY_MANAGER',
  onNavigateTab,
  pendingCheckInsCount,
  pendingRenewalsCount,
}: ManagerOverviewDashboardProps) {
  const [isRunningAi, setIsRunningAi] = useState(false);

  const handleRunAiPrediction = async () => {
    try {
      setIsRunningAi(true);
      toast.info("Đang khởi chạy mô hình AI (Model A: XGBoost, Model B: RandomForest)...");
      const res = await aiApi.predictRenewals(14);
      toast.success(
        `Hoàn tất quét AI: Đã phân tích ${res.total_processed} hợp đồng, lưu ${res.saved_to_db} bản ghi dự đoán vào hệ thống!`
      );
    } catch (err: any) {
      toast.error(`Không thể chạy dự đoán AI: ${err.message || 'Lỗi kết nối máy chủ AI'}`);
    } finally {
      setIsRunningAi(false);
    }
  };

  const displayRole = managerRole === 'BUSINESS_OPERATIONS_MANAGER'
    ? 'Quản Lý Chuỗi Vận Hành'
    : 'Quản Lý Chi Nhánh';

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto">
      {/* 1. Header & Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wide uppercase">
              <Building2 className="w-3.5 h-3.5" />
              <span>{displayRole} • {facilityName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bảng Điều Khiển Quản Lý Cơ Sở
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Xin chào <strong>{managerName}</strong>. Giám sát tổng thể hoạt động chi nhánh: phân công nhân sự, phê duyệt bảng giá kho, kiểm soát hạn hợp đồng và chất lượng dịch vụ khách hàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isRunningAi}
              onClick={handleRunAiPrediction}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Kích hoạt quét hợp đồng sắp hết hạn và chấm điểm gia hạn bằng AI Model A & B"
            >
              {isRunningAi ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              )}
              <span>{isRunningAi ? "AI Đang Quét..." : "AI Dự Đoán Gia Hạn"}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('facility')}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Phân Công Nhân Sự</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('facility_photos')}
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-100" />
              <span>Đổi Ảnh Cơ Sở</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('unit_types')}
              className="px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-slate-300" />
              <span>Cấu Hình Bảng Giá</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tỷ lệ lấp đầy */}
        <div
          onClick={() => onNavigateTab('facility')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tỷ Lệ Lấp Đầy Kho</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">69.4%</div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">25/36 ô kho đang có khách thuê</p>
        </div>

        {/* KPI 2: Check-in Hôm Nay */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Nhận Kho Hôm Nay</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{pendingCheckInsCount} cuộc hẹn</div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Quầy tiếp đón đang làm thủ tục bàn giao</p>
        </div>

        {/* KPI 3: Gia hạn chờ duyệt */}
        <div
          onClick={() => onNavigateTab('checkout')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gia Hạn Chờ Duyệt</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {pendingRenewalsCount > 0 ? `${pendingRenewalsCount} yêu cầu` : '0 yêu cầu'}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Cần Quản lý xem xét &amp; phê duyệt</p>
        </div>

        {/* KPI 4: Xử lý sự cố */}
        <div
          onClick={() => onNavigateTab('support')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Sự Cố Kỹ Thuật</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">Đang giám sát</div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Bảo đảm an toàn ổ khóa &amp; cửa kho</p>
        </div>
      </div>

      {/* 3. Phân Hệ Quản Trị Dành Riêng Cho Quản Lý */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Module 1: Phân công nhân sự */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Phân Công Nhân Sự Ca Trực</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Quản lý danh sách nhân viên trực cơ sở, gán nhân sự mới vào chi nhánh và điều phối vị trí làm việc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('facility')}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Mở Tab Phân Công Nhân Sự</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 2: Quản lý loại kho & Bảng giá */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảng Giá &amp; Loại Kho</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Toàn quyền tạo loại kho mới (Tủ đồ, Box Mini, Phòng kho), niêm yết giá thuê theo tháng/năm và mức cọc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('unit_types')}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-purple-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Quản Lý Bảng Giá Cơ Sở</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 3: Miễn giảm phí phạt & Quá hạn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Quản Trị Quá Hạn &amp; Miễn Phạt</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kích hoạt quét quá hạn cron tự động, xét duyệt miễn giảm phí phạt cho khách hàng có lý do đặc biệt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('checkout')}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-amber-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Quản Trị Hợp Đồng &amp; Phạt</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 4: Quản lý hình ảnh cơ sở */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hình Ảnh Cơ Sở</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tải ảnh cơ sở mới, quản lý ảnh đại diện hiển thị đồng bộ trên Web và ứng dụng Mobile.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('facility_photos')}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Quản Lý Ảnh Cơ Sở</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Live Systems & Security Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Trạng Thái An Ninh Khóa Thông Minh &amp; Cảm Biến
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Bộ phát tín hiệu trung tâm (Zigbee Mesh)</p>
                <p className="text-[11px] text-slate-400">Kết nối toàn bộ ổ khóa thông minh 24/7</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Hoạt động
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Môi trường kho (Nhiệt độ &amp; Độ ẩm)</p>
                <p className="text-[11px] text-slate-400">24°C • Độ ẩm 52% (Đạt chuẩn kho mát cao cấp)</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Chuẩn ISO
              </span>
            </div>
          </div>
        </div>

        {/* Facility Standards & Security Summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 tracking-wider">
              An Toàn &amp; Tiêu Chuẩn Cơ Sở
            </span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">
              Giám Sát Vận Hành &amp; Quản Trị Độc Lập
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Toàn bộ dữ liệu đặt kho, phân công ca trực, bảng giá và gia hạn hợp đồng được quản lý tập trung và phân quyền nghiêm ngặt dành riêng cho cấp Quản lý cơ sở.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('facility')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Xem Sơ Đồ Cơ Sở</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
