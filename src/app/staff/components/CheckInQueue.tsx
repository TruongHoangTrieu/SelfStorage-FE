'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Check } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface CheckInQueueProps {
  appointments: CheckInAppointment[];
  onStartCheckIn: (apt: CheckInAppointment) => void;
  selectedAppointmentId: string;
}

export default function CheckInQueue({
  appointments,
  onStartCheckIn,
  selectedAppointmentId,
}: CheckInQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'arrived' | 'in_progress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline');

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      arrived: appointments.filter(a => a.status === 'arrived').length,
      inProgress: appointments.filter(a => a.status === 'in_progress').length,
      completed: appointments.filter(a => a.status === 'completed').length,
    };
  }, [appointments]);

  // Lọc theo tìm kiếm và trạng thái
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchSearch =
        apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.phone.includes(searchQuery) ||
        apt.assignedUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || apt.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

  // Phân theo khung giờ
  const groupedAppointments = useMemo(() => {
    const morningSlots = filteredAppointments.filter(a => a.timeCategory === 'morning');
    const afternoonSlots = filteredAppointments.filter(a => a.timeCategory === 'afternoon');
    return { morningSlots, afternoonSlots };
  }, [filteredAppointments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-slide-up-fade">
      {/* 1. Thanh đo lường nhanh (Metrics Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng lịch hẹn</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lượt check-in hôm nay</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs bg-amber-50/20">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center justify-between">
            <span>Chờ xử lý</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{stats.pending}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Khách chưa đến quầy</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs bg-indigo-50/20">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center justify-between">
            <span>Đã đến quầy</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{stats.arrived}</div>
          <div className="text-[11px] text-indigo-700/80 mt-0.5">Sẵn sàng nhận kho</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#4f39f6]/20 shadow-2xs bg-[#4f39f6]/5">
          <div className="text-xs font-semibold text-[#4f39f6] uppercase tracking-wider flex items-center justify-between">
            <span>Đang xử lý</span>
            <span className="w-2 h-2 rounded-full bg-[#4f39f6] animate-ping" />
          </div>
          <div className="text-2xl font-bold text-[#4f39f6] mt-1">{stats.inProgress}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">Đang bàn giao tại chỗ</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs bg-emerald-50/20">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
            <span>Hoàn tất</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{stats.completed}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Đã bàn giao ô kho</div>
        </div>
      </div>

      {/* 2. Thanh Tìm kiếm & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Tên, SĐT, Mã đặt (#SS-BK) hoặc Ô kho..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#4f39f6] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Lọc theo Nhãn trạng thái */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {(['all', 'pending', 'arrived', 'in_progress', 'completed'] as const).map((st) => {
            const labelMap = {
              all: 'Tất cả',
              pending: 'Chờ xử lý',
              arrived: 'Đã đến',
              in_progress: 'Đang xử lý',
              completed: 'Hoàn tất'
            };
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#4f39f6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labelMap[st]}
              </button>
            );
          })}
        </div>

        {/* Chuyển đổi Khung giờ / Kanban */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Khung giờ
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Bảng Kanban
          </button>
        </div>
      </div>

      {/* 3A. Chế độ xem theo Khung giờ (Timeline) */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {/* Buổi Sáng */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800">Khung giờ buổi sáng (08:00 - 12:00 SA)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {groupedAppointments.morningSlots.length} lượt hẹn
                </span>
              </div>
              <span className="text-xs text-slate-400">Ưu tiên phục vụ khách đúng giờ hẹn</span>
            </div>

            <div className="divide-y divide-slate-100">
              {groupedAppointments.morningSlots.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không có lượt nhận kho nào phù hợp với bộ lọc.
                </div>
              ) : (
                groupedAppointments.morningSlots.map((apt) => renderAppointmentRow(apt))
              )}
            </div>
          </div>

          {/* Buổi Chiều */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800">Khung giờ buổi chiều (13:00 - 18:00 CH)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {groupedAppointments.afternoonSlots.length} lượt hẹn
                </span>
              </div>
              <span className="text-xs text-slate-400">Kiểm tra sẵn trạng thái ô kho tầng 3</span>
            </div>

            <div className="divide-y divide-slate-100">
              {groupedAppointments.afternoonSlots.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không có lượt nhận kho nào trong buổi chiều phù hợp với bộ lọc.
                </div>
              ) : (
                groupedAppointments.afternoonSlots.map((apt) => renderAppointmentRow(apt))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3B. Chế độ xem Bảng Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
          {renderKanbanColumn('Chờ xử lý', 'pending', 'bg-slate-100 text-slate-700', 'border-t-4 border-amber-400')}
          {renderKanbanColumn('Đã đến quầy', 'arrived', 'bg-indigo-50 text-indigo-700', 'border-t-4 border-indigo-500')}
          {renderKanbanColumn('Đang xử lý', 'in_progress', 'bg-[#4f39f6]/10 text-[#4f39f6]', 'border-t-4 border-[#4f39f6]')}
          {renderKanbanColumn('Hoàn tất', 'completed', 'bg-emerald-50 text-emerald-700', 'border-t-4 border-emerald-500')}
        </div>
      )}
    </div>
  );

  // Helper render hàng lượt hẹn
  function renderAppointmentRow(apt: CheckInAppointment) {
    const isCurrent = apt.id === selectedAppointmentId && apt.status === 'in_progress';
    return (
      <div
        key={apt.id}
        className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/80 ${
          isCurrent ? 'bg-[#4f39f6]/5 border-l-4 border-[#4f39f6]' : ''
        }`}
      >
        {/* Left Info: Time & Customer */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200 shrink-0">
            <span className="text-xs text-slate-500 font-normal">Hẹn</span>
            <span className="text-xs font-bold">{apt.slotTime}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{apt.customerName}</span>
              <span className="text-xs text-slate-500 font-mono">({apt.phone})</span>
              {renderStatusBadge(apt.status)}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Ô {apt.assignedUnit} • {apt.preferredFloor}
              </span>
              <span>{apt.unitType} ({apt.unitSize})</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Cọc: Đã thanh toán 100%</span>
            </div>
          </div>
        </div>

        {/* Right Actions: Nút [ Bắt đầu nhận kho ] */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          {apt.status === 'completed' ? (
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Đã bàn giao lúc {apt.completedAt || '08:48'}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onStartCheckIn(apt)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <span>Bắt đầu nhận kho</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Helper render cột Kanban
  function renderKanbanColumn(
    title: string,
    status: CheckInAppointment['status'],
    badgeClass: string,
    borderClass: string
  ) {
    const items = filteredAppointments.filter(a => a.status === status);
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[450px] ${borderClass}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-800">{title}</h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {items.length}
            </span>
          </div>
        </div>

        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Không có đơn
            </div>
          ) : (
            items.map(apt => (
              <div
                key={apt.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#4f39f6]/40 hover:shadow-sm transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {apt.slotTime}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#4f39f6]">
                    #{apt.assignedUnit}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-xs">{apt.customerName}</div>
                  <div className="text-[11px] text-slate-500">{apt.phone}</div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                  {apt.unitType}
                </div>

                {status !== 'completed' && (
                  <button
                    onClick={() => onStartCheckIn(apt)}
                    className="w-full text-center py-1.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-lg transition-all mt-1"
                  >
                    Bắt đầu nhận kho →
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Helper render Nhãn trạng thái (Status Badges)
  function renderStatusBadge(status: CheckInAppointment['status']) {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ xử lý
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            Đã đến
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#4f39f6]/10 text-[#4f39f6] border border-[#4f39f6]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f39f6] animate-ping" />
            Đang xử lý
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Hoàn tất
          </span>
        );
    }
  }
}
