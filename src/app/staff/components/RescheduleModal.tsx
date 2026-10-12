'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, AlertCircle, X, Check, ArrowRight } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment | null;
  existingAppointments?: CheckInAppointment[];
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
  existingAppointments,
  onConfirm,
}: RescheduleModalProps) {
  // Sức chứa tối đa: 2 lượt tiếp nhận / ca hẹn
  const MAX_SLOT_CAPACITY = 2;

  const TIME_SLOTS = [
    { label: 'Sáng: 08:30 - 09:30', val: '08:30 - 09:30', hour: 8, min: 30 },
    { label: 'Sáng: 09:30 - 10:30', val: '09:30 - 10:30', hour: 9, min: 30 },
    { label: 'Sáng: 10:30 - 11:30', val: '10:30 - 11:30', hour: 10, min: 30 },
    { label: 'Chiều: 13:30 - 14:30', val: '13:30 - 14:30', hour: 13, min: 30 },
    { label: 'Chiều: 14:30 - 15:30', val: '14:30 - 15:30', hour: 14, min: 30 },
    { label: 'Chiều: 15:30 - 16:30', val: '15:30 - 16:30', hour: 15, min: 30 },
    { label: 'Chiều: 16:30 - 17:30', val: '16:30 - 17:30', hour: 16, min: 30 },
  ];

  // Giờ hiện tại theo phút
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Ca được xem là đã qua trong ngày hôm nay nếu giờ bắt đầu <= giờ hiện tại + 15 phút
  const isSlotPastToday = (slot: (typeof TIME_SLOTS)[0]) => {
    const slotStartMinutes = slot.hour * 60 + slot.min;
    return slotStartMinutes <= currentMinutes + 15;
  };

  // Đếm số lượt hẹn đã đặt cho một khung giờ
  const getSlotCount = (slotVal: string, forTomorrow: boolean) => {
    if (!existingAppointments) return 0;
    return existingAppointments.filter((item) => {
      if (appointment && item.id === appointment.id) return false;
      if (item.status === 'cancelled' || item.status === 'expired') return false;

      const isTomorrowApt =
        item.dateDisplay?.startsWith('Ngày mai') ||
        (() => {
          if (item.appointmentDateRaw) {
            const d = new Date(item.appointmentDateRaw);
            const tom = new Date();
            tom.setDate(tom.getDate() + 1);
            return d.toDateString() === tom.toDateString();
          }
          return false;
        })();

      const isTodayApt =
        item.dateDisplay === 'Hôm nay' ||
        (() => {
          if (item.appointmentDateRaw) {
            const d = new Date(item.appointmentDateRaw);
            return d.toDateString() === new Date().toDateString();
          }
          return false;
        })();

      const dateMatches = forTomorrow ? isTomorrowApt : isTodayApt;
      const slotMatches =
        item.slotTime === slotVal ||
        (item.slotTime && item.slotTime.includes(slotVal.split(' - ')[0]));

      return dateMatches && slotMatches;
    }).length;
  };

  // Kiểm tra xem Hôm nay còn ca nào khả dụng không (chưa qua giờ và chưa kín chỗ)
  const isTodayAvailable = TIME_SLOTS.some((slot) => {
    if (isSlotPastToday(slot)) return false;
    const count = getSlotCount(slot.val, false);
    return count < MAX_SLOT_CAPACITY;
  });

  // Định dạng hiển thị ngày/tháng/năm
  const todayDateStr = (() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  })();

  const tomorrowDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  })();

  // Target date selection: 'today' | 'tomorrow' (Tối đa ngày hôm sau)
  const [dateChoice, setDateChoice] = useState<'today' | 'tomorrow'>('tomorrow');

  // Target slot choice
  const [selectedSlot, setSelectedSlot] = useState<string>('09:30 - 10:30');
  const [contactMethod, setContactMethod] = useState<'staff_called' | 'customer_called' | 'zalo'>('staff_called');
  const [reasonNote, setReasonNote] = useState<string>('Khách báo bận, xin đổi giờ hẹn');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tự động chọn Ngày mai nếu hôm nay đã hết ca
  useEffect(() => {
    if (!isOpen || !appointment) return;
    if (!isTodayAvailable) {
      setDateChoice('tomorrow');
    }
  }, [isTodayAvailable, isOpen, appointment]);

  // Tự động chọn ca hợp lệ đầu tiên khi mở modal hoặc khi đổi ngày
  useEffect(() => {
    if (!isOpen || !appointment) return;
    const isTomorrow = dateChoice === 'tomorrow';
    const firstAvailable = TIME_SLOTS.find((s) => {
      if (!isTomorrow && isSlotPastToday(s)) return false;
      const count = getSlotCount(s.val, isTomorrow);
      return count < MAX_SLOT_CAPACITY;
    });

    if (firstAvailable) {
      setSelectedSlot(firstAvailable.val);
    } else {
      setSelectedSlot('');
    }
  }, [dateChoice, isOpen, isTodayAvailable, appointment]);

  if (!isOpen || !appointment || !mounted) return null;

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
      }

      // Find slot hour
      const slotObj = TIME_SLOTS.find((s) => s.val === selectedSlot) || TIME_SLOTS[1];
      targetDate.setHours(slotObj.hour, slotObj.min, 0, 0);

      // Make sure date is not in past
      if (targetDate.getTime() < now.getTime() - 5 * 60 * 1000) {
        targetDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead
      }

      const methodLabel =
        contactMethod === 'customer_called'
          ? '[Khách gọi đến]'
          : contactMethod === 'zalo'
          ? '[Khách báo qua Zalo/SMS]'
          : '[Đã gọi xác nhận với khách]';

      await onConfirm(
        appointment,
        targetDate.toISOString(),
        selectedSlot,
        `${methodLabel} ${reasonNote.trim() || 'Khách dời lịch hẹn'}`
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

          {/* 1. Chọn ngày mới (Chỉ cho phép tối đa ngày hôm sau) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn Ngày Hẹn Mới
              </label>
              
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {isTodayAvailable ? (
                <button
                  type="button"
                  onClick={() => setDateChoice('today')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center ${
                    dateChoice === 'today'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{todayDateStr}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed opacity-60 flex items-center justify-center select-none"
                >
                  <span>{todayDateStr}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDateChoice('tomorrow')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center ${
                  dateChoice === 'tomorrow'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{tomorrowDateStr}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              * Quy định vận hành: Cơ sở chỉ hỗ trợ dời lịch hẹn tối đa sang <strong>ngày hôm sau</strong> để tránh giữ phòng trống quá hạn quy định.
            </p>
          </div>

          {/* 2. Chọn Khung giờ mới */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Khung Giờ Mới
              </label>
              <span className="text-[11px] text-slate-400">
                (Tối đa {MAX_SLOT_CAPACITY} khách / ca)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {TIME_SLOTS.map((s) => {
                const isTomorrow = dateChoice === 'tomorrow';
                const isPast = !isTomorrow && isSlotPastToday(s);
                const bookingCount = getSlotCount(s.val, isTomorrow);
                const isFull = bookingCount >= MAX_SLOT_CAPACITY;
                const isDisabled = isPast || isFull;

                if (isDisabled) {
                  return (
                    <div
                      key={s.val}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs flex items-center justify-between cursor-not-allowed opacity-60 select-none"
                    >
                      <span className="truncate">{s.label}</span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                        {isPast ? 'Đã qua giờ' : 'Kín ca'}
                      </span>
                    </div>
                  );
                }

                return (
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
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate">{s.label}</span>
                      {bookingCount > 0 && (
                        <span className="text-[10px] text-amber-600 font-semibold shrink-0">
                          ({bookingCount}/{MAX_SLOT_CAPACITY})
                        </span>
                      )}
                    </div>
                    {selectedSlot === s.val && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Hình thức xác nhận liên hệ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Hình Thức Xác Nhận Với Khách Hàng
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContactMethod('staff_called')}
                className={`py-2 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                  contactMethod === 'staff_called'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Nhân viên gọi điện
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('customer_called')}
                className={`py-2 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                  contactMethod === 'customer_called'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Khách gọi đến
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('zalo')}
                className={`py-2 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                  contactMethod === 'zalo'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Zalo / SMS
              </button>
            </div>
          </div>

          {/* 4. Lý do dời hẹn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Ghi Chú / Lý Do Dời Lịch
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
              disabled={isSubmitting || !selectedSlot}
              title={!selectedSlot ? 'Vui lòng chọn khung giờ hẹn khả dụng' : undefined}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
