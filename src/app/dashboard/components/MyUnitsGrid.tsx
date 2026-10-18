'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  CalendarCheck,
  Trash2,
} from 'lucide-react';
import { CustomerUnit, CustomerUser } from '../types';

interface MyUnitsGridProps {
  units: CustomerUnit[];
  reservations?: any[];
  customerUser?: CustomerUser | null;
  onSelectUnit: (unit: CustomerUnit) => void;
  onOpenGuestPass: (unit: CustomerUnit) => void;
  onOpenExtendLease: (unit: CustomerUnit) => void;
  onOpenReportIncident: (unit: CustomerUnit) => void;
  onCancelReservation?: (reservationId: number) => void | Promise<void>;
}

export default function MyUnitsGrid({
  units,
  reservations = [],
  customerUser,
  onSelectUnit,
  onOpenGuestPass,
  onOpenExtendLease,
  onOpenReportIncident,
  onCancelReservation,
}: MyUnitsGridProps) {
  // State ẩn/hiện mã PIN trực tiếp trên từng thẻ
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  const togglePin = (unitId: string) => {
    setVisiblePins(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const pendingReservations = (reservations || []).filter(
    (r: any) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'EXPIRED'
  );

  // Tab con trong trang "Ô kho của tôi": Ô kho đang thuê (rented) vs Đơn đặt giữ chỗ (reservations)
  const [activeSubTab, setActiveSubTab] = useState<'rented' | 'reservations'>(() => {
    if (units.length === 0 && pendingReservations.length > 0) {
      return 'reservations';
    }
    return 'rented';
  });

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto animate-slide-up-fade">
      {/* Top Welcome Header (Light & Minimalist) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chào mừng trở lại, {customerUser?.fullName || 'Quý khách'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các ô kho lưu trữ đang thuê và các đơn đặt giữ chỗ của bạn
          </p>
        </div>

        {/* Quick Stats Pill Cards (Bấm vào để chuyển Tab nhanh) */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <div
            onClick={() => setActiveSubTab('rented')}
            className={`cursor-pointer transition-all active:scale-95 border rounded-2xl px-4 py-2.5 shadow-2xs flex items-center gap-3 ${
              activeSubTab === 'rented'
                ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/20'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
            title="Xem danh sách Ô kho đang thuê"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              {units.length}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Ô kho đang thuê</div>
              <div className="text-sm font-bold text-slate-900">{units.length} kho</div>
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('reservations')}
            className={`cursor-pointer transition-all active:scale-95 border rounded-2xl px-4 py-2.5 shadow-2xs flex items-center gap-3 ${
              activeSubTab === 'reservations'
                ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20'
                : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/20'
            }`}
            title="Xem danh sách Đơn đặt giữ chỗ"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              {pendingReservations.length}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Đơn đặt giữ chỗ</div>
              <div className="text-sm font-bold text-indigo-600">{pendingReservations.length} đơn</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs flex items-center gap-3 hidden sm:flex">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              {units.filter(u => u.status === 'active').length}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Hoạt động tốt</div>
              <div className="text-sm font-bold text-emerald-600">
                {units.filter(u => u.status === 'active').length} kho
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2 TABS CHÍNH: Ô KHO ĐANG THUÊ & ĐƠN ĐẶT GIỮ CHỖ ================= */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('rented')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'rented'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Boxes className={`w-4 h-4 ${activeSubTab === 'rented' ? 'text-blue-600' : 'text-slate-500'}`} />
          <span>Ô kho đang thuê</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeSubTab === 'rented'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {units.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reservations')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'reservations'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CalendarCheck className={`w-4 h-4 ${activeSubTab === 'reservations' ? 'text-indigo-600' : 'text-slate-500'}`} />
          <span>Đơn đặt giữ chỗ</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeSubTab === 'reservations'
                ? 'bg-indigo-100 text-indigo-700'
                : pendingReservations.length > 0
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {pendingReservations.length}
          </span>
          {pendingReservations.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: Ô KHO ĐANG THUÊ ================= */}
      {activeSubTab === 'rented' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                Danh sách Ô kho đang thuê ({units.length})
              </h2>
              <p className="text-xs text-slate-500">Mỗi thẻ hiển thị thông tin hợp đồng, kỳ hạn thanh toán và mã khóa Smart Lock</p>
            </div>
          </div>

          {units.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Boxes className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chưa có ô kho nào được kích hoạt hợp đồng</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
                  {pendingReservations.length > 0
                    ? `Bạn đang có ${pendingReservations.length} đơn đặt giữ chỗ đã cọc. Sau khi hoàn tất thủ tục bàn giao tại cơ sở, hợp đồng sẽ xuất hiện tại đây.`
                    : 'Bạn hiện chưa thuê ô kho nào trên hệ thống. Hãy tìm kiếm ngăn kho phù hợp gần bạn để đặt giữ chỗ ngay.'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                {pendingReservations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('reservations')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    <span>Xem {pendingReservations.length} đơn đặt giữ chỗ</span>
                  </button>
                )}
                <Link
                  href="/locations"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition cursor-pointer"
                >
                  <span>Tìm &amp; Đặt Thuê Ngăn Kho Mới</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {units.map((unit) => {
                const isPinVisible = !!visiblePins[unit.id];

                return (
                  <div
                    key={unit.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-blue-500/40"
                  >
                    {/* 1. Header Thẻ: Số ô kho, Kích thước & Nhãn trạng thái */}
                    <div className="p-5 sm:p-6 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                            Mã ô kho
                          </span>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {unit.unitNumber}
                          </h3>
                        </div>
                        {renderStatusBadge(unit.status, unit.statusLabel, unit.daysRemaining)}
                      </div>

                      <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span>{unit.size}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Diện tích: {unit.area} ({unit.dimensions})
                      </div>
                    </div>

                    {/* 2. Sơ đồ mặt bằng Mini (Floor plan / Facility Location indicator) */}
                    <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[190px]" title={unit.facilityName}>
                          {unit.floor} • {unit.zone}
                        </span>
                      </div>

                      {/* Visual mini blueprint representation */}
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-600">
                        <span className="w-2 h-2 rounded-xs bg-blue-600" />
                        <span>#{unit.unitNumber.replace('Ô ', '')}</span>
                      </div>
                    </div>

                    {/* 3. Thông tin tài chính & Mã khóa PIN nhanh */}
                    <div className="p-5 sm:p-6 space-y-3.5 text-xs flex-1">
                      {/* Ngày thanh toán tiếp theo & Giá thuê */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Kỳ hạn tới:</span>
                          <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {unit.nextBillingDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Giá thuê:</span>
                          <span className="font-extrabold text-orange-600 flex items-center gap-1 mt-0.5 tabular-nums">
                            <CreditCard className="w-3 h-3 text-orange-500" />
                            {unit.monthlyRent}
                          </span>
                        </div>
                      </div>

                      {/* Mã PIN mở cửa Smart Lock */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 text-white">
                        <div className="flex items-center gap-2.5">
                          <Key className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                              Mã Smart Lock
                            </span>
                            <span className="tabular-nums text-base font-extrabold tracking-widest text-amber-400 font-mono">
                              {isPinVisible ? unit.mainPin : '••••••'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePin(unit.id)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title={isPinVisible ? 'Ẩn mã' : 'Hiện mã'}
                        >
                          {isPinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Cảnh báo nếu ô kho quá hạn hoặc sắp hết hạn */}
                      {unit.status === 'overdue' && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Hợp đồng đã quá hạn. Vui lòng gia hạn để tránh tạm khóa phòng.</span>
                        </div>
                      )}
                      {unit.status === 'expiring' && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Hợp đồng sẽ kết thúc trong {unit.daysRemaining} ngày nữa.</span>
                        </div>
                      )}
                    </div>

                    {/* 4. Thao tác nhanh ở cuối thẻ */}
                    <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* [ Tạo mã cho khách tạm thời ] */}
                        <button
                          type="button"
                          onClick={() => onOpenGuestPass(unit)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Mã khách</span>
                        </button>

                        {/* [ Gia hạn hợp đồng ] */}
                        <button
                          type="button"
                          onClick={() => onOpenExtendLease(unit)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Gia hạn</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* [ Báo cáo sự cố ] */}
                        <button
                          type="button"
                          onClick={() => onOpenReportIncident(unit)}
                          className="px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Báo cáo sự cố với ô kho này"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>

                        {/* [ Xem chi tiết ] -> Đi sâu vào Trang B */}
                        <button
                          type="button"
                          onClick={() => onSelectUnit(unit)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
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
          )}
        </div>
      )}

      {/* ================= TAB 2: ĐƠN ĐẶT GIỮ CHỖ ================= */}
      {activeSubTab === 'reservations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                Đơn Đặt Giữ Chỗ Chờ Nhận Kho ({pendingReservations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Các đơn đã đặt cọc thành công. Vui lòng đến đúng lịch hẹn để nhân viên cơ sở làm thủ tục bàn giao và kích hoạt Smart Lock
              </p>
            </div>

            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95 w-fit"
            >
              <span>+ Đặt Thêm Kho Khác</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>


          {pendingReservations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Không có đơn đặt giữ chỗ nào đang chờ</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
                  Bạn hiện không có đơn giữ chỗ nào đang chờ làm thủ tục nhận kho. Bạn có thể tìm kiếm và đặt thêm kho lưu trữ mới bất cứ lúc nào.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/locations"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
                >
                  <span>Tìm &amp; Đặt Thuê Ngăn Kho Mới</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pendingReservations.map((res: any) => {
                const firstItem = res.items?.[0] || {};
                const unitType = firstItem.unitType || {};
                const unit = firstItem.unit || {};
                const depositVal = firstItem.depositAmount ? Number(firstItem.depositAmount) : 0;
                const monthlyPrice = firstItem.price ? Number(firstItem.price) : 0;
                const isConfirmed = res.status === 'CONFIRMED' || res.status === 'ARRIVED';

                return (
                  <div
                    key={res.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header đơn */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-black text-indigo-600 text-sm tracking-tight">
                              {res.reservationCode}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {isConfirmed ? 'Đã Thanh Toán Cọc 100%' : 'Chờ Thanh Toán'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-lg">
                            {unitType.name || 'Ngăn kho lưu trữ'} • Ô {unit.unitNumber || 'Dự kiến'}
                          </h3>
                        </div>

                        {onCancelReservation && (
                          <button
                            type="button"
                            onClick={() => onCancelReservation(res.id)}
                            className="text-xs text-slate-400 hover:text-rose-600 font-medium transition flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-rose-50"
                            title="Hủy đơn giữ chỗ (Không hoàn lại cọc)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hủy đơn</span>
                          </button>
                        )}
                      </div>

                      {/* Bảng chi tiết */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cơ Sở Lưu Trữ</p>
                          <p className="font-bold text-slate-800 line-clamp-1 mt-0.5">{res.facility?.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lịch Hẹn Nhận Kho</p>
                          <p className="font-black text-indigo-700 tabular-nums mt-0.5">
                            {res.appointmentDate
                              ? new Date(res.appointmentDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                              : 'Chưa đặt'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tiền thuê tháng</p>
                          <p className="font-bold text-slate-800 tabular-nums mt-0.5">
                            {monthlyPrice > 0 ? `${monthlyPrice.toLocaleString('vi-VN')} đ/tháng` : 'Theo biểu phí'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tiền cọc đã thanh toán</p>
                          <p className="font-black text-emerald-600 tabular-nums mt-0.5">
                            {depositVal.toLocaleString('vi-VN')} đ
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 col-span-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="line-clamp-1">{res.facility?.address || 'Chi nhánh tự quản'}</span>
                          </span>
                          <span className="text-slate-500 font-semibold shrink-0">Vị trí: {unit.floor || 'Tầng 1'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-400 italic text-[11px]">
                        * Tiền cọc sẽ được cấn trừ trực tiếp vào hóa đơn tiền thuê tháng đầu tiên.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Helper render Nhãn trạng thái (Status Badges)
  function renderStatusBadge(status: CustomerUnit['status'], label: string, daysRemaining: number) {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {label}
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {label} ({daysRemaining} ngày)
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-300 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            {label}
          </span>
        );
    }
  }
}
