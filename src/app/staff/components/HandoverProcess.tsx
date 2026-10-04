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
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  QrCode,
  Banknote,
  ShieldAlert,
  Check,
  X,
  Sparkles,
  DollarSign,
  Camera,
  Smartphone,
  ZoomIn,
  Upload,
  Image as ImageIcon
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
  condition?: string;
  onChangeCondition?: (val: string) => void;
  notes?: string;
  onChangeNotes?: (val: string) => void;
  isSubmitting?: boolean;
  staffName?: string;
  onBackToQueue: () => void;
  onOpenContractModal: () => void;
  onOpenPrintModal: () => void;
  onCompleteHandover: () => void;
}

// Hàm tách số tiền từ chuỗi định dạng VND (ví dụ: "1.200.000 đ" -> 1200000)
function parseCurrency(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = val.toString().match(/([\d.]+)\s*đ/);
  if (match) return parseInt(match[1].replace(/\./g, ''), 10) || 0;
  const digitsOnly = val.toString().replace(/[^\d]/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
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
  condition = 'Kho sạch sẽ, không hư hỏng, khóa cửa hoạt động tốt',
  onChangeCondition,
  notes = 'Đã bàn giao mã PIN và hướng dẫn khách sử dụng cửa',
  onChangeNotes,
  isSubmitting = false,
  staffName = 'Nhân viên lễ tân',
  onBackToQueue,
  onOpenContractModal,
  onOpenPrintModal,
  onCompleteHandover,
}: HandoverProcessProps) {
  // Tính toán tài chính dự kiến
  const monthlyRentNum = parseCurrency(appointment.monthlyRent);
  const depositNum = parseCurrency(appointment.depositAmount);
  const durationMonths = appointment.durationMonths || 1;

  // Chiết khấu theo kỳ hạn thuê (đồng bộ chuẩn toàn hệ thống)
  const discountPercent =
    durationMonths >= 12 ? 15 : durationMonths >= 6 ? 10 : durationMonths >= 3 ? 5 : 0;
  const rawTotal = monthlyRentNum * durationMonths;
  const discountAmount = Math.round(rawTotal * (discountPercent / 100));
  const totalRent = rawTotal - discountAmount;
  const remainingAmount = Math.max(0, totalRent - depositNum);

  // Trạng thái Ký hợp đồng
  const [isContractSigned, setIsContractSigned] = useState<boolean>(false);

  // Danh sách ảnh hiện trạng ô kho (chụp từ mobile và đồng bộ về)
  const [photos, setPhotos] = useState([
    {
      id: 'photo-1',
      title: 'Cửa cuốn & Ổ khóa thông minh',
      description: 'Khóa IoT hoạt động bình thường, cửa cuốn không móp méo',
      url: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800&auto=format&fit=crop&q=80',
      time: '08:15',
      author: 'NV Tuần Kho',
    },
    {
      id: 'photo-2',
      title: 'Không gian bên trong ô kho',
      description: 'Sàn kho sạch sẽ, tường vách khô ráo, không mùi lạ',
      url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=80',
      time: '08:16',
      author: 'NV Tuần Kho',
    },
    {
      id: 'photo-3',
      title: 'Hệ thống PCCC & Hành lang',
      description: 'Đầu phun sprinkler nguyên vẹn, đèn chiếu sáng ổn định',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      time: '08:17',
      author: 'NV Tuần Kho',
    },
  ]);

  // Modal phóng to ảnh (Lightbox)
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id: string;
    title: string;
    description: string;
    url: string;
    time: string;
    author: string;
  } | null>(null);

  // Xử lý upload ảnh bổ sung từ máy tính
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      const newPhoto = {
        id: `photo-${Date.now()}`,
        title: `Ảnh bổ sung (${file.name})`,
        description: 'Tải lên từ máy tính quầy lễ tân',
        url: newUrl,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        author: staffName,
      };
      setPhotos((prev) => [...prev, newPhoto]);
    }
  };

  // Checklist kiểm tra tại chỗ
  const [checklist, setChecklist] = useState({
    lockTested: true,
    lightingChecked: true,
    cleanlinessChecked: true,
  });

  const activeUnit = selectedUnitCode || appointment.assignedUnit;

  const handleAttemptProceed = () => {
    if (!isContractSigned) {
      alert('Vui lòng xác nhận KÝ HỢP ĐỒNG KỸ THUẬT SỐ trước khi tiếp tục sang bước Thu tiền & Bàn giao mã PIN!');
      return;
    }
    onCompleteHandover();
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 animate-slide-up-fade">
      {/* Back breadcrumb & action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Quay lại hàng đợi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Thủ tục Hợp Đồng & Bàn Giao: {appointment.customerName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Bước 1: Ký Hợp Đồng
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mã đơn hẹn: {appointment.id} • Giờ hẹn: {appointment.slotTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* [ NÚT IN TÀI LIỆU ] */}
          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In tài liệu</span>
          </button>

          {/* [ NÚT TIẾP TỤC SANG THU TIỀN & BÀN GIAO ] */}
          <button
            onClick={handleAttemptProceed}
            disabled={isSubmitting || !isContractSigned}
            title={
              !isContractSigned
                ? 'Yêu cầu: Ký hợp đồng trước khi tiếp tục'
                : 'Tiếp tục sang bước Thu tiền & Cấp mã PIN'
            }
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              !isContractSigned
                ? 'bg-slate-400 cursor-not-allowed opacity-75 shadow-none'
                : isSubmitting
                ? 'bg-blue-600/70 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý Backend...</span>
              </>
            ) : (
              <>
                <span>Ký Hợp Đồng & Tiếp Tục Thu Tiền</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Tracker Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">1. Ô kho bàn giao</div>
            <div className="text-[11px] text-blue-600 font-medium">Ô #{activeUnit}</div>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            isContractSigned
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isContractSigned ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {isContractSigned ? '✓' : '2'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">2. Hợp đồng điện tử</div>
            <div
              className={`text-[11px] font-semibold ${
                isContractSigned ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isContractSigned ? 'Đã ký số ✓' : 'Chưa ký tại quầy'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-slate-500">
          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-700 truncate">3. Thu tiền & Cấp mã PIN</div>
            <div className="text-[11px] text-slate-500">
              {isContractSigned ? 'Sẵn sàng chuyển bước →' : 'Bước tiếp theo'}
            </div>
          </div>
        </div>
      </div>

      {/* Màn hình chia đôi (Split Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* BẢNG BÊN TRÁI (THÔNG TIN KHÁCH HÀNG & TÀI CHÍNH) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Thẻ định danh khách hàng */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {appointment.customerName
                    .split(' ')
                    .slice(-2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{appointment.customerName}</h3>
                  <p className="text-xs text-slate-500">Khách thuê mới</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Đã đặt lịch hẹn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Số điện thoại</span>
                <span className="font-semibold text-slate-900 text-sm">{appointment.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email liên hệ</span>
                <span className="font-medium text-slate-800 text-sm truncate block">
                  {appointment.email}
                </span>
              </div>
            </div>
          </div>

          {/* Chi tiết đặt chỗ & Bảng kê tài chính */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Bảng Kê Hợp Đồng & Tài Chính
              </h3>
              <span className="tabular-nums text-xs text-slate-500 font-semibold">
                {appointment.id}
              </span>
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
                <span className="font-bold text-blue-600">{durationMonths} tháng</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Giá thuê niêm yết:</span>
                <span className="font-bold text-slate-900">
                  {formatVND(monthlyRentNum)} / tháng
                </span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between py-1.5 border-b border-emerald-100 text-emerald-700 bg-emerald-50/50 px-2 rounded-md">
                  <span className="font-medium">Ưu đãi kỳ hạn ({discountPercent}%):</span>
                  <span className="font-bold">-{formatVND(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-slate-200 bg-slate-50 px-2 rounded-lg font-bold text-slate-900">
                <span>Tổng tiền thuê ({durationMonths} tháng):</span>
                <span className="text-blue-700 text-sm">{formatVND(totalRent)}</span>
              </div>

              {/* Trạng thái tiền cọc */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-950">
                      Tiền đặt cọc: ĐÃ XÁC NHẬN
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Đã thanh toán {formatVND(depositNum)} trực tuyến
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800">{formatVND(depositNum)}</span>
              </div>

              {/* Phần tiền thuê còn lại sẽ thu ở bước sau */}
              <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-300 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Tiền thuê còn lại (Sẽ thu ở bước tiếp theo):
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Thanh toán bằng VietQR hoặc Tiền mặt sau khi ký HĐ
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold tabular-nums text-amber-900">
                    {formatVND(remainingAmount)}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 bg-amber-200 text-amber-900">
                    THU TẠI BƯỚC TIẾP THEO
                  </span>
                </div>
              </div>

              {/* Mục đích lưu kho */}
              <div className="pt-2">
                <span className="text-slate-400 block mb-1 font-medium">
                  Mục đích lưu trữ khai báo:
                </span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs italic">
                  &quot;{appointment.purpose}&quot;
                </p>
              </div>

              {appointment.specialNotes && (
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1 font-medium">
                    Yêu cầu đặc biệt của khách:
                  </span>
                  <p className="text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                    ⚠️ {appointment.specialNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BẢNG BÊN PHẢI (CÁC THAO TÁC HỢP ĐỒNG BÀN GIAO) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Gán Ô Kho (Unit Allocation Dropdown) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  1. Xác nhận hoặc Thay đổi Ô kho được Gán
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn ô kho khác nếu ô ban đầu không khả dụng hoặc khách muốn đổi vị trí.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
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
                  className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl px-4 py-3 pr-10 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer"
                >
                  <optgroup label="Ô ban đầu chỉ định">
                    <option value={appointment.assignedUnit}>
                      Ô {appointment.assignedUnit} • {appointment.preferredFloor} (Chỉ định theo đơn
                      đặt)
                    </option>
                  </optgroup>
                  <optgroup label="Các ô kho trống khả dụng cùng loại">
                    {availableUnits
                      .filter((u) => u.code !== appointment.assignedUnit && u.status === 'vacant')
                      .map((unit) => (
                        <option key={unit.id} value={unit.code}>
                          Ô {unit.code} • {unit.floor} • {unit.size} ({unit.features})
                        </option>
                      ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 2. Hợp đồng Kỹ thuật số & Xác nhận Ký (Bắt buộc) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  2. Ký Hợp Đồng Kỹ Thuật Số (Bắt buộc)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khách hàng đọc điều khoản & hoàn tất ký số thỏa thuận thuê kho
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenContractModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem toàn văn HĐ
                </button>
              </div>
            </div>

            {/* Trích đoạn tóm tắt hợp đồng */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5 font-sans text-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-slate-900 block">
                    HỢP ĐỒNG CHO THUÊ KHO BÃI & NHÀ XƯỞNG
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    Số: SS-HĐ-{appointment.id.replace(/[^a-zA-Z0-9]/g, '')}/2026
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Luật Việt Nam 2026
                  </span>
                  {isContractSigned ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã ký số thành công
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Chờ ký kết tại quầy
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <p>
                  • <strong>Bên A (Cho thuê):</strong> CÔNG TY CP SELFSTORAGE VN
                </p>
                <p>
                  • <strong>Bên B (Khách thuê):</strong>{' '}
                  <strong className="text-slate-900">{appointment.customerName}</strong> (SĐT:{' '}
                  {appointment.phone})
                </p>
                <p>
                  • <strong>Ngăn kho bàn giao:</strong>{' '}
                  <strong className="text-blue-600">Ô #{activeUnit}</strong> (
                  {appointment.unitSize})
                </p>
                <p>
                  • <strong>Thời hạn thuê:</strong> {durationMonths} tháng (Từ{' '}
                  {appointment.startDate})
                </p>
              </div>
            </div>

            {/* Hộp hành động Ký hợp đồng */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isContractSigned
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-amber-50/60 border-amber-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {isContractSigned
                        ? '✓ Khách hàng & Nhân viên ĐÃ KÝ HỢP ĐỒNG'
                        : '⚠️ Khách hàng chưa ký kết hợp đồng số'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isContractSigned
                      ? 'Hợp đồng điện tử đã có hiệu lực pháp lý. Bạn có thể bấm tiếp tục sang bước Thu tiền & Bàn giao.'
                      : 'Vui lòng cho khách ký trên tablet hoặc xác nhận khách đã đồng ý toàn văn điều khoản.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsContractSigned(!isContractSigned)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    isContractSigned
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-[#4f39f6] text-white hover:bg-[#432fe0] active:scale-95'
                  }`}
                >
                  {isContractSigned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã Ký Hợp Đồng (Nhấn để hủy)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Xác Nhận Ký Hợp Đồng Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Checklist kiểm tra kho tại chỗ & Ảnh hiện trạng từ Mobile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  3. Danh mục Kiểm tra Thực địa &amp; Ảnh Hiện Trạng Ô Kho
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đối soát cơ sở vật chất và ảnh chụp thực địa từ ứng dụng di động trước khi bàn giao
                </p>
              </div>

              
            </div>

            {/* KHUNG HIỂN THỊ ẢNH CHỤP TỪ MOBILE APP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Ảnh hiện trạng ô kho #{activeUnit} (Chụp bởi nhân viên đi kho):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleUploadPhoto}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Tải thêm ảnh</span>
                  </button>
                </div>
              </div>

              {/* Grid danh sách ảnh thumbnail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPhoto(p)}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-slate-900">
                      <img
                        src={p.url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 rounded-full bg-white/90 text-slate-900 shadow-md">
                          <ZoomIn className="w-4 h-4" />
                        </span>
                      </div>
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-xs">
                        {p.time}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <div className="font-bold text-xs text-slate-900 truncate">{p.title}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/60 flex items-center justify-between text-[11px] text-blue-800">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Ảnh chụp sẽ được lưu trữ tự động vào Phụ lục Biên bản Bàn giao hiện trạng tài sản.</span>
                </div>
                <span className="font-semibold">{photos.length} ảnh đã xác thực</span>
              </div>
            </div>

            {/* Checklist kiểm tra tại chỗ */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 block">
                Xác nhận các điều kiện kỹ thuật trước khi khách nhận kho:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.lockTested}
                    onChange={(e) => setChecklist({ ...checklist, lockTested: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <span className="text-slate-800 font-medium">Khóa cửa hoạt động tốt</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.lightingChecked}
                    onChange={(e) =>
                      setChecklist({ ...checklist, lightingChecked: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <span className="text-slate-800 font-medium">Đèn chiếu sáng &amp; thông gió ổn định</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={checklist.cleanlinessChecked}
                    onChange={(e) =>
                      setChecklist({ ...checklist, cleanlinessChecked: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <span className="text-slate-800 font-medium">Ô kho sạch sẽ, không mùi lạ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Thanh tác vụ chính */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Nhân viên phụ trách: <strong className="text-slate-900">{staffName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* [ NÚT TIẾP TỤC SANG THU TIỀN ] */}
              <button
                type="button"
                onClick={handleAttemptProceed}
                disabled={isSubmitting || !isContractSigned}
                title={
                  !isContractSigned
                    ? 'Yêu cầu: Khách hàng ký hợp đồng trước khi tiếp tục'
                    : 'Tiếp tục sang bước Thu tiền & Cấp mã PIN'
                }
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                  !isContractSigned
                    ? 'bg-slate-400 cursor-not-allowed opacity-75 shadow-none'
                    : isSubmitting
                    ? 'bg-blue-600/70 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý Backend...</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp Tục Thu Tiền</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX XEM ẢNH HIỆN TRẠNG PHÓNG TO */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-slide-up-fade"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {selectedPhoto.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Ô kho #{activeUnit}</span>
                    <span>•</span>
                    <span>Chụp lúc: {selectedPhoto.time}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">{selectedPhoto.author}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ảnh to */}
            <div className="bg-slate-950 p-2 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Chi tiết & Footer */}
            <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">
                  Ghi chú hiện trạng: {selectedPhoto.description}
                </p>
                <p className="text-[11px] text-slate-500">
                  Đã kiểm tra và lưu vết trên hệ thống máy chủ đám mây SelfStorage VN.
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Mở ảnh gốc
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

