'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, AlertCircle, X, Check, ArrowRight } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment | null;
  onConfirm: (
    appointment: CheckInAppointment,
    newDateIso: string,
    newSlotTime: string,
    notes?: string
  ) => Promise<void>;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  onConfirm,
}: RescheduleModalProps) {
  // Target date selection: 'today', 'tomorrow', 'custom'
  const [dateChoice, setDateChoice] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  // Target slot choice
  const [selectedSlot, setSelectedSlot] = useState<string>('14:00 - 15:00');
  const [reasonNote, setReasonNote] = useState<string>('Khách báo bận, xin đổi giờ hẹn');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !appointment || !mounted) return null;

  const TIME_SLOTS = [
    { label: 'Sáng: 08:30 - 09:30', val: '08:30 - 09:30', hour: 8, min: 30 },
    { label: 'Sáng: 09:30 - 10:30', val: '09:30 - 10:30', hour: 9, min: 30 },
    { label: 'Sáng: 10:30 - 11:30', val: '10:30 - 11:30', hour: 10, min: 30 },
    { label: 'Chiều: 13:30 - 14:30', val: '13:30 - 14:30', hour: 13, min: 30 },
    { label: 'Chiều: 14:30 - 15:30', val: '14:30 - 15:30', hour: 14, min: 30 },
    { label: 'Chiều: 15:30 - 16:30', val: '15:30 - 16:30', hour: 15, min: 30 },
    { label: 'Chiều: 16:30 - 17:30', val: '16:30 - 17:30', hour: 16, min: 30 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date();
      let targetDate = new Date();

      if (dateChoice === 'today') {
        // keep today
      } else if (dateChoice === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (customDate) {
        const [y, m, d] = customDate.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      }

      // Find slot hour
      const slotObj = TIME_SLOTS.find((s) => s.val === selectedSlot) || TIME_SLOTS[3];
      targetDate.setHours(slotObj.hour, slotObj.min, 0, 0);

      // Make sure date is not in past
      if (targetDate.getTime() < now.getTime() - 5 * 60 * 1000) {
        targetDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead
      }

      await onConfirm(
        appointment,
        targetDate.toISOString(),
        selectedSlot,
        reasonNote.trim() || 'Khách dời lịch hẹn'
      );
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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Dời Lịch Hẹn Check-in</h3>
              <p className="text-xs text-slate-500">
                Mã đơn: <span className="font-semibold text-slate-700">{appointment.id}</span> • Ô {appointment.assignedUnit}
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
          {/* Thông tin khách hàng & Giờ hẹn hiện tại */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">{appointment.customerName} ({appointment.phone})</div>
              <div className="text-slate-500 mt-0.5">
                Lịch cũ: <span className="font-semibold text-amber-900">{appointment.dateDisplay || appointment.startDate} lúc {appointment.slotTime}</span>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold text-[11px]">
              Chờ dời giờ
            </span>
          </div>

          {/* 1. Chọn ngày mới */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Chọn Ngày Hẹn Mới
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDateChoice('today')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                  dateChoice === 'today'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setDateChoice('tomorrow')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                  dateChoice === 'tomorrow'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ngày mai
              </button>
              <button
                type="button"
                onClick={() => setDateChoice('custom')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                  dateChoice === 'custom'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ngày khác...
              </button>
            </div>

            {dateChoice === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="date"
                  value={customDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            )}
          </div>

          {/* 2. Chọn Khung giờ mới */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Khung Giờ Mới
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {TIME_SLOTS.map((s) => (
                <button
                  type="button"
                  key={s.val}
                  onClick={() => setSelectedSlot(s.val)}
                  className={`py-2 px-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedSlot === s.val
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  {selectedSlot === s.val && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Lý do dời hẹn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Ghi Chú / Lý Do Dời Lịch
            </label>
            <input
              type="text"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Ví dụ: Khách kẹt xe, xin nhận kho buổi chiều..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Reminder box */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Ô kho <strong>{appointment.assignedUnit}</strong> vẫn sẽ tiếp tục được giữ chỗ an toàn cho khách hàng cho đến mốc giờ hẹn mới.
            </span>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <span>Xác nhận dời lịch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
