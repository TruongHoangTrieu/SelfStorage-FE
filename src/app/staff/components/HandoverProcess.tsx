'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Building2,
  Key,
  Lock,
  RefreshCw,
  CreditCard,
  FileText,
  Eye,
  Printer,
  CheckCircle2,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { CheckInAppointment, AvailableUnit } from '../types';

interface HandoverProcessProps {
  appointment: CheckInAppointment;
  availableUnits: AvailableUnit[];
  selectedUnitCode: string;
  onChangeUnitCode: (code: string) => void;
  customPin: string;
  onChangeCustomPin: (pin: string) => void;
  customRfid: string;
  onChangeCustomRfid: (rfid: string) => void;
  onBackToQueue: () => void;
  onOpenContractModal: () => void;
  onOpenPrintModal: () => void;
  onCompleteHandover: () => void;
}

export default function HandoverProcess({
  appointment,
  availableUnits,
  selectedUnitCode,
  onChangeUnitCode,
  customPin,
  onChangeCustomPin,
  customRfid,
  onChangeCustomRfid,
  onBackToQueue,
  onOpenContractModal,
  onOpenPrintModal,
  onCompleteHandover,
}: HandoverProcessProps) {
  const [checklist, setChecklist] = useState({
    identityVerified: true,
    lockTested: true,
    lightingChecked: true,
    cleanlinessChecked: true,
  });

  const activeUnit = selectedUnitCode || appointment.assignedUnit;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up-fade">
      {/* Back breadcrumb & action bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Quay lại hàng đợi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Thủ tục Bàn giao: {appointment.customerName}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#4f39f6]/10 text-[#4f39f6] font-semibold border border-[#4f39f6]/20">
                Đang xử lý (In-Progress)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mã đơn hẹn: {appointment.id} • Giờ hẹn: {appointment.slotTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* [ NÚT IN TÀI LIỆU ] */}
          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Printer className="w-4 h-4 text-[#4f39f6]" />
            <span>In tài liệu</span>
          </button>

          {/* [ NÚT HOÀN TẤT BÀN GIAO ] */}
          <button
            onClick={onCompleteHandover}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl transition-all shadow-lg shadow-[#4f39f6]/30 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Hoàn tất bàn giao</span>
          </button>
        </div>
      </div>

      {/* Màn hình chia đôi (Split Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* BẢNG BÊN TRÁI (XÁC THỰC THÔNG TIN KHÁCH HÀNG & ĐẶT CỌC) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Thẻ định danh khách hàng */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {appointment.customerName.split(' ').slice(-2).map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{appointment.customerName}</h3>
                  <p className="text-xs text-slate-500">Khách thuê mới • Cá nhân</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Đã xác minh CCCD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Số điện thoại</span>
                <span className="font-semibold text-slate-900 text-sm">{appointment.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Số CCCD / Hộ chiếu</span>
                <span className="font-semibold text-slate-900 font-mono text-sm">{appointment.idCard}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Email liên hệ</span>
                <span className="font-medium text-slate-800">{appointment.email}</span>
              </div>
            </div>
          </div>

          {/* Chi tiết đặt chỗ & Tiền cọc */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4f39f6]" />
                Chi tiết Hợp đồng Đặt chỗ
              </h3>
              <span className="font-mono text-xs text-slate-500 font-semibold">{appointment.id}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Loại kho đăng ký:</span>
                <span className="font-bold text-slate-900">{appointment.unitType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Kích thước tiêu chuẩn:</span>
                <span className="font-semibold text-slate-800">{appointment.unitSize}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Ngày bắt đầu thuê:</span>
                <span className="font-semibold text-slate-800">{appointment.startDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Thời hạn thuê:</span>
                <span className="font-bold text-[#4f39f6]">{appointment.durationMonths} tháng</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Giá thuê hàng tháng:</span>
                <span className="font-bold text-slate-900">{appointment.monthlyRent}</span>
              </div>

              {/* Trạng thái tiền cọc */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-950">Tiền đặt cọc: ĐÃ XÁC NHẬN</div>
                    <div className="text-[11px] text-emerald-700">Đã thanh toán {appointment.depositAmount} qua VNPay</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800">100%</span>
              </div>

              {/* Mục đích lưu kho */}
              <div className="pt-2">
                <span className="text-slate-400 block mb-1 font-medium">Mục đích lưu trữ khai báo:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs italic">
                  &quot;{appointment.purpose}&quot;
                </p>
              </div>

              {appointment.specialNotes && (
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1 font-medium">Yêu cầu đặc biệt của khách:</span>
                  <p className="text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                    ⚠️ {appointment.specialNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BẢNG BÊN PHẢI (CÁC THAO TÁC BÀN GIAO TRỰC TIẾP) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Gán Ô Kho (Unit Allocation Dropdown) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#4f39f6]" />
                  1. Xác nhận hoặc Thay đổi Ô kho được Gán
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn ô kho khác nếu ô ban đầu không khả dụng hoặc khách muốn đổi vị trí.
                </p>
              </div>
              <span className="text-xs font-bold text-[#4f39f6] bg-[#4f39f6]/10 px-2.5 py-1 rounded-md">
                {appointment.unitType}
              </span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Ô kho bàn giao thực tế:
              </label>
              <div className="relative">
                <select
                  value={activeUnit}
                  onChange={(e) => onChangeUnitCode(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl px-4 py-3 pr-10 focus:outline-hidden focus:ring-2 focus:ring-[#4f39f6] focus:border-transparent transition-all cursor-pointer"
                >
                  <optgroup label="Ô ban đầu chỉ định">
                    <option value={appointment.assignedUnit}>
                      Ô {appointment.assignedUnit} • {appointment.preferredFloor} (Chỉ định theo đơn đặt)
                    </option>
                  </optgroup>
                  <optgroup label="Các ô kho trống khả dụng cùng loại">
                    {availableUnits
                      .filter(u => u.code !== appointment.assignedUnit && u.status === 'vacant')
                      .map(unit => (
                        <option key={unit.id} value={unit.code}>
                          Ô {unit.code} • {unit.floor} • {unit.size} ({unit.features})
                        </option>
                      ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Xem trước thông số ô kho đã chọn */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Ô kho được chọn bàn giao:</div>
                  <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                    <span>#{activeUnit}</span>
                    <span className="text-xs font-normal text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Trạng thái: Sẵn sàng bàn giao
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <div>Cửa cuốn chống rỉ • Mã khóa PIN IoT</div>
                  <div className="text-[11px] text-slate-400">Đã kiểm tra kỹ thuật lúc 07:30</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Cấp Quyền Truy Cập & Khóa An Toàn */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#4f39f6]" />
                  2. Cấp Quyền Truy Cập & Mã Khóa An Toàn
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập mã PIN bàn phím thông minh và thẻ từ RFID tại quầy
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Smart Lock PIN */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#4f39f6]" />
                    Mã PIN Smart Lock (6 số)
                  </span>
                  <button
                    onClick={() => {
                      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                      onChangeCustomPin(newPin);
                    }}
                    className="text-[11px] text-[#4f39f6] font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Tạo mới
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => onChangeCustomPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest font-mono text-xl font-bold bg-white border border-slate-300 rounded-lg py-2 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 text-center">Khách dùng mở khóa cửa kho & thang máy</p>
              </div>

              {/* RFID Card / Key */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#4f39f6]" />
                    Mã Thẻ Từ RFID / Tag
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Đã đồng bộ</span>
                </div>
                <input
                  type="text"
                  value={customRfid}
                  onChange={(e) => onChangeCustomRfid(e.target.value)}
                  className="w-full text-center font-mono text-sm font-bold bg-white border border-slate-300 rounded-lg py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 text-center">Quét thẻ vật lý tại cổng an ninh cơ sở</p>
              </div>
            </div>
          </div>

          {/* 3. Hợp đồng Kỹ thuật số & Xem trước */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#4f39f6]" />
                  3. Hợp đồng Kỹ thuật số (Digital Rental Agreement)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hợp đồng điện tử kèm điều khoản cho thuê và phụ lục bàn giao
                </p>
              </div>
              <button
                onClick={onOpenContractModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4f39f6] hover:bg-[#4f39f6]/10 rounded-lg transition-colors border border-[#4f39f6]/30"
              >
                <Eye className="w-3.5 h-3.5" />
                Xem trước toàn văn
              </button>
            </div>

            {/* Trích đoạn tóm tắt hợp đồng */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 font-mono text-slate-600">
              <div className="flex justify-between text-slate-800 font-bold border-b border-slate-200 pb-1">
                <span>HỢP ĐỒNG THUÊ KHO SỐ: HĐTK-{appointment.id.replace('SS-BK-', '')}</span>
                <span className="text-emerald-600">CHỮ KÝ SỐ HỢP LỆ</span>
              </div>
              <p>Bên A (Cho thuê): CÔNG TY CP DỊCH VỤ LƯU TRỮ TỰ QUẢN SELFSTORAGE VN</p>
              <p>Bên B (Khách thuê): <strong>{appointment.customerName}</strong> (CCCD: {appointment.idCard})</p>
              <p>Ô kho bàn giao: <strong>#{activeUnit}</strong> - {appointment.unitSize}</p>
              <p>Thời hạn thuê: Từ {appointment.startDate} ({appointment.durationMonths} tháng)</p>
            </div>

            {/* Danh mục kiểm tra tại chỗ (Checklist) */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 block">
                Danh mục kiểm tra tại chỗ trước khi giao chìa/mã:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.identityVerified}
                    onChange={(e) => setChecklist({ ...checklist, identityVerified: e.target.checked })}
                    className="rounded text-[#4f39f6] focus:ring-[#4f39f6]"
                  />
                  <span className="text-slate-800 font-medium">Đối soát CCCD gốc trùng khớp</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.lockTested}
                    onChange={(e) => setChecklist({ ...checklist, lockTested: e.target.checked })}
                    className="rounded text-[#4f39f6] focus:ring-[#4f39f6]"
                  />
                  <span className="text-slate-800 font-medium">Khóa cửa & mã PIN hoạt động tốt</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.lightingChecked}
                    onChange={(e) => setChecklist({ ...checklist, lightingChecked: e.target.checked })}
                    className="rounded text-[#4f39f6] focus:ring-[#4f39f6]"
                  />
                  <span className="text-slate-800 font-medium">Đèn chiếu sáng & thông gió ổn định</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.cleanlinessChecked}
                    onChange={(e) => setChecklist({ ...checklist, cleanlinessChecked: e.target.checked })}
                    className="rounded text-[#4f39f6] focus:ring-[#4f39f6]"
                  />
                  <span className="text-slate-800 font-medium">Ô kho sạch sẽ, không mùi lạ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Thanh tác vụ chính */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Nhân viên bàn giao: <strong>Trần Hùng</strong></span>
            </div>

            <div className="flex items-center gap-3">
              {/* [ Nút In Tài Liệu ] */}
              <button
                onClick={onOpenPrintModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>In tài liệu</span>
              </button>

              {/* [ Nút Hoàn tất bàn giao ] */}
              <button
                onClick={onCompleteHandover}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl transition-all shadow-lg shadow-[#4f39f6]/30 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn tất bàn giao</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
