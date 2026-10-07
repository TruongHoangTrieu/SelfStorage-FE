'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  Check,
  Lock,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
  UserX,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { CheckInAppointment } from '../types';
import RescheduleModal from './RescheduleModal';
import NoShowModal from './NoShowModal';
import ContactModal from './ContactModal';

/**
 * Phân tích trạng thái thời gian lịch hẹn:
 * - Đúng hẹn (On Time): Trong khung giờ hoặc trước giờ hẹn <= 60p
 * - Trễ hẹn (Late): Quá giờ hẹn bắt đầu > 15 phút mà chưa check-in
 * - Chưa tới giờ (Upcoming): Còn hơn 60 phút nữa
 */
export function getAppointmentScheduleStatus(apt: CheckInAppointment): {
  isLate: boolean;
  lateMinutes: number;
  isOnTime: boolean;
  isUpcoming: boolean;
  label: string;
  badgeClass: string;
} {
  if (apt.status === 'completed') {
    return {
      isLate: false,
      lateMinutes: 0,
      isOnTime: false,
      isUpcoming: false,
      label: 'Đã hoàn tất',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    };
  }

  if (apt.status === 'cancelled' || apt.status === 'expired') {
    return {
      isLate: false,
      lateMinutes: 0,
      isOnTime: false,
      isUpcoming: false,
      label: 'Đã hủy / No-show',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    };
  }

  if (apt.status === 'in_progress') {
    return {
      isLate: false,
      lateMinutes: 0,
      isOnTime: true,
      isUpcoming: false,
      label: 'Đang bàn giao',
      badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    };
  }

  // 1. Phân giải thời gian cuộc hẹn
  let apptDate: Date | null = null;
  if (apt.appointmentDateRaw) {
    const parsed = new Date(apt.appointmentDateRaw);
    if (!isNaN(parsed.getTime())) {
      apptDate = parsed;
    }
  }

  if (!apptDate && apt.startDate) {
    let day = 0,
      month = 0,
      year = 0;
    if (apt.startDate.includes('/')) {
      const parts = apt.startDate.split('/').map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        day = parts[0];
        month = parts[1] - 1;
        year = parts[2];
      }
    } else if (apt.startDate.includes('-')) {
      const parts = apt.startDate.split('-').map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        day = parts[0];
        month = parts[1] - 1;
        year = parts[2];
      }
    }

    if (year > 0 && day > 0) {
      let hour = 9,
        minute = 0;
      if (apt.slotTime) {
        const m = apt.slotTime.match(/(\d{1,2}):(\d{2})/);
        if (m) {
          hour = parseInt(m[1], 10);
          minute = parseInt(m[2], 10);
        }
      }
      const parsed = new Date(year, month, day, hour, minute, 0);
      if (!isNaN(parsed.getTime())) {
        apptDate = parsed;
      }
    }
  }

  if (!apptDate) {
    return {
      isLate: false,
      lateMinutes: 0,
      isOnTime: true,
      isUpcoming: false,
      label: 'Đúng hẹn',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - apptDate.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  // Trễ hẹn: Quá giờ hẹn bắt đầu hơn 15 phút
  if (diffMinutes > 15) {
    let lateText = `Trễ ${diffMinutes} phút`;
    if (diffMinutes >= 120) {
      const hours = Math.floor(diffMinutes / 60);
      lateText = `Trễ ${hours} tiếng`;
    }
    return {
      isLate: true,
      lateMinutes: diffMinutes,
      isOnTime: false,
      isUpcoming: false,
      label: `⚠️ ${lateText}`,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-300 font-bold',
    };
  }

  // Đúng giờ: Trong vòng [-60p, +15p]
  if (diffMinutes >= -60 && diffMinutes <= 15) {
    return {
      isLate: false,
      lateMinutes: 0,
      isOnTime: true,
      isUpcoming: false,
      label: '✓ Đúng hẹn',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
    };
  }

  // Chưa tới giờ hẹn: Trước giờ hẹn hơn 60p
  return {
    isLate: false,
    lateMinutes: 0,
    isOnTime: false,
    isUpcoming: true,
    label: '🕒 Chưa tới giờ',
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
}

/**
 * Kiểm tra xem đơn hẹn có được phép bắt đầu nhận kho không.
 * Quy định: Nút chỉ mở trước giờ hẹn tối đa 1 tiếng (60 phút).
 * Nếu khách trễ hẹn, nút VẪN MỞ để nhân viên đón tiếp ngay khi khách có mặt!
 */
export function checkAppointmentEligibility(apt: CheckInAppointment): {
  allowed: boolean;
  reason?: string;
} {
  if (apt.status === 'completed') {
    return { allowed: false, reason: 'Đã hoàn tất bàn giao' };
  }

  if (apt.status === 'cancelled' || apt.status === 'expired') {
    return { allowed: false, reason: 'Đơn đã bị hủy / quá hạn' };
  }

  if (apt.status === 'in_progress') {
    return { allowed: true };
  }

  let apptDate: Date | null = null;
  if (apt.appointmentDateRaw) {
    const parsed = new Date(apt.appointmentDateRaw);
    if (!isNaN(parsed.getTime())) apptDate = parsed;
  }

  if (!apptDate && apt.startDate) {
    let day = 0,
      month = 0,
      year = 0;
    if (apt.startDate.includes('/')) {
      const parts = apt.startDate.split('/').map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        day = parts[0];
        month = parts[1] - 1;
        year = parts[2];
      }
    } else if (apt.startDate.includes('-')) {
      const parts = apt.startDate.split('-').map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        day = parts[0];
        month = parts[1] - 1;
        year = parts[2];
      }
    }

    if (year > 0 && day > 0) {
      let hour = 9,
        minute = 0;
      if (apt.slotTime) {
        const m = apt.slotTime.match(/(\d{1,2}):(\d{2})/);
        if (m) {
          hour = parseInt(m[1], 10);
          minute = parseInt(m[2], 10);
        }
      }
      const parsed = new Date(year, month, day, hour, minute, 0);
      if (!isNaN(parsed.getTime())) apptDate = parsed;
    }
  }

  if (!apptDate) {
    return { allowed: true };
  }

  const now = new Date();
  const diffMs = apptDate.getTime() - now.getTime();
  const oneHourMs = 60 * 60 * 1000;

  // Nếu còn hơn 1 tiếng nữa mới tới giờ hẹn: Khóa nút
  if (diffMs > oneHourMs) {
    return {
      allowed: false,
      reason: 'Chỉ mở trước giờ hẹn 1 tiếng',
    };
  }

  return { allowed: true };
}

