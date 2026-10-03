'use client';

import React from 'react';
import {
  CheckCircle2,
  Printer,
  Send,
  Inbox
} from 'lucide-react';
import { CheckInAppointment } from '../types';

interface HandoverSuccessProps {
  appointment: CheckInAppointment;
  assignedUnit: string;
  customPin: string;
  customRfid: string;
  onOpenPrintModal: () => void;
  onSendNotification: () => void;
  onBackToQueue: () => void;
}

export default function HandoverSuccess({
  appointment,
  assignedUnit,
  customPin,
  customRfid,
  onOpenPrintModal,
  onSendNotification,
  onBackToQueue,
}: HandoverSuccessProps) {
  const finalUnit = assignedUnit || appointment.assignedUnit;
  const finalPin = customPin || appointment.accessPin;
  const finalRfid = customRfid || appointment.rfidCard;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-slide-up-fade">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-center p-8 sm:p-12 space-y-8">
        {/* Biểu tượng thành công với hiệu ứng */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs border-2 border-white shadow-md">
            ✓
          </div>
        </div>

        {/* Tiêu đề chính */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bàn Giao Ô Kho Thành Công!
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Hồ sơ nhận kho của khách hàng <strong>{appointment.customerName}</strong> đã được lưu trữ thành công vào hệ thống.
          </p>
        </div>

        {/* Thẻ cập nhật trạng thái hệ thống */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trạng thái Cập nhật Hệ thống:
            </span>
            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="text-slate-500">Mã đơn: {appointment.id}</span>
              {appointment.contractCode && (
                <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  HĐ: {appointment.contractCode}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Trạng thái Ô kho: Đang thuê (Occupied) */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block mb-1">Trạng thái Ô kho:</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="font-bold text-sm text-slate-900">
                  #{finalUnit}: ĐANG THUÊ (Occupied)
                </span>
              </div>
            </div>

            {/* Trạng thái Đơn hẹn: Hoàn tất (Completed) */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block mb-1">Trạng thái Đơn hẹn:</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-sm text-slate-900">
                  HOÀN TẤT (Completed)
                </span>
              </div>
            </div>
          </div>

          {/* Tóm tắt thông tin truy cập Smart Lock & Thẻ từ */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Mã PIN Smart Lock đã kích hoạt:</div>
              <div className="text-2xl tabular-nums font-bold tracking-widest text-emerald-400">
                {finalPin}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400">Thẻ từ bàn giao:</div>
              <div className="text-sm tabular-nums font-bold text-white">
                {finalRfid}
              </div>
            </div>
          </div>
        </div>

        {/* Các nút hành động tiếp theo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenPrintModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In Phiếu bàn giao cho khách</span>
          </button>

          <button
            onClick={onSendNotification}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-slate-600" />
            <span>Gửi SMS / Zalo mã kho</span>
          </button>

          <button
            onClick={onBackToQueue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Inbox className="w-4 h-4" />
            <span>Quay lại Hàng đợi nhận kho</span>
          </button>
        </div>
      </div>
    </div>
  );
}
