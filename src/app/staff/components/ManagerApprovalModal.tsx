'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, AlertCircle, Calendar, UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import { CheckInAppointment, StaffUser } from '../types';

interface ManagerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment | null;
  currentUser?: StaffUser | null;
  onConfirm: (
    appointment: CheckInAppointment,
    reason: string,
    managerName: string
  ) => Promise<void> | void;
}

export default function ManagerApprovalModal({
  isOpen,
  onClose,
  appointment,
  currentUser,
  onConfirm,
}: ManagerApprovalModalProps) {
  const PRESET_REASONS = [
    'Khách hàng có mặt trực tiếp tại quầy và có lý do bất khả kháng hợp lệ',
    'Đã liên hệ xác nhận, khách hàng cam kết đến nhận kho trong ca trực hôm nay',
    'Sự cố thời tiết / giao thông / hoàn cảnh cá nhân đặc biệt',
    'Chỉ đạo mở lại trực tiếp từ Quản lý cơ sở',
    'Khác (nhập chi tiết bên dưới)',
  ];

  const defaultManager = currentUser?.fullName || 'Quản lý cơ sở';
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [managerName, setManagerName] = useState<string>(defaultManager);
  const [hasConfirmedAgreement, setHasConfirmedAgreement] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentUser?.fullName) {
      setManagerName(currentUser.fullName);
    }
    setHasConfirmedAgreement(false);
    setSelectedReason(PRESET_REASONS[0]);
    setCustomReason('');
  }, [isOpen, currentUser]);

  if (!isOpen || !appointment || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConfirmedAgreement) return;

    setIsSubmitting(true);
    try {
      const finalReason =
        selectedReason === 'Khác (nhập chi tiết bên dưới)'
          ? customReason.trim() || 'Quản lý phê duyệt mở lại đơn trễ quá 24h'
          : selectedReason + (customReason.trim() ? ` - Ghi chú: ${customReason.trim()}` : '');

      await onConfirm(appointment, finalReason, managerName.trim() || defaultManager);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Phê duyệt mở lại đơn quá hạn
              </h3>
              <p className="text-xs text-indigo-950/70 font-medium">
                Xác thực quyền Quản lý để mở khóa nhận kho cho đơn trễ &gt; 24 giờ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông tin đơn đặt chỗ */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mã đơn đặt chỗ:</span>
              <span className="font-bold text-slate-900">{appointment.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-semibold text-slate-900">
                {appointment.customerName} ({appointment.phone})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ô kho đăng ký:</span>
              <span className="font-semibold text-slate-900">
                Ô {appointment.assignedUnit} • {appointment.unitType}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Lịch hẹn ban đầu:</span>
              <span className="font-bold text-rose-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-500" />
                {appointment.dateDisplay || appointment.startDate} ({appointment.slotTime}) • Trễ &gt; 24h
              </span>
            </div>
          </div>

          {/* Cảnh báo quy định & Thời hạn hiệu lực */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Quy định thời hạn phê duyệt (Cố định hết ngày):</p>
              <p className="text-amber-800/90 leading-relaxed">
                Phê duyệt có hiệu lực <strong className="text-amber-950 font-semibold">đến hết ngày hôm nay (23:59)</strong>. Ô kho <strong className="text-amber-950 font-semibold">{appointment.assignedUnit}</strong> sẽ được giữ đến cuối ngày. Nếu khách hàng vẫn không đến nhận kho, hệ thống sẽ <strong className="text-rose-900 font-semibold">tự động hủy đơn và giải phóng ô kho về trạng thái Khả dụng</strong> cho khách khác thuê.
              </p>
            </div>
          </div>

          {/* Chọn lý do phê duyệt */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Lý do phê duyệt mở lại:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              {PRESET_REASONS.map((reason, idx) => (
                <option key={idx} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Ghi chú chi tiết */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Ghi chú thêm (tùy chọn):
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập ghi chú hoặc lý do chi tiết để lưu hồ sơ ca trực..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Cán bộ phê duyệt */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Họ tên Quản lý phê duyệt:</span>
              <span className="text-[11px] font-normal text-slate-400">Ghi nhận vào Activity Log</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Nhập họ tên Quản lý cơ sở phê duyệt..."
                required
                disabled={isSubmitting}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Checkbox xác nhận trách nhiệm */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors select-none">
            <input
              type="checkbox"
              checked={hasConfirmedAgreement}
              onChange={(e) => setHasConfirmedAgreement(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium leading-relaxed">
              Tôi xác nhận mở lại tiếp nhận ô kho <strong className="text-slate-900">{appointment.assignedUnit}</strong> với thời hạn hiệu lực đến hết hôm nay (tự động giải phóng ô kho khi sang ngày mới nếu khách không nhận).
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!hasConfirmedAgreement || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận mở lại đơn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
