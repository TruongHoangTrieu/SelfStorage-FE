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
  AlertCircle,
  Clock,
  UserX,
  XCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Send,
  CalendarDays,
  Users,
  KeyRound,
  CheckCircle2,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { CheckInAppointment, StaffUser } from '../types';
import { toast } from 'sonner';
import RescheduleModal from './RescheduleModal';
import NoShowModal from './NoShowModal';
import ContactModal from './ContactModal';
import ManagerApprovalModal from './ManagerApprovalModal';
import RequestApprovalModal from './RequestApprovalModal';

/**
 * Phân tích trạng thái thời gian lịch hẹn:
 * - Đúng hẹn (On Time): Trong khung giờ hoặc trước giờ hẹn <= 60p
 * - Trễ hẹn (Late): Quá giờ hẹn bắt đầu > 15 phút mà chưa check-in
 * - Quá hạn (Overdue): Trễ quá 24 giờ (> 1440 phút) hoặc status === 'expired'
 * - Chưa tới giờ (Upcoming): Còn hơn 60 phút nữa
 */
export function getAppointmentScheduleStatus(apt: CheckInAppointment): {
  isLate: boolean;
  isOverdue: boolean;
  lateMinutes: number;
  isOnTime: boolean;
  isUpcoming: boolean;
  label: string;
  badgeClass: string;
} {
  if (apt.status === 'completed') {
    return {
      isLate: false,
      isOverdue: false,
      lateMinutes: 0,
      isOnTime: false,
      isUpcoming: false,
      label: 'Đã hoàn tất',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    };
  }

  if (apt.status === 'cancelled') {
    return {
      isLate: false,
      isOverdue: false,
      lateMinutes: 0,
      isOnTime: false,
      isUpcoming: false,
      label: 'Đã hủy',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    };
  }

  // Nếu đơn đã được Quản lý phê duyệt mở lại
  if (apt.managerApprovedExpiry) {
    const now = new Date();
    const expiry = new Date(apt.managerApprovedExpiry);
    if (now > expiry || apt.isApprovalExpired) {
      return {
        isLate: true,
        isOverdue: true,
        lateMinutes: 1441,
        isOnTime: false,
        isUpcoming: false,
        label: 'Hết hạn duyệt (Đã giải phóng)',
        badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300 font-bold',
      };
    }
    // Còn trong ngày hôm nay:
    return {
      isLate: false,
      isOverdue: false,
      lateMinutes: 0,
      isOnTime: true,
      isUpcoming: false,
      label: 'Đã duyệt (Hạn 23:59 hôm nay)',
      badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold',
    };
  }

  if (apt.status === 'expired') {
    return {
      isLate: true,
      isOverdue: true,
      lateMinutes: 1441,
      isOnTime: false,
      isUpcoming: false,
      label: 'Đơn quá hạn',
      badgeClass: 'bg-red-50 text-red-700 border border-red-300 font-bold',
    };
  }

  if (apt.status === 'in_progress') {
    return {
      isLate: false,
      isOverdue: false,
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
      isOverdue: false,
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

  // Quá hạn: Trễ quá 24 giờ (> 1440 phút)
  if (diffMinutes > 24 * 60) {
    return {
      isLate: true,
      isOverdue: true,
      lateMinutes: diffMinutes,
      isOnTime: false,
      isUpcoming: false,
      label: 'Đơn quá hạn',
      badgeClass: 'bg-red-50 text-red-700 border border-red-300 font-bold',
    };
  }

  // Trễ hẹn thông thường: Quá giờ hẹn bắt đầu hơn 15 phút (nhưng <= 24 giờ)
  if (diffMinutes > 15) {
    let lateText = `Trễ ${diffMinutes} phút`;
    if (diffMinutes >= 1440) {
      const days = Math.floor(diffMinutes / 1440);
      lateText = `Trễ ${days} ngày`;
    } else if (diffMinutes >= 120) {
      const hours = Math.floor(diffMinutes / 60);
      lateText = `Trễ ${hours} tiếng`;
    }
    return {
      isLate: true,
      isOverdue: false,
      lateMinutes: diffMinutes,
      isOnTime: false,
      isUpcoming: false,
      label: `${lateText}`,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-300 font-bold',
    };
  }

  // Đúng giờ: Trong vòng [-60p, +15p]
  if (diffMinutes >= -60 && diffMinutes <= 15) {
    return {
      isLate: false,
      isOverdue: false,
      lateMinutes: 0,
      isOnTime: true,
      isUpcoming: false,
      label: 'Đúng hẹn',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
    };
  }

  // Chưa tới giờ hẹn: Trước giờ hẹn hơn 60p
  return {
    isLate: false,
    isOverdue: false,
    lateMinutes: 0,
    isOnTime: false,
    isUpcoming: true,
    label: 'Chưa tới giờ',
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
}

/**
 * Kiểm tra xem đơn hẹn có được phép bắt đầu nhận kho không.
 * Quy định:
 * - Nút chỉ mở trước giờ hẹn tối đa 1 tiếng (60 phút).
 * - Nếu khách trễ hẹn <= 24 tiếng, nút VẪN MỞ để nhân viên đón tiếp ngay khi khách có mặt!
 * - Nếu trễ quá 24 giờ: Nút BỊ KHÓA / ẨN ĐI, trạng thái thành "Đơn quá hạn".
 *   Muốn nhận lại thì phải Dời lịch hẹn hoặc Quản lý phê duyệt mở lại.
 */
export function checkAppointmentEligibility(apt: CheckInAppointment): {
  allowed: boolean;
  reason?: string;
  isOverdue?: boolean;
} {
  if (apt.status === 'completed') {
    return { allowed: false, reason: 'Đã hoàn tất bàn giao' };
  }

  if (apt.status === 'cancelled') {
    return { allowed: false, reason: 'Đơn đã bị hủy' };
  }

  // Đơn được Quản lý duyệt mở lại
  if (apt.managerApprovedExpiry) {
    const now = new Date();
    const expiry = new Date(apt.managerApprovedExpiry);
    if (now > expiry || apt.isApprovalExpired) {
      return {
        allowed: false,
        reason: 'Phê duyệt mở lại đã hết hạn cuối ngày hôm qua (23:59). Hệ thống đã tự động giải phóng ô kho cho khách khác thuê.',
        isOverdue: true,
      };
    }
    // Còn trong ngày hôm nay: Nút nhận kho mở ngay
    return { allowed: true };
  }

  if (apt.status === 'expired') {
    return {
      allowed: false,
      reason: 'Đơn trễ quá 24 giờ (Đơn quá hạn). Nút nhận kho đã bị khóa. Vui lòng dời lịch hẹn hoặc yêu cầu Quản lý phê duyệt mở lại.',
      isOverdue: true,
    };
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
  const diffMs = now.getTime() - apptDate.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  // Trễ quá 24 giờ (1440 phút): Khóa nhận kho
  if (diffMinutes > 24 * 60) {
    return {
      allowed: false,
      reason: 'Đơn trễ quá 24 giờ (Đơn quá hạn). Nút nhận kho đã bị khóa. Vui lòng dời lịch hẹn hoặc yêu cầu Quản lý phê duyệt mở lại.',
      isOverdue: true,
    };
  }

  // Nếu còn hơn 1 tiếng nữa mới tới giờ hẹn: Khóa nút
  const futureDiffMs = apptDate.getTime() - now.getTime();
  const oneHourMs = 60 * 60 * 1000;
  if (futureDiffMs > oneHourMs) {
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
  onManagerReopen?: (
    apt: CheckInAppointment,
    reason: string,
    managerName: string
  ) => Promise<void> | void;
  onRequestApproval?: (
    apt: CheckInAppointment,
    reason: string
  ) => Promise<void> | void;
  onManagerReject?: (
    apt: CheckInAppointment,
    reason: string
  ) => Promise<void> | void;
  currentUser?: StaffUser | null;
  onOpenRentalPayment?: (apt: CheckInAppointment) => void;
}

export default function CheckInQueue({
  appointments,
  onStartCheckIn,
  selectedAppointmentId,
  onReschedule,
  onCancelOrNoShow,
  onManagerReopen,
  onRequestApproval,
  onManagerReject,
  currentUser,
  onOpenRentalPayment,
}: CheckInQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'confirmed' | 'late' | 'overdue' | 'in_progress' | 'completed' | 'cancelled'
  >('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline');

  // Check role: Quản lý cơ sở hay Nhân viên
  const userRole = (currentUser?.role || '').toUpperCase();
  const isManager = Boolean(
    currentUser && (
      userRole === 'FACILITY_MANAGER' ||
      userRole === 'BUSINESS_OPERATIONS_MANAGER' ||
      userRole === 'SYSTEM_ADMINISTRATOR' ||
      userRole === 'ADMIN' ||
      userRole === 'MANAGER'
    )
  );

  // Modal states
  const [contactModalApt, setContactModalApt] = useState<CheckInAppointment | null>(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState<CheckInAppointment | null>(null);
  const [noShowModalApt, setNoShowModalApt] = useState<CheckInAppointment | null>(null);
  const [managerApprovalModalApt, setManagerApprovalModalApt] = useState<CheckInAppointment | null>(null);
  const [requestApprovalModalApt, setRequestApprovalModalApt] = useState<CheckInAppointment | null>(null);

  // Danh sách các cuộc hẹn trễ đã được liên hệ xác nhận (để mở khóa nút Nhận kho khi trễ >= 3 tiếng)
  const [confirmedContactAptIds, setConfirmedContactAptIds] = useState<string[]>([]);

  const handleConfirmArrivalFromContact = (apt: CheckInAppointment) => {
    setConfirmedContactAptIds((prev) => Array.from(new Set([...prev, apt.id])));
    toast.success(`Đã xác nhận liên hệ với khách ${apt.customerName}. Nút "Bắt đầu nhận kho" đã được mở khóa!`);
  };

  // Thống kê nhanh kèm số lượng đơn trễ hẹn & quá hạn (>24h)
  const stats = useMemo(() => {
    let todayCount = 0;
    let lateCount = 0;
    let overdueCount = 0;
    let confirmedCount = 0;

    appointments.forEach((a) => {
      if (a.dateDisplay === 'Hôm nay') todayCount++;

      if (a.status !== 'completed' && a.status !== 'cancelled') {
        const sched = getAppointmentScheduleStatus(a);
        if (sched.isOverdue || a.status === 'expired') {
          overdueCount++;
        } else if (sched.isLate) {
          lateCount++;
        }

        if (
          (a.status === 'confirmed' || a.status === 'arrived' || a.status === 'pending') &&
          !sched.isLate &&
          !sched.isOverdue
        ) {
          confirmedCount++;
        }
      }
    });

    return {
      total: appointments.length,
      todayCount,
      confirmed: confirmedCount,
      lateCount,
      overdueCount,
      inProgress: appointments.filter((a) => a.status === 'in_progress').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
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
      if (statusFilter === 'late' || statusFilter === 'overdue') {
        return (
          (sched.isLate || sched.isOverdue || apt.status === 'expired') &&
          apt.status !== 'completed' &&
          apt.status !== 'cancelled'
        );
      }
      if (statusFilter === 'confirmed') {
        return (
          (apt.status === 'confirmed' || apt.status === 'arrived' || apt.status === 'pending') &&
          !sched.isLate &&
          !sched.isOverdue
        );
      }
      if (statusFilter === 'in_progress') return apt.status === 'in_progress';
      if (statusFilter === 'completed') return apt.status === 'completed';
      if (statusFilter === 'cancelled') return apt.status === 'cancelled';

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
      {/* 1. Thanh đo lường nhanh (Metrics Bar - Bấm vào thẻ để lọc trạng thái) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Tổng lịch hẹn */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all active:scale-98 select-none flex items-center justify-between ${
            statusFilter === 'all'
              ? 'bg-slate-100/90 border-slate-400 ring-2 ring-slate-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Tổng lịch hẹn</span>
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'all' ? 'bg-slate-600' : 'bg-slate-300'}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 border border-slate-200/60">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Chờ đón tiếp (Đúng hẹn) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'confirmed' ? 'all' : 'confirmed')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all active:scale-98 select-none flex items-center justify-between ${
            statusFilter === 'confirmed'
              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/25 shadow-xs'
              : 'bg-white border-blue-100 hover:border-blue-300 hover:bg-blue-50/20'
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>Chờ đón tiếp</span>
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'confirmed' ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-blue-500'}`} />
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.confirmed}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Trễ hẹn / Cần gọi (Cảnh báo nghiệp vụ) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all active:scale-98 select-none flex items-center justify-between ${
            statusFilter === 'late' || statusFilter === 'overdue'
              ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/25 shadow-xs'
              : stats.lateCount > 0 || stats.overdueCount > 0
              ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/10'
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Trễ hẹn / Quá hạn</span>
              {(stats.lateCount > 0 || stats.overdueCount > 0) && (
                <span className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'late' || statusFilter === 'overdue' ? 'bg-rose-600' : 'bg-rose-500 animate-ping'}`} />
              )}
            </div>
            <div className="text-2xl font-black text-rose-900 flex items-baseline gap-2">
              <span>{stats.lateCount}</span>
              {stats.overdueCount > 0 && (
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                  +{stats.overdueCount} quá hạn
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 border border-rose-200/80">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Đang xử lý */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all active:scale-98 select-none flex items-center justify-between ${
            statusFilter === 'in_progress'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/25 shadow-xs'
              : 'bg-white border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/20'
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>Đang xử lý</span>
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'in_progress' ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-indigo-600 animate-pulse'}`} />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{stats.inProgress}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Hoàn tất */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all active:scale-98 select-none flex items-center justify-between ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs'
              : 'bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/20'
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>Hoàn tất</span>
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'completed' ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-emerald-500'}`} />
            </div>
            <div className="text-2xl font-bold text-emerald-900">{stats.completed}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
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
              { key: 'late', label: 'Trễ hẹn / Quá hạn' },
              { key: 'in_progress', label: 'Đang xử lý' },
              { key: 'completed', label: 'Hoàn tất' },
              { key: 'cancelled', label: 'Đã hủy' },
            ] as const
          ).map((item) => {
            const totalLateOverdue = stats.lateCount + stats.overdueCount;
            const isActive =
              statusFilter === item.key ||
              (item.key === 'late' && (statusFilter === 'late' || statusFilter === 'overdue'));

            return (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? item.key === 'late'
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'bg-[#4f39f6] text-white shadow-xs'
                    : item.key === 'late' && totalLateOverdue > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
                {item.key === 'late' && totalLateOverdue > 0 ? ` (${totalLateOverdue})` : ''}
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
            'Chờ đón tiếp',
            'confirmed',
            'bg-blue-50 text-blue-700',
            'border-t-4 border-blue-500'
          )}
          {renderKanbanColumn(
            ' Trễ hẹn / Cần gọi',
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
        onOpenReschedule={(apt) => setRescheduleModalApt(apt)}
        onOpenNoShow={(apt) => setNoShowModalApt(apt)}
        onConfirmArrival={handleConfirmArrivalFromContact}
      />

      <RescheduleModal
        isOpen={!!rescheduleModalApt}
        onClose={() => setRescheduleModalApt(null)}
        appointment={rescheduleModalApt}
        existingAppointments={appointments}
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

      <ManagerApprovalModal
        isOpen={!!managerApprovalModalApt}
        onClose={() => setManagerApprovalModalApt(null)}
        appointment={managerApprovalModalApt}
        currentUser={currentUser}
        onConfirm={async (apt, reason, managerName) => {
          if (onManagerReopen) {
            await onManagerReopen(apt, reason, managerName);
          }
        }}
        onReject={async (apt, reason) => {
          if (onManagerReject) {
            await onManagerReject(apt, reason);
          }
        }}
      />

      <RequestApprovalModal
        isOpen={!!requestApprovalModalApt}
        onClose={() => setRequestApprovalModalApt(null)}
        appointment={requestApprovalModalApt}
        currentUser={currentUser}
        onSubmit={async (apt, reason) => {
          if (onRequestApproval) {
            await onRequestApproval(apt, reason);
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

    // Kiểm tra phê duyệt Quản lý mở lại và thời hạn cuối ngày
    const isApprovalExpired =
      Boolean(
        apt.isApprovalExpired ||
        (apt.managerApprovedExpiry && new Date() > new Date(apt.managerApprovedExpiry))
      ) &&
      apt.status !== 'completed' &&
      apt.status !== 'cancelled';

    const isApprovedValidToday =
      Boolean(
        apt.managerApprovedExpiry &&
        new Date() <= new Date(apt.managerApprovedExpiry)
      ) &&
      apt.status !== 'completed' &&
      apt.status !== 'cancelled' &&
      !isApprovalExpired;

    const isOverdue =
      (sched.isOverdue || apt.status === 'expired') &&
      !isApprovedValidToday &&
      !isApprovalExpired &&
      apt.status !== 'completed' &&
      apt.status !== 'cancelled';

    const isLate =
      sched.isLate &&
      !isOverdue &&
      !isApprovedValidToday &&
      !isApprovalExpired &&
      apt.status !== 'completed' &&
      apt.status !== 'cancelled' &&
      apt.status !== 'expired';

    // Kiểm tra quy tắc: Trễ từ 3 tiếng trở lên (>= 180 phút)
    const isLateOver3Hours = isLate && sched.lateMinutes >= 180;
    const isContactConfirmed = !!apt.contactConfirmed || confirmedContactAptIds.includes(apt.id);

    return (
      <div
        key={apt.id}
        className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/80 ${
          isCurrent
            ? 'bg-blue-50/40 border-l-4 border-blue-600'
            : isApprovedValidToday
            ? 'bg-indigo-50/25 border-l-4 border-indigo-600'
            : isApprovalExpired
            ? 'bg-slate-50 border-l-4 border-slate-400 opacity-90'
            : isOverdue
            ? 'bg-red-50/30 border-l-4 border-red-600'
            : isLate
            ? 'bg-rose-50/20 border-l-4 border-rose-500'
            : ''
        }`}
      >
        {/* Left Info: Ngày Hẹn, Khung Giờ & Thông Tin Khách */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`flex flex-col items-center justify-center min-w-[108px] px-2.5 py-2 rounded-xl font-bold border shrink-0 text-center ${
              isApprovedValidToday
                ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                : isApprovalExpired
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : isOverdue
                ? 'bg-red-50 text-red-900 border-red-300 ring-1 ring-red-200'
                : isLate
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {/* Tag Ngày Hẹn */}
            <span
              className={`text-[10px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md mb-1 ${
                isApprovedValidToday
                  ? 'bg-indigo-600 text-white'
                  : isApprovalExpired
                  ? 'bg-slate-500 text-white'
                  : isOverdue
                  ? 'bg-red-600 text-white'
                  : isToday
                  ? 'bg-blue-600 text-white'
                  : apt.dateDisplay === 'Hôm qua'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : isTomorrow
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isApprovedValidToday ? 'Hôm nay' : apt.dateDisplay || apt.startDate}
            </span>
            <span className="text-xs font-black text-slate-900 tabular-nums">{apt.slotTime}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{apt.customerName}</span>
              <span className="text-xs text-slate-500 tabular-nums">({apt.phone})</span>

              {/* Status Badge */}
              {renderStatusBadge(apt)}

              {/* Tag Đã liên hệ xác nhận (khi trễ >= 3 tiếng đã được xác nhận) */}
              {isLateOver3Hours && isContactConfirmed && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  Đã xác nhận liên hệ
                </span>
              )}

              {/* Tag Trễ Hẹn / Quá Hạn / Đã Duyệt */}
              {isApprovedValidToday ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  Hiệu lực đến 23:59
                </span>
              ) : isApprovalExpired ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Đã giải phóng ô kho
                </span>
              ) : isOverdue ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  Trễ &gt; 24h
                </span>
              ) : isLate ? (
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
                {apt.depositStatus === 'paid' ? 'Cọc: Đã cọc 100%' : 'Chưa đặt cọc'}
              </span>
              <span>•</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded ${
                  apt.rentalStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {apt.rentalStatus === 'paid' ? 'Tiền thuê: Đã thu đủ' : 'Tiền thuê: Chưa thu'}
              </span>
              <span>•</span>
              <span className="text-slate-500 font-medium">
                Ngày nhận: <strong className="text-slate-800 font-semibold">{apt.startDate}</strong>
              </span>

              {apt.specialNotes && (
                <>
                  <span>•</span>
                  <span className="text-slate-600 font-medium italic">
                    {apt.specialNotes}
                  </span>
                </>
              )}

              {apt.cancelReason && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-medium italic">
                    Lý do hủy: {apt.cancelReason}
                  </span>
                </>
              )}
            </div>

            {/* Thông báo chính sách giữ kho đối với đơn được phê duyệt */}
            {isApprovedValidToday && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200 w-fit mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Quản lý ({apt.managerApproverName || 'Cơ sở'}) đã duyệt • Giữ ô kho #{apt.assignedUnit} đến hết hôm nay 23:59. Sau 23:59 sẽ tự động giải phóng kho nếu chưa nhận.</span>
              </div>
            )}

            {/* Thông báo đơn đang chờ Quản lý duyệt */}
            {apt.managerApprovalStatus === 'pending' && !isApprovedValidToday && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-fit mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
                <span>
                  Đã gửi yêu cầu tới Quản lý cơ sở ({apt.managerApprovalFacilityName || 'Cơ sở'}). Nhân viên gửi: <strong>{apt.managerApprovalRequestedBy || 'Nhân viên'}</strong> • Đang chờ Quản lý duyệt.
                </span>
              </div>
            )}

            {/* Thông báo Quản lý từ chối mở lại */}
            {apt.managerApprovalStatus === 'rejected' && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit mt-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>
                  Quản lý đã từ chối mở lại: <em>{apt.managerApprovalRejectReason || 'Không đủ điều kiện'}</em>. Vui lòng dời lịch hoặc hủy đơn.
                </span>
              </div>
            )}

            {isApprovalExpired && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit mt-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Hết hạn phê duyệt cuối ngày (23:59 hôm qua): Hệ thống đã tự động giải phóng ô kho #{apt.assignedUnit} về trạng thái Khả dụng.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Liên Hệ, Thu Tiền Thuê, Dời Lịch, Phê duyệt mở lại, Báo Vắng, Nhận Kho */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
          {apt.status === 'completed' ? (
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Đã bàn giao lúc {apt.completedAt || '08:48'}
              </span>
            </div>
          ) : apt.status === 'cancelled' ? (
            <div className="text-right">
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Đã hủy
              </span>
            </div>
          ) : isApprovalExpired ? (
            /* TRƯỜNG HỢP HẾT HẠN PHÊ DUYỆT CUỐI NGÀY: Khóa nhận kho & Báo đã giải phóng kho */
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled
                title="Đơn mở lại đã hết hạn cuối ngày hôm qua. Ô kho đã được tự động giải phóng về trạng thái Khả dụng."
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed select-none opacity-60 shadow-none"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Đã giải phóng ô kho</span>
              </button>
              <button
                type="button"
                onClick={() => setRescheduleModalApt(apt)}
                title="Bấm để dời lịch hẹn sang ngày mới cho khách"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 active:scale-95 rounded-xl border border-amber-300 transition-all cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Dời lịch hẹn mới</span>
              </button>
            </div>
          ) : isApprovedValidToday ? (
            /* TRƯỜNG HỢP ĐÃ ĐƯỢC DUYỆT VÀ CÒN HẠN HÔM NAY (ĐẾN 23:59): Mở nút Nhận kho */
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onStartCheckIn(apt)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                <span>Bắt đầu nhận kho</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setNoShowModalApt(apt)}
                title="Khách báo không đến: Bấm để hủy đơn và giải phóng ngay ô kho"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
              >
                <span>Báo vắng &amp; Giải phóng kho</span>
              </button>
            </div>
          ) : isOverdue ? (
            /* TRƯỜNG HỢP TRỄ QUÁ 24 GIỜ: Nút "Bắt đầu nhận kho" bị khóa / ẩn đi */
            <div className="flex items-center gap-2 flex-wrap">
              {/* Nút Nhận kho bị khóa hoàn toàn */}
              <button
                type="button"
                disabled
                title="Đơn đã quá hạn (trễ hơn 24 giờ). Nút nhận kho đã bị khóa. Vui lòng dời lịch hẹn hoặc yêu cầu Quản lý phê duyệt mở lại."
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed select-none opacity-60 shadow-none"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Khóa nhận kho (Quá hạn)</span>
              </button>

              {/* Bấm Dời lịch hẹn để kích hoạt lại đơn */}
              <button
                type="button"
                onClick={() => setRescheduleModalApt(apt)}
                title="Dời lịch hẹn sang ngày/giờ mới để kích hoạt lại đơn nhận kho"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 active:scale-95 rounded-xl border border-amber-300 transition-all cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Dời lịch hẹn</span>
              </button>

              {/* Nút Báo vắng & Giải phóng kho: Chỉ dành cho Quản lý cơ sở hoặc khi Quản lý đã từ chối mở lại */}
              {(isManager || apt.managerApprovalStatus === 'rejected') && (
                <button
                  type="button"
                  onClick={() => setNoShowModalApt(apt)}
                  title="Xác nhận khách vắng mặt: Hủy đơn và giải phóng ô kho về trạng thái Khả dụng"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Báo vắng &amp; Giải phóng</span>
                </button>
              )}

              {/* PHÂN QUYỀN NÚT DUYỆT / GỬI YÊU CẦU: */}
              {!isManager ? (
                /* GIAO DIỆN DÀNH CHO NHÂN VIÊN LỄ TÂN (STAFF) */
                apt.managerApprovalStatus === 'pending' ? (
                  <button
                    type="button"
                    disabled
                    title={`Đã gửi tờ trình tới Quản lý cơ sở. Người gửi: ${apt.managerApprovalRequestedBy || 'Nhân viên'}. Đang chờ Quản lý duyệt.`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-100/90 border border-amber-300 rounded-xl cursor-wait select-none shadow-2xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    <span>Chờ Quản lý duyệt...</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRequestApprovalModalApt(apt)}
                    title="Gửi yêu cầu tới Quản lý cơ sở để xin mở lại đơn quá hạn này"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gửi yêu cầu Quản lý duyệt</span>
                  </button>
                )
              ) : (
                /* GIAO DIỆN DÀNH CHO QUẢN LÝ (MANAGER) */
                <button
                  type="button"
                  onClick={() => setManagerApprovalModalApt(apt)}
                  title="Cấp Quản lý phê duyệt mở lại đơn (hiệu lực đến hết ngày hôm nay)"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-xl border border-indigo-300 transition-all cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {apt.managerApprovalStatus === 'pending'
                      ? 'Xem & Phê duyệt'
                      : 'Quản lý duyệt mở lại'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            /* TRƯỜNG HỢP BÌNH THƯỜNG / TRỄ DƯỚI 24 GIỜ */
            <>
              {/* Nút Tạo Đơn / Thu Tiền Thuê Kho */}
              <button
                type="button"
                onClick={() => onOpenRentalPayment?.(apt)}
                title="Tạo đơn thu tiền thuê hoặc kiểm tra VietQR"
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer active:scale-95 shadow-2xs ${
                  apt.rentalStatus === 'paid'
                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>{apt.rentalStatus === 'paid' ? 'Đã thu tiền' : 'Thu tiền thuê'}</span>
              </button>

              {/* Khi TRỄ HẸN (isLate): Bắt buộc gọi điện / liên hệ xác nhận trước */}
              {isLate && (
                <button
                  type="button"
                  onClick={() => setContactModalApt(apt)}
                  title={
                    isLateOver3Hours && !isContactConfirmed
                      ? 'Đơn trễ quá 3 tiếng: Bắt buộc bấm gọi/nhắn xác nhận với khách trước khi mở lại thủ tục nhận kho'
                      : 'Bấm để liên hệ khách hàng'
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    isLateOver3Hours && !isContactConfirmed
                      ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300 ring-2 ring-rose-200'
                      : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                  }`}
                >
                  <Phone className={`w-3.5 h-3.5 ${isLateOver3Hours && !isContactConfirmed ? 'text-rose-600 animate-bounce' : 'text-blue-600 animate-pulse'}`} />
                  <span>{isContactConfirmed ? 'Đã liên hệ (Xem lại)' : 'Liên hệ xác nhận'}</span>
                </button>
              )}

              {/* Nút Bắt đầu nhận kho: Nếu trễ quá 3 tiếng (>= 180 phút) và CHƯA liên hệ xác nhận -> ẨN NÚT */}
              {!(isLateOver3Hours && !isContactConfirmed) && (() => {
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
      const isApprovedValid =
        Boolean(a.managerApprovedExpiry && new Date() <= new Date(a.managerApprovedExpiry)) &&
        a.status !== 'completed' &&
        a.status !== 'cancelled';
      const isAppExpired =
        Boolean(a.isApprovalExpired || (a.managerApprovedExpiry && new Date() > new Date(a.managerApprovedExpiry))) &&
        a.status !== 'completed' &&
        a.status !== 'cancelled';

      if (columnType === 'late') {
        return (
          (sched.isLate || sched.isOverdue || a.status === 'expired' || isAppExpired) &&
          !isApprovedValid &&
          a.status !== 'completed' &&
          a.status !== 'cancelled'
        );
      }
      if (columnType === 'confirmed') {
        return (
          ((a.status === 'confirmed' || a.status === 'arrived' || a.status === 'pending') || isApprovedValid) &&
          (!sched.isLate || isApprovedValid) &&
          !sched.isOverdue &&
          !isAppExpired
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
              const isApprovedValid =
                Boolean(apt.managerApprovedExpiry && new Date() <= new Date(apt.managerApprovedExpiry)) &&
                apt.status !== 'completed' &&
                apt.status !== 'cancelled';
              const isAppExpired =
                Boolean(apt.isApprovalExpired || (apt.managerApprovedExpiry && new Date() > new Date(apt.managerApprovedExpiry))) &&
                apt.status !== 'completed' &&
                apt.status !== 'cancelled';
              const isOverdue =
                (sched.isOverdue || apt.status === 'expired') &&
                !isApprovedValid &&
                !isAppExpired &&
                apt.status !== 'completed' &&
                apt.status !== 'cancelled';
              const isLate =
                sched.isLate &&
                !isOverdue &&
                !isApprovedValid &&
                !isAppExpired &&
                apt.status !== 'completed' &&
                apt.status !== 'cancelled' &&
                apt.status !== 'expired';

              const isLateOver3Hours = isLate && sched.lateMinutes >= 180;
              const isContactConfirmed = !!apt.contactConfirmed || confirmedContactAptIds.includes(apt.id);

              return (
                <div
                  key={apt.id}
                  className={`p-3.5 rounded-xl border bg-slate-50 hover:bg-white hover:shadow-xs transition-all space-y-2.5 ${
                    isApprovedValid
                      ? 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/20'
                      : isAppExpired
                      ? 'border-slate-300 hover:border-slate-400 bg-slate-100/60'
                      : isOverdue
                      ? 'border-red-300 hover:border-red-500 bg-red-50/20'
                      : columnType === 'late'
                      ? 'border-rose-200 hover:border-rose-400'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        isApprovedValid
                          ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                          : isAppExpired
                          ? 'text-slate-700 bg-slate-200 border-slate-300'
                          : isOverdue
                          ? 'text-red-700 bg-red-50 border-red-300'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}
                    >
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-semibold text-[10px]">
                        {apt.depositStatus === 'paid' ? 'Đã cọc' : 'Chưa cọc'}
                      </span>
                      <span>•</span>
                      <span
                        className={`text-[10px] font-bold ${
                          apt.rentalStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {apt.rentalStatus === 'paid' ? 'Đã thu thuê' : 'Chưa thu thuê'}
                      </span>
                    </div>
                  </div>

                  {/* Kanban Quick Action Buttons */}
                  {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                    <div className="pt-1 flex flex-col gap-1.5">
                      {/* Nút Thu tiền nhanh */}
                      <button
                        type="button"
                        onClick={() => onOpenRentalPayment?.(apt)}
                        title="Tạo đơn hoặc thu tiền thuê kho"
                        className={`flex items-center justify-center gap-1.5 w-full px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border ${
                          apt.rentalStatus === 'paid'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{apt.rentalStatus === 'paid' ? 'Đã thu tiền' : 'Thu tiền thuê'}</span>
                      </button>

                      {isAppExpired ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              Đã giải phóng ô kho
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRescheduleModalApt(apt)}
                            title="Dời lịch hẹn"
                            className="w-full py-1 text-center text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-all cursor-pointer"
                          >
                            Dời lịch mới
                          </button>
                        </div>
                      ) : isApprovedValid ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onStartCheckIn(apt)}
                            className="w-full py-1 text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer"
                          >
                            Nhận kho (Hôm nay) →
                          </button>
                        </div>
                      ) : isOverdue ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px] text-red-700 font-bold bg-red-50 px-2 py-1 rounded border border-red-200">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-red-600" />
                              Khóa nhận kho (&gt;24h)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRescheduleModalApt(apt)}
                              title="Dời lịch hẹn"
                              className="flex-1 py-1 text-center text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-all cursor-pointer"
                            >
                              Dời lịch
                            </button>
                            {!isManager ? (
                              apt.managerApprovalStatus === 'pending' ? (
                                <button
                                  type="button"
                                  disabled
                                  className="flex-1 py-1 text-center text-[11px] font-bold text-amber-800 bg-amber-100 rounded-lg border border-amber-300 cursor-wait flex items-center justify-center gap-1"
                                >
                                  <Clock className="w-2.5 h-2.5 animate-spin" />
                                  <span>Chờ duyệt</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setRequestApprovalModalApt(apt)}
                                  title="Gửi yêu cầu Quản lý duyệt"
                                  className="flex-1 py-1 text-center text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all cursor-pointer"
                                >
                                  Xin duyệt
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => setManagerApprovalModalApt(apt)}
                                title="Quản lý phê duyệt mở lại"
                                className="flex-1 py-1 text-center text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all cursor-pointer"
                              >
                                {apt.managerApprovalStatus === 'pending' ? 'Duyệt' : 'Duyệt mở'}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isLate && (
                            <button
                              type="button"
                              onClick={() => setContactModalApt(apt)}
                              title={
                                isLateOver3Hours && !isContactConfirmed
                                  ? 'Trễ quá 3 tiếng: Bắt buộc liên hệ xác nhận trước'
                                  : 'Liên hệ khách'
                              }
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                                isLateOver3Hours && !isContactConfirmed
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <Phone className="w-3 h-3" />
                              <span>{isContactConfirmed ? 'Đã gọi' : 'Liên hệ'}</span>
                            </button>
                          )}

                          {/* Nút nhận kho: Ẩn khi trễ quá 3 tiếng và chưa liên hệ xác nhận */}
                          {!(isLateOver3Hours && !isContactConfirmed) && (() => {
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
    const sched = getAppointmentScheduleStatus(apt);

    // Kiểm tra hết hạn phê duyệt cuối ngày
    if (
      apt.isApprovalExpired ||
      (apt.managerApprovedExpiry && new Date() > new Date(apt.managerApprovedExpiry) && apt.status !== 'completed' && apt.status !== 'cancelled')
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Hết hạn duyệt • Đã giải phóng kho
        </span>
      );
    }

    // Đơn được Quản lý duyệt mở lại (còn hiệu lực trong ngày)
    if (
      apt.managerApprovedExpiry &&
      new Date() <= new Date(apt.managerApprovedExpiry) &&
      apt.status !== 'completed' &&
      apt.status !== 'cancelled'
    ) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          Đã duyệt • Hiệu lực đến 23:59
        </span>
      );
    }

    // Nếu đơn trễ hơn 24 giờ hoặc trạng thái expired -> "Đơn quá hạn"
    if (apt.status === 'expired' || (sched.isOverdue && apt.status !== 'completed' && apt.status !== 'cancelled')) {
      if (apt.managerApprovalStatus === 'pending') {
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            Chờ Quản lý duyệt
          </span>
        );
      }
      if (apt.managerApprovalStatus === 'rejected') {
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Quản lý từ chối
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          Đơn quá hạn
        </span>
      );
    }

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
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  }
}

