'use client';

import React, { useState } from 'react';
import {
  Boxes,
  MapPin,
  Calendar,
  CreditCard,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { CustomerUnit } from '../types';

interface MyUnitsGridProps {
  units: CustomerUnit[];
  onSelectUnit: (unit: CustomerUnit) => void;
  onOpenGuestPass: (unit: CustomerUnit) => void;
  onOpenExtendLease: (unit: CustomerUnit) => void;
  onOpenReportIncident: (unit: CustomerUnit) => void;
}

export default function MyUnitsGrid({
  units,
  onSelectUnit,
  onOpenGuestPass,
  onOpenExtendLease,
  onOpenReportIncident,
}: MyUnitsGridProps) {
  // State ẩn/hiện mã PIN trực tiếp trên từng thẻ
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  const togglePin = (unitId: string) => {
    setVisiblePins(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-slide-up-fade">
      {/* Top Welcome & Account Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#4f39f6]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-indigo-200 backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />
              <span>Cổng Quản Lý Tự Phục Vụ 24/7</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Chào mừng trở lại, Hải!
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Bạn hiện đang sở hữu <strong>{units.length} ô kho lưu trữ</strong> tại cơ sở Landmark 81. Bạn có thể mở khóa từ xa, tạo mã khách tạm thời hoặc gia hạn hợp đồng trực tuyến ngay bên dưới.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xs shrink-0">
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-white">{units.length}</div>
              <div className="text-xs text-slate-400">Ô kho của tôi</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-emerald-400">
                {units.filter(u => u.status === 'active').length}
              </div>
              <div className="text-xs text-slate-400">Hoạt động tốt</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-amber-400">
                {units.filter(u => u.status !== 'active').length}
              </div>
              <div className="text-xs text-slate-400">Cần chú ý</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dạng lưới (Grid) các Thẻ ô kho (Unit Cards) */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#4f39f6]" />
              Danh sách Ô kho đang thuê ({units.length})
            </h2>
            <p className="text-xs text-slate-500">Mỗi thẻ hiển thị tình trạng thực tế và sơ đồ vị trí tương ứng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {units.map((unit) => {
            const isPinVisible = !!visiblePins[unit.id];

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[#4f39f6]/40"
              >
                {/* 1. Header Thẻ: Số ô kho, Kích thước & Nhãn trạng thái */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                        Mã ô kho
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-[#4f39f6] transition-colors">
                        {unit.unitNumber}
                      </h3>
                    </div>
                    {renderStatusBadge(unit.status, unit.statusLabel, unit.daysRemaining)}
                  </div>

                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>{unit.size}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Diện tích: {unit.area} ({unit.dimensions})
                  </div>
                </div>

                {/* 2. Sơ đồ mặt bằng Mini (Floor plan / Facility Location indicator) */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-[#4f39f6] shrink-0" />
                    <span className="truncate max-w-[190px]" title={unit.facilityName}>
                      {unit.floor} • {unit.zone}
                    </span>
                  </div>

                  {/* Visual mini blueprint representation */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-600">
                    <span className="w-2 h-2 rounded-xs bg-[#4f39f6]" />
                    <span>Sơ đồ: #{unit.unitNumber.replace('Ô ', '')}</span>
                  </div>
                </div>

                {/* 3. Thông tin tài chính & Mã khóa PIN nhanh */}
                <div className="p-5 space-y-3.5 text-xs flex-1">
                  {/* Ngày thanh toán tiếp theo & Giá thuê */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngày thanh toán tới:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {unit.nextBillingDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Giá thuê hàng tháng:</span>
                      <span className="font-bold text-[#4f39f6] flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3 text-[#4f39f6]" />
                        {unit.monthlyRent}
                      </span>
                    </div>
                  </div>

                  {/* Mã PIN mở cửa Smart Lock */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#818cf8]" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Mã Smart Lock cá nhân
                        </span>
                        <span className="font-mono text-base font-bold tracking-widest text-[#818cf8]">
                          {isPinVisible ? unit.mainPin : '••••••'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePin(unit.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title={isPinVisible ? 'Ẩn mã' : 'Hiện mã'}
                    >
                      {isPinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Cảnh báo nếu ô kho quá hạn hoặc sắp hết hạn */}
                  {unit.status === 'overdue' && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Hợp đồng đã quá hạn 3 ngày. Vui lòng gia hạn để tránh tạm khóa truy cập.</span>
                    </div>
                  )}
                  {unit.status === 'expiring' && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Hợp đồng sẽ kết thúc trong 4 ngày nữa. Hãy gia hạn ngay hôm nay.</span>
                    </div>
                  )}
                </div>

                {/* 4. Thao tác nhanh ở cuối thẻ */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* [ Tạo mã cho khách tạm thời ] */}
                    <button
                      onClick={() => onOpenGuestPass(unit)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-[#4f39f6] rounded-xl transition-all shadow-2xs active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Mã khách</span>
                    </button>

                    {/* [ Gia hạn hợp đồng ] */}
                    <button
                      onClick={() => onOpenExtendLease(unit)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-[#4f39f6] rounded-xl transition-all shadow-2xs active:scale-95"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Gia hạn</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* [ Báo cáo sự cố ] */}
                    <button
                      onClick={() => onOpenReportIncident(unit)}
                      className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Báo cáo sự cố với ô kho này"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>

                    {/* [ Xem chi tiết ] -> Đi sâu vào Trang B */}
                    <button
                      onClick={() => onSelectUnit(unit)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl transition-all shadow-md shadow-[#4f39f6]/20 active:scale-95"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Helper render Nhãn trạng thái (Status Badges)
  function renderStatusBadge(status: CustomerUnit['status'], label: string, daysRemaining: number) {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {label}
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {label} ({daysRemaining} ngày)
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            {label}
          </span>
        );
    }
  }
}
