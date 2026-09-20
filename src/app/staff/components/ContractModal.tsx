'use client';

import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { CheckInAppointment } from '../types';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: CheckInAppointment;
  assignedUnit: string;
  onPrint: () => void;
}

export default function ContractModal({
  isOpen,
  onClose,
  appointment,
  assignedUnit,
  onPrint,
}: ContractModalProps) {
  if (!isOpen) return null;

  const finalUnit = assignedUnit || appointment.assignedUnit;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-slide-up-fade">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#4f39f6]" />
            <h3 className="font-bold text-base text-slate-900">
              Xem trước Hợp đồng Cho thuê Kỹ thuật số
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Contract Text */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 font-sans leading-relaxed">
          <div className="text-center space-y-1 border-b border-slate-200 pb-3">
            <div className="font-bold text-sm text-slate-900 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-[11px] text-slate-500">Độc lập - Tự do - Hạnh phúc</div>
            <div className="font-bold text-sm text-[#4f39f6] pt-2">
              HỢP ĐỒNG THUÊ KHO TỰ QUẢN (SELF-STORAGE LEASE AGREEMENT)
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Số: SS-HD-{appointment.id.replace('SS-BK-', '')}/2026
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900">BÊN CHO THUÊ (BÊN A):</div>
            <p>CÔNG TY CỔ PHẦN DỊCH VỤ LƯU TRỮ TỰ QUẢN SELFSTORAGE VIỆT NAM</p>
            <p>Địa chỉ cơ sở: Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh</p>
            <p>Đại diện bàn giao: Trần Hùng - Nhân viên cơ sở trực ban</p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900">BÊN THUÊ (BÊN B):</div>
            <p>Ông/Bà: <strong>{appointment.customerName}</strong></p>
            <p>Số CCCD/Hộ chiếu: <strong>{appointment.idCard}</strong></p>
            <p>Số điện thoại: <strong>{appointment.phone}</strong> | Email: {appointment.email}</p>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-2">
            <div className="font-bold text-slate-900">ĐIỀU 1: THÔNG TIN Ô KHO VÀ MỤC ĐÍCH THUÊ</div>
            <p>1.1. Mã ô kho bàn giao: <strong>#{finalUnit}</strong> ({appointment.preferredFloor}).</p>
            <p>1.2. Loại hình: {appointment.unitType} - Diện tích: {appointment.unitSize}.</p>
            <p>1.3. Mục đích sử dụng: {appointment.purpose}. Không lưu trữ chất cấm, chất cháy nổ hoặc hàng hóa nguy hiểm theo quy định pháp luật.</p>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-2">
            <div className="font-bold text-slate-900">ĐIỀU 2: THỜI HẠN VÀ GIÁ THUÊ</div>
            <p>2.1. Thời hạn thuê: <strong>{appointment.durationMonths} tháng</strong>, bắt đầu từ ngày {appointment.startDate}.</p>
            <p>2.2. Giá thuê hàng tháng: <strong>{appointment.monthlyRent}</strong> (đã bao gồm thuế GTGT và phí an ninh).</p>
            <p>2.3. Tiền đặt cọc: Đã nhận <strong>{appointment.depositAmount}</strong> qua hệ thống thanh toán điện tử.</p>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-2">
            <div className="font-bold text-slate-900">ĐIỀU 3: QUYỀN TRUY CẬP VÀ AN NINH</div>
            <p>3.1. Bên B được cấp quyền truy cập cá nhân thông qua mã Smart Lock PIN và Thẻ từ RFID.</p>
            <p>3.2. Bên B có nghĩa vụ tự bảo mật mã khóa của mình.</p>
          </div>

          <div className="pt-4 flex justify-between items-center text-center font-semibold">
            <div>
              <div>ĐẠI DIỆN BÊN A</div>
              <div className="text-[10px] text-emerald-600 mt-6">[ Đã ký số điện tử ]</div>
            </div>
            <div>
              <div>ĐẠI DIỆN BÊN B</div>
              <div className="text-[10px] text-emerald-600 mt-6">[ Đã xác nhận OTP ]</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              onPrint();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-lg shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            In Hợp Đồng Này
          </button>
        </div>
      </div>
    </div>
  );
}
