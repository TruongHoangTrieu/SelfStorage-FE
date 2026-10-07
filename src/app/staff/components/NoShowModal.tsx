'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Check, ShieldAlert, Trash2 } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface NoShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment | null;
  onConfirm: (
    appointment: CheckInAppointment,
    reason: string,
    depositHandling: 'forfeit'
  ) => Promise<void>;
}

export default function NoShowModal({
  isOpen,
  onClose,
  appointment,
  onConfirm,
}: NoShowModalProps) {
  const PRESET_REASONS = [
    'Khách không đến & không phản hồi cuộc gọi',
    'Khách gọi điện thông báo hủy do đổi kế hoạch / không có nhu cầu',
    'Khách không đủ giấy tờ tùy thân hợp lệ để nhận kho',
    'Khách từ chối ký hợp đồng hoặc không thanh toán tiền thuê',
  ];

  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !appointment || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalReason =
        selectedReason === 'Khác'
          ? customReason.trim() || 'Hủy đơn theo yêu cầu'
          : selectedReason;

      await onConfirm(appointment, finalReason, 'forfeit');
      onClose();
    } catch {
      // Handled by parent toast
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
        className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-lg w-full overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xác Nhận Vắng Mặt / Hủy Giữ Chỗ</h3>
              <p className="text-xs text-rose-700">
                Giải phóng ô kho <span className="font-bold">{appointment.assignedUnit}</span> về trạng thái Khả dụng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cảnh báo quan trọng */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Lưu ý nghiệp vụ:</strong> Đơn đặt chỗ <strong>{appointment.id}</strong> của khách hàng <strong>{appointment.customerName}</strong> ({appointment.phone}) sẽ chuyển sang trạng thái <strong>ĐÃ HỦY</strong>. Ngăn kho <strong>{appointment.assignedUnit}</strong> sẽ lập tức mở lại cho khách khác thuê.
            </div>
          </div>

          {/* 1. Chọn lý do vắng mặt / hủy */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Chọn Lý Do Vắng Mặt / Hủy Giữ Chỗ
            </label>
            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-rose-400 bg-rose-50/60 text-slate-900 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedReason === 'Khác'
                    ? 'border-rose-400 bg-rose-50/60 text-slate-900 font-medium'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={selectedReason === 'Khác'}
                  onChange={() => setSelectedReason('Khác')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span>Lý do khác...</span>
              </label>

              {selectedReason === 'Khác' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-rose-500 mt-1"
                  required
                />
              )}
            </div>
          </div>

          {/* 2. Quy định xử lý tiền cọc: 100% về hệ thống */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Xử Lý Tiền Cọc ({appointment.depositAmount})
            </label>
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-black text-xs border border-rose-200">
                100%
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-rose-950 flex items-center gap-1.5">
                  <span>Khấu trừ 100% tiền cọc về hệ thống</span>
                  <Check className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Theo quy định đặt chỗ, khi khách hàng vắng mặt hoặc không đến nhận kho, <strong>100% số tiền cọc ({appointment.depositAmount}) sẽ tự động khấu trừ về hệ thống</strong> và không được hoàn lại (tương tự như khi khách hủy đơn).
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác nhận Hủy &amp; Thu 100% cọc</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
