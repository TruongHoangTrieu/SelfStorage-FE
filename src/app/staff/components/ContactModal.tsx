'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Mail, MessageSquare, Copy, Check, X, Clock, UserX, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CheckInAppointment } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment | null;
  onOpenReschedule?: (appointment: CheckInAppointment) => void;
  onOpenNoShow?: (appointment: CheckInAppointment) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  appointment,
  onOpenReschedule,
  onOpenNoShow,
}: ContactModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [contactAttempted, setContactAttempted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setContactAttempted(false);
  }, [isOpen]);

  if (!isOpen || !appointment || !mounted) return null;

  const reminderMessage = `Kính gửi quý khách ${appointment.customerName}, SelfStorage xin thông báo lịch hẹn tiếp nhận ô kho #${appointment.assignedUnit} tại cơ sở ${appointment.facilityName || 'SelfStorage'} vào lúc ${appointment.slotTime} (${appointment.dateDisplay || appointment.startDate}). Quý khách vui lòng đến quầy tiếp tân hoặc liên hệ hotline cơ sở để nhân viên hỗ trợ bàn giao và kích hoạt mã khóa Smart Lock. Trân trọng!`;

  const handleCallPhone = () => {
    toast.info(`Đang kết nối cuộc gọi tới ${appointment.phone}. Sau khi trao đổi xong, vui lòng nhấn "Xác nhận đã liên hệ xong" bên dưới.`);
  };

  const handleSendEmail = () => {
    toast.info(`Đã mở email gửi tới ${appointment.email}. Sau khi gửi xong, vui lòng nhấn "Xác nhận đã liên hệ xong" bên dưới.`);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage);
      setCopied(true);
      toast.success('Đã sao chép tin nhắn nhắc hẹn vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Không thể tự động sao chép. Vui lòng chọn và sao chép thủ công.');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Liên Hệ Khách Hàng</h3>
              <p className="text-xs text-slate-500">
                Lịch hẹn: <span className="font-semibold text-slate-700">{appointment.slotTime}</span> • Ô {appointment.assignedUnit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Thông tin khách hàng */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Họ và tên</span>
              <span className="text-sm font-bold text-slate-900">{appointment.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Số điện thoại</span>
              <span className="text-sm font-mono font-bold text-blue-600">{appointment.phone}</span>
            </div>
            {appointment.email && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-xs font-medium text-slate-700">{appointment.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">CCCD / Định danh</span>
              <span className="text-xs font-mono text-slate-700">{appointment.idCard || 'Đã xác thực'}</span>
            </div>
          </div>

          {/* Bước 1: Quick Action Buttons (Gọi điện hoặc Gửi Email) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Bước 1: Thực Hiện Liên Hệ (Bắt buộc)</span>
              </label>
              {contactAttempted ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Đã liên hệ
                </span>
              ) : (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  Chưa gọi / gửi email
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${appointment.phone.replace(/\s+/g, '')}`}
                onClick={handleCallPhone}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 text-center cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Gọi điện thoại ngay</span>
              </a>

              {appointment.email ? (
                <a
                  href={`mailto:${appointment.email}?subject=Nhắc lịch hẹn nhận ô kho ${appointment.assignedUnit} - SelfStorage&body=${encodeURIComponent(reminderMessage)}`}
                  onClick={handleSendEmail}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all active:scale-95 text-center cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gửi Email nhắc</span>
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold text-center cursor-not-allowed">
                  <Mail className="w-4 h-4" />
                  <span>Không có email</span>
                </div>
              )}
            </div>

            {/* Nút xác nhận đã liên hệ xong với khách hàng */}
            {!contactAttempted && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setContactAttempted(true);
                    toast.success('Đã xác nhận hoàn thành liên hệ. Vui lòng chọn kết quả bên dưới.');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Xác nhận đã liên hệ xong với khách hàng</span>
                  
                </button>
              </div>
            )}
          </div>

          {/* Mẫu tin nhắn SMS / Zalo nhắc hẹn */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                Mẫu Tin Nhắn Nhắc Hẹn (SMS / Zalo)
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mẫu</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans select-all">
              {reminderMessage}
            </div>
          </div>

          {/* Bước 2: CHỈ HIỂN THỊ KHI ĐÃ BẤM XÁC NHẬN HOÀN THÀNH BƯỚC 1 */}
          {contactAttempted && (
            <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                  <span>Bước 2: Kết Quả Xử Lý Sau Khi Liên Hệ</span>
                </label>
                <button
                  type="button"
                  onClick={() => setContactAttempted(false)}
                  className="text-[11px] text-slate-500 hover:text-blue-600 underline cursor-pointer"
                >
                  Chọn lại Bước 1
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="leading-relaxed">
                  Đã hoàn tất liên hệ! Vui lòng chọn kết quả xử lý theo thỏa thuận với khách hàng:
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReschedule?.(appointment);
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all active:scale-95 cursor-pointer text-center shadow-xs"
                >
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Khách xin dời lịch</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNoShow?.(appointment);
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold transition-all active:scale-95 cursor-pointer text-center shadow-xs"
                >
                  <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Khách báo hủy / Vắng mặt</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Close */}
          <div className="pt-2 flex justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
