'use client';

import React from 'react';
import { Printer, Boxes } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment;
  assignedUnit: string;
  customPin: string;
  onConfirmPrint: () => void;
}

export default function PrintModal({
  isOpen,
  onClose,
  appointment,
  assignedUnit,
  customPin,
  onConfirmPrint,
}: PrintModalProps) {
  if (!isOpen) return null;

  const finalUnit = assignedUnit || appointment.assignedUnit;
  const finalPin = customPin || appointment.accessPin;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-[#4f39f6]" />
            <h3 className="font-bold text-sm text-slate-900">
              Gửi Lệnh In Tài Liệu Đến Quầy Lễ Tân
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Preview Sheet */}
        <div className="p-6 space-y-4">
          <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#4f39f6]" />
                PHIẾU BÀN GIAO & TRUY CẬP KHO
              </div>
              <span className="text-[11px] font-mono text-slate-400">SelfStorage VN</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Khách hàng:</span>
                <div className="font-bold text-slate-900">{appointment.customerName}</div>
              </div>
              <div>
                <span className="text-slate-400">Số ô kho:</span>
                <div className="font-bold text-[#4f39f6] text-base">
                  #{finalUnit}
                </div>
              </div>
            </div>

            {/* Big PIN for Customer */}
            <div className="p-3 bg-slate-100 rounded-lg text-center">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Mã PIN mở khóa ô kho</div>
              <div className="text-2xl font-mono font-extrabold tracking-widest text-slate-900 mt-1">
                {finalPin}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dùng nhập tại bàn phím số gắn trên cửa kho</div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>Máy in chỉ định: Máy in nhiệt Quầy 01 (Canon LBP-2900)</span>
              <span className="text-emerald-600 font-semibold">Sẵn sàng</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirmPrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            In Ngay (Print)
          </button>
        </div>
      </div>
    </div>
  );
}
