'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, AlertCircle, Building2, User, Clock, CheckCircle2 } from 'lucide-react';
import { CheckInAppointment, StaffUser } from '../types';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment | null;
  currentUser?: StaffUser | null;
  onSubmit: (appointment: CheckInAppointment, reason: string) => Promise<void> | void;
}

export default function RequestApprovalModal({
  isOpen,
  onClose,
  appointment,
  currentUser,
  onSubmit,
}: RequestApprovalModalProps) {
  const PRESET_REASONS = [
    'Khách hàng có mặt trực tiếp tại quầy và có lý do bất khả kháng hợp lệ',
    'Đã liên hệ xác nhận, khách hàng cam kết đến nhận kho trong ca trực hôm nay',
    'Sự cố thời tiết / giao thông / hoàn cảnh cá nhân đặc biệt',
    'Khách hàng mang đầy đủ giấy tờ tùy thân và đề nghị nhận kho ngay',
    'Khác (nhập chi tiết bên dưới)',
  ];

  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedReason(PRESET_REASONS[0]);
    setCustomReason('');
  }, [isOpen]);

  if (!isOpen || !appointment || !mounted) return null;

  const facilityName =
    appointment.facilityName ||
    currentUser?.assignedFacility?.name ||
    currentUser?.facilityName ||
    'Trụ Sở Chính Võ Nguyên Giáp';

  const staffName = currentUser?.fullName || 'Nhân viên lễ tân';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalReason =
        selectedReason === 'Khác (nhập chi tiết bên dưới)'
          ? customReason.trim() || 'Nhân viên đề xuất mở lại đơn trễ quá 24h'
          : selectedReason + (customReason.trim() ? ` - Chi tiết: ${customReason.trim()}` : '');

      await onSubmit(appointment, finalReason);
      onClose();
    } catch {
      // Handled by parent
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
        className="bg-white rounded-2xl shadow-2xl border border-indigo-200 max-w-lg w-full overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Gửi yêu cầu Quản lý duyệt mở lại
              </h3>
              <p className="text-xs text-indigo-900/80 font-medium">
                Gửi tờ trình tới Quản lý cơ sở phê duyệt đơn nhận kho trễ quá 24 giờ
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

        {/* Form Body */}
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
              <span className="text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Cơ sở tiếp nhận:
              </span>
              <span className="font-bold text-indigo-900">{facilityName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nhân viên gửi yêu cầu:
              </span>
              <span className="font-medium text-slate-700">{staffName}</span>
            </div>
          </div>

          {/* Cảnh báo phân quyền nghiệp vụ */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Quy định phân quyền phê duyệt:</p>
              <p className="text-amber-800/90 leading-relaxed">
                Đơn quá hạn (&gt; 24h) thuộc thẩm quyền phê duyệt của <strong>Quản lý cơ sở ({facilityName})</strong>. Sau khi gửi yêu cầu, hệ thống sẽ chuyển đơn sang trạng thái <strong>&quot;Chờ Quản lý duyệt&quot;</strong>. Nhân viên không được phép tự ý nhận kho cho đến khi Quản lý ký duyệt.
              </p>
            </div>
          </div>

          {/* Chọn lý do xin phê duyệt */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              1. Lý do đề xuất Quản lý duyệt mở lại:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
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
              2. Ghi chú chi tiết cho Quản lý (tùy chọn):
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập thông tin cụ thể: thời gian khách tới, ghi chú giải trình của khách..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu tới Quản lý'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