interface CheckInQueueProps {
  appointments: CheckInAppointment[];
  onStartCheckIn: (apt: CheckInAppointment) => void;
  selectedAppointmentId: string;
  onReschedule?: (
    apt: CheckInAppointment,
    newDateIso: string,
    newSlotTime: string,
    notes?: string
  ) => Promise<void>;
  onCancelOrNoShow?: (
    apt: CheckInAppointment,
    reason: string,
    depositHandling?: 'forfeit'
  ) => Promise<void>;
}

export default function CheckInQueue({
  appointments,
  onStartCheckIn,
  selectedAppointmentId,
  onReschedule,
  onCancelOrNoShow,
}: CheckInQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'confirmed' | 'late' | 'in_progress' | 'completed' | 'cancelled'
  >('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline');

  // Modal states
  const [contactModalApt, setContactModalApt] = useState<CheckInAppointment | null>(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState<CheckInAppointment | null>(null);
  const [noShowModalApt, setNoShowModalApt] = useState<CheckInAppointment | null>(null);

  // Thống kê nhanh kèm số lượng đơn trễ hẹn
  const stats = useMemo(() => {
    const todayCount = appointments.filter((a) => a.dateDisplay === 'Hôm nay').length;

    let lateCount = 0;
    let confirmedCount = 0;

    appointments.forEach((a) => {
      if (a.status === 'confirmed' || a.status === 'arrived' || a.status === 'pending') {
        const sched = getAppointmentScheduleStatus(a);
        if (sched.isLate) {
          lateCount++;
        } else {
          confirmedCount++;
        }
      }
    });

    return {
      total: appointments.length,
      todayCount,
      confirmed: confirmedCount,
      lateCount,
      inProgress: appointments.filter((a) => a.status === 'in_progress').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'expired').length,
    };
  }, [appointments]);

  // Lọc theo tìm kiếm và trạng thái
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchSearch =
        apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.phone.includes(searchQuery) ||
        apt.assignedUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.startDate && apt.startDate.includes(searchQuery));

      if (!matchSearch) return false;

      const sched = getAppointmentScheduleStatus(apt);

      if (statusFilter === 'all') return true;
      if (statusFilter === 'late') {
        return sched.isLate && apt.status !== 'completed' && apt.status !== 'cancelled';
      }
      if (statusFilter === 'confirmed') {
        return (
          (apt.status === 'confirmed' || apt.status === 'arrived' || apt.status === 'pending') &&
          !sched.isLate
        );
      }
      if (statusFilter === 'in_progress') return apt.status === 'in_progress';
      if (statusFilter === 'completed') return apt.status === 'completed';
      if (statusFilter === 'cancelled') return apt.status === 'cancelled' || apt.status === 'expired';

      return true;
    });
  }, [appointments, searchQuery, statusFilter]);

  // Phân theo ca sáng / chiều
  const groupedAppointments = useMemo(() => {
    const morningSlots = filteredAppointments.filter((a) => a.timeCategory === 'morning');
    const afternoonSlots = filteredAppointments.filter((a) => a.timeCategory === 'afternoon');
    return { morningSlots, afternoonSlots };
  }, [filteredAppointments]);

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto">
      {/* 1. Thanh đo lường nhanh (Metrics Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tổng lịch hẹn */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tổng lịch hẹn
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.todayCount} hôm nay • {Math.max(0, stats.total - stats.todayCount)} ngày khác
          </div>
        </div>

        {/* Chờ đón tiếp (Đúng hẹn) */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs bg-blue-50/20">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center justify-between">
            <span>Chờ đón tiếp</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{stats.confirmed}</div>
          <div className="text-[11px] text-blue-700/80 mt-0.5">Sẵn sàng phục vụ đúng hẹn</div>
        </div>

        {/* Trễ hẹn / Cần gọi (Cảnh báo nghiệp vụ) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            stats.lateCount > 0
              ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Trễ hẹn / Cần gọi</span>
            </span>
            {stats.lateCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">{stats.lateCount}</div>
          <div className="text-[11px] text-rose-700/90 mt-0.5">
            {stats.lateCount > 0 ? 'Bấm để lọc đơn cần liên hệ' : 'Không có đơn trễ giờ'}
          </div>
        </div>

        {/* Đang xử lý */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs bg-indigo-50/20">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center justify-between">
            <span>Đang xử lý</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.inProgress}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">Đang bàn giao tại chỗ</div>
        </div>

        {/* Hoàn tất */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs bg-emerald-50/20">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
            <span>Hoàn tất</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{stats.completed}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Đã bàn giao ô kho</div>
        </div>
      </div>

      {/* 2. Thanh Tìm kiếm & Bộ lọc trạng thái */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Tên, SĐT, Mã đơn (#SS-BK) hoặc Ô kho..."
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
          {(
            [
              { key: 'all', label: 'Tất cả' },
              { key: 'confirmed', label: 'Chờ đón tiếp' },
              { key: 'late', label: `Trễ hẹn` },
              { key: 'in_progress', label: 'Đang xử lý' },
              { key: 'completed', label: 'Hoàn tất' },
              { key: 'cancelled', label: `Đã hủy` },
            ] as const
          ).map((item) => {
            const isActive = statusFilter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? item.key === 'late'
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'bg-[#4f39f6] text-white shadow-xs'
                    : item.key === 'late' && stats.lateCount > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Chuyển đổi Khung giờ / Kanban */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Khung giờ
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
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
                <span className="font-bold text-sm text-slate-800">
                  Khung giờ buổi sáng (08:00 - 12:00)
                </span>
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
                <span className="font-bold text-sm text-slate-800">
                  Khung giờ buổi chiều (13:00 - 18:00)
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {groupedAppointments.afternoonSlots.length} lượt hẹn
                </span>
              </div>
              <span className="text-xs text-slate-400">Kiểm tra sẵn sàng trạng thái ô kho</span>
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
          {renderKanbanColumn(
            'Chờ đón tiếp (Đúng hẹn)',
            'confirmed',
            'bg-blue-50 text-blue-700',
            'border-t-4 border-blue-500'
          )}
          {renderKanbanColumn(
            '⚠️ Trễ hẹn / Cần gọi',
            'late',
            'bg-rose-50 text-rose-700',
            'border-t-4 border-rose-500'
          )}
          {renderKanbanColumn(
            'Đang xử lý tại chỗ',
            'in_progress',
            'bg-indigo-50 text-indigo-700',
            'border-t-4 border-indigo-600'
          )}
          {renderKanbanColumn(
            'Hoàn tất bàn giao',
            'completed',
            'bg-emerald-50 text-emerald-700',
            'border-t-4 border-emerald-500'
          )}
        </div>
      )}

      {/* MODALS */}
      <ContactModal
        isOpen={!!contactModalApt}
        onClose={() => setContactModalApt(null)}
        appointment={contactModalApt}
      />

      <RescheduleModal
        isOpen={!!rescheduleModalApt}
        onClose={() => setRescheduleModalApt(null)}
        appointment={rescheduleModalApt}
        onConfirm={async (apt, newIsoDate, newSlotTime, notes) => {
          if (onReschedule) {
            await onReschedule(apt, newIsoDate, newSlotTime, notes);
          }
        }}
      />

      <NoShowModal
        isOpen={!!noShowModalApt}
        onClose={() => setNoShowModalApt(null)}
        appointment={noShowModalApt}
        onConfirm={async (apt, reason, depositHandling) => {
          if (onCancelOrNoShow) {
            await onCancelOrNoShow(apt, reason, depositHandling);
          }
        }}
      />
    </div>
  );

  // Helper render hàng lượt hẹn (Timeline row)
  function renderAppointmentRow(apt: CheckInAppointment) {
    const isCurrent = apt.id === selectedAppointmentId && apt.status === 'in_progress';
    const isToday = apt.dateDisplay === 'Hôm nay';
    const isTomorrow = apt.dateDisplay?.startsWith('Ngày mai');
    const sched = getAppointmentScheduleStatus(apt);
    const isLate = sched.isLate && apt.status !== 'completed' && apt.status !== 'cancelled';
    const isInactive = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'expired';

    return (
      <div
        key={apt.id}
        className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/80 ${
          isCurrent
            ? 'bg-blue-50/40 border-l-4 border-blue-600'
            : isLate
            ? 'bg-rose-50/20 border-l-4 border-rose-500'
            : ''
        }`}
      >
        {/* Left Info: Ngày Hẹn, Khung Giờ & Thông Tin Khách */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`flex flex-col items-center justify-center min-w-[108px] px-2.5 py-2 rounded-xl font-bold border shrink-0 text-center ${
              isLate
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {/* Tag Ngày Hẹn */}
            <span
              className={`text-[10px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md mb-1 ${
                isToday
                  ? 'bg-blue-600 text-white'
                  : isTomorrow
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {apt.dateDisplay || apt.startDate}
            </span>
            <span className="text-xs font-black text-slate-900 tabular-nums">{apt.slotTime}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{apt.customerName}</span>
              <span className="text-xs text-slate-500 tabular-nums">({apt.phone})</span>

              {/* Status Badge */}
              {renderStatusBadge(apt)}

              {/* Tag Trễ Hẹn / Đúng Hẹn */}
              {isLate ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {sched.label}
                </span>
              ) : sched.isOnTime && apt.status !== 'completed' && apt.status !== 'in_progress' ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {sched.label}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Ô {apt.assignedUnit} • {apt.preferredFloor}
              </span>
              <span>
                {apt.unitType} ({apt.unitSize})
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">
                {apt.depositStatus === 'paid' ? 'Cọc: Đã thanh toán 100%' : 'Chưa đặt cọc'}
              </span>
              <span>•</span>
              <span className="text-slate-500 font-medium">
                Ngày nhận: <strong className="text-slate-800 font-semibold">{apt.startDate}</strong>
              </span>

              {apt.cancelReason && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-medium italic">
                    Lý do hủy: {apt.cancelReason}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Liên Hệ, Dời Lịch, Báo Vắng, Nhận Kho */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
          {apt.status === 'completed' ? (
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Đã bàn giao lúc {apt.completedAt || '08:48'}
              </span>
            </div>
          ) : apt.status === 'cancelled' || apt.status === 'expired' ? (
            <div className="text-right">
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Đã hủy / Nhả ô kho
              </span>
            </div>
          ) : (
            <>
              {/* Nút Gọi / SMS, Dời Lịch, Báo Vắng: Chỉ hiển thị khi TRỄ HẸN (isLate) */}
              {isLate && (
                <>
                  {/* Nút Gọi / SMS */}
                  <button
                    type="button"
                    onClick={() => setContactModalApt(apt)}
                    title="Gọi điện hoặc sao chép SMS nhắc hẹn"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Liên hệ</span>
                  </button>

                  {/* Nút Dời Lịch Hẹn */}
                  <button
                    type="button"
                    onClick={() => setRescheduleModalApt(apt)}
                    title="Dời sang ca hoặc ngày khác khi khách bận"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dời lịch</span>
                  </button>

                  {/* Nút Báo Vắng Mặt / Hủy Giữ Chỗ (No-show) */}
                  <button
                    type="button"
                    onClick={() => setNoShowModalApt(apt)}
                    title="Khách không đến quá 60 phút, hủy đơn và giải phóng kho"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-xl border border-rose-200 transition-all cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>Báo vắng</span>
                  </button>
                </>
              )}

              {/* Nút Bắt đầu nhận kho */}
              {(() => {
                const eligibility = checkAppointmentEligibility(apt);
                if (!eligibility.allowed) {
                  return (
                    <button
                      type="button"
                      disabled
                      title={eligibility.reason || 'Chỉ mở trước giờ hẹn 1 tiếng'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed select-none shadow-none"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nhận kho</span>
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => onStartCheckIn(apt)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    <span>Bắt đầu nhận kho</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                );
              })()}
            </>
          )}
        </div>
      </div>
    );
  }

  // Helper render cột Kanban
  function renderKanbanColumn(
    title: string,
    columnType: 'confirmed' | 'late' | 'in_progress' | 'completed',
    badgeClass: string,
    borderClass: string
  ) {
    const items = appointments.filter((a) => {
      const sched = getAppointmentScheduleStatus(a);
      if (columnType === 'late') {
        return sched.isLate && a.status !== 'completed' && a.status !== 'cancelled';
      }
      if (columnType === 'confirmed') {
        return (
          (a.status === 'confirmed' || a.status === 'arrived' || a.status === 'pending') &&
          !sched.isLate
        );
      }
      if (columnType === 'in_progress') return a.status === 'in_progress';
      if (columnType === 'completed') return a.status === 'completed';
      return false;
    });

    return (
      <div
        className={`bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[480px] ${borderClass}`}
      >
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
            <div className="text-center py-12 text-xs text-slate-400">Không có đơn nào</div>
          ) : (
            items.map((apt) => {
              const sched = getAppointmentScheduleStatus(apt);
              const isLate = sched.isLate && apt.status !== 'completed' && apt.status !== 'cancelled';
              return (
                <div
                  key={apt.id}
                  className={`p-3.5 rounded-xl border bg-slate-50 hover:bg-white hover:shadow-xs transition-all space-y-2.5 ${
                    columnType === 'late'
                      ? 'border-rose-200 hover:border-rose-400'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {apt.dateDisplay ? `${apt.dateDisplay} • ` : ''}
                      {apt.slotTime}
                    </span>
                    <span className="tabular-nums text-[11px] font-bold text-blue-600">
                      #{apt.assignedUnit}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-xs">{apt.customerName}</div>
                    <div className="text-[11px] text-slate-500">{apt.phone}</div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span>{apt.unitType}</span>
                    <span className="text-emerald-700 font-semibold text-[10px]">
                      {apt.depositStatus === 'paid' ? 'Đã cọc' : 'Chưa cọc'}
                    </span>
                  </div>

                  {/* Kanban Quick Action Buttons: Chỉ hiện khi trễ hẹn */}
                  {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      {isLate && (
                        <>
                          <button
                            type="button"
                            onClick={() => setContactModalApt(apt)}
                            title="Gọi / Nhắc hẹn"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 cursor-pointer transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRescheduleModalApt(apt)}
                            title="Dời lịch"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 cursor-pointer transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoShowModalApt(apt)}
                            title="Báo vắng"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 cursor-pointer transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Nút nhận kho */}
                      {(() => {
                        const eligibility = checkAppointmentEligibility(apt);
                        if (!eligibility.allowed) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="flex-1 py-1 text-center text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed opacity-50 flex items-center justify-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Khóa</span>
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => onStartCheckIn(apt)}
                            className="flex-1 py-1 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all cursor-pointer"
                          >
                            Nhận kho →
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Helper render Nhãn trạng thái (Status Badges)
  function renderStatusBadge(apt: CheckInAppointment) {
    const status = apt.status;
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ cọc
          </span>
        );
      case 'confirmed':
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Đã cọc • Chờ đón tiếp
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Đang xử lý tại chỗ
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Đã bàn giao
          </span>
        );
      case 'cancelled':
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Đã hủy / No-show
          </span>
        );
      default:
        return null;
    }
  }
}
