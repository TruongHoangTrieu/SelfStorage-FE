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
  onOpenRentalPayment?: () => void;
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
  onOpenRentalPayment,
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

  // Trạng thái kiểm tra đối chiếu CCCD/Hộ chiếu tại quầy
  const [isCccdVerified, setIsCccdVerified] = useState<boolean>(true);

  // Sinh mã PIN Smart Lock ngẫu nhiên
  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    onChangeCustomPin(randomPin);
  };

  const activeUnit = selectedUnitCode || appointment.assignedUnit;

  const handleAttemptProceed = () => {
    if (!isCccdVerified) {
      alert('Vui lòng kiểm tra và xác nhận ĐỐI CHIẾU CCCD/HỘ CHIẾU của khách hàng trước khi bàn giao kho!');
      return;
    }
    if (!isContractSigned) {
      alert('Vui lòng xem/in và xác nhận KÝ HỢP ĐỒNG KỸ THUẬT SỐ trước khi tiếp tục bàn giao kho!');
      return;
    }
    if (appointment.rentalStatus !== 'paid' && remainingAmount > 0) {
      const openPay = window.confirm(
        `Đơn này còn tiền thuê kho chưa quyết toán (${formatVND(remainingAmount)}).\n\nNhấn 'OK' để mở giao diện thu tiền ngay (VietQR / Tiền mặt), hoặc nhấn 'Cancel' nếu bạn muốn ghi nợ/thu sau để hoàn tất cấp mã PIN ngay.`
      );
      if (openPay) {
        onOpenRentalPayment?.();
        return;
      }
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
                Thủ tục Bàn Giao &amp; Kích Hoạt Kho: {appointment.customerName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Tiếp nhận trực tiếp
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mã đơn: {appointment.id} • Giờ hẹn dự kiến: {appointment.slotTime} (Linh hoạt tiếp nhận)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* [ NÚT IN TÀI LIỆU ] */}
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In tài liệu</span>
          </button>

          {/* [ NÚT HOÀN TẤT BÀN GIAO & CẤP PIN ] */}
          <button
            type="button"
            onClick={handleAttemptProceed}
            disabled={isSubmitting || !isContractSigned}
            title={
              !isContractSigned
                ? 'Yêu cầu: Ký hợp đồng trước khi tiếp tục'
                : 'Hoàn tất bàn giao, cấp mã PIN Smart Lock và kích hoạt ô kho'
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
                <span>Hoàn Tất &amp; Cấp Mã PIN</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Tracker Bar (5 chuẩn bước theo luồng tiếp đón khách) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Bước 1 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">1. CCCD &amp; Ô kho</div>
            <div className="text-[11px] text-blue-600 font-medium truncate">Ô #{activeUnit}</div>
          </div>
        </div>

        {/* Bước 2 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">2. Ảnh hiện trạng</div>
            <div className="text-[11px] text-slate-500 font-medium truncate">{photos.length} ảnh kiểm tra</div>
          </div>
        </div>

        {/* Bước 3 */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            isContractSigned
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isContractSigned ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {isContractSigned ? '✓' : '3'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">3. Xem &amp; In HĐ</div>
            <div
              className={`text-[11px] font-semibold truncate ${
                isContractSigned ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isContractSigned ? 'Đã ký số ✓' : 'Chờ ký & in'}
            </div>
          </div>
        </div>

        {/* Bước 4 */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            appointment.rentalStatus === 'paid'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              appointment.rentalStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {appointment.rentalStatus === 'paid' ? '✓' : '4'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">4. Thu tiền thuê</div>
            <div
              className={`text-[11px] font-semibold truncate ${
                appointment.rentalStatus === 'paid' ? 'text-emerald-700' : 'text-blue-700'
              }`}
            >
              {appointment.rentalStatus === 'paid' ? 'Đã thu tiền' : 'Quyết toán tại quầy'}
            </div>
          </div>
        </div>

        {/* Bước 5 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            5
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">5. Cấp PIN &amp; Mở kho</div>
            <div className="text-[11px] text-blue-600 font-medium truncate font-mono">PIN: {customPin || '••••••'}</div>
          </div>
        </div>
      </div>

      {/* Màn hình chia đôi (Split Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* BẢNG BÊN TRÁI (THÔNG TIN KHÁCH HÀNG & TÀI CHÍNH) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Thẻ định danh khách hàng & Kiểm tra CCCD */}
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
                  <p className="text-xs text-slate-500">Khách thuê kho tự quản</p>
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
              <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block mb-0.5">Số Căn cước công dân (CCCD / Hộ chiếu):</span>
                <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                  {appointment.idCard || '079201008899'}
                </span>
              </div>
            </div>

            {/* Hộp đối chiếu CCCD tại quầy */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                isCccdVerified
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCccdVerified}
                  onChange={(e) => setIsCccdVerified(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">
                    {isCccdVerified
                      ? '✓ Đã kiểm tra & đối chiếu CCCD/Hộ chiếu gốc'
                      : '⚠️ Chưa xác thực CCCD/Hộ chiếu gốc tại quầy'}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Nhân viên đối chiếu ảnh và thông tin khách hàng trực tiếp tại quầy tiếp đón.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Chi tiết đặt chỗ & Bảng kê tài chính */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Bảng Kê Hợp Đồng &amp; Tài Chính
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
                      Đã thanh toán {formatVND(depositNum)} trực tuyến khi đặt chỗ
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800">{formatVND(depositNum)}</span>
              </div>

              {/* Phần tiền thuê còn lại */}
              <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Tiền thuê còn lại (Quyết toán tại quầy):
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Thực hiện sau bước xem &amp; in hợp đồng (Mục 4)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold tabular-nums text-slate-900">
                      {formatVND(remainingAmount)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        appointment.rentalStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {appointment.rentalStatus === 'paid' ? 'ĐÃ THU ĐỦ' : 'THU SAU KHI IN HĐ'}
                    </span>
                  </div>
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
        {/* BẢNG BÊN PHẢI (CÁC THAO TÁC HỢP ĐỒNG BÀN GIAO THEO ĐÚNG TRÌNH TỰ) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* BƯỚC 1: Xác nhận hoặc Đổi Ô Kho */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  1. Kiểm Tra &amp; Xác Nhận Gán Ô Kho (Đổi ô kho nếu khách đổi ý)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân viên có thể linh hoạt đổi sang ô kho trống khác cùng phân hạng nếu khách có nhu cầu.
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
                  <optgroup label="Ô ban đầu chỉ định theo đơn đặt">
                    <option value={appointment.assignedUnit}>
                      Ô {appointment.assignedUnit} • {appointment.preferredFloor} (Chỉ định theo đơn đặt)
                    </option>
                  </optgroup>
                  <optgroup label="Các ô kho trống khả dụng khác cùng loại">
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

          {/* BƯỚC 2: Lập Biên Bản Hiện Trạng Kèm Ảnh Chụp Thực Địa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  2. Lập Biên Bản Hiện Trạng Kèm Ảnh Chụp Thực Địa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đối soát cơ sở vật chất và ảnh chụp thực địa từ ứng dụng di động tuần kho hoặc quầy trước khi ký hợp đồng
                </p>
              </div>
            </div>

            {/* KHUNG HIỂN THỊ ẢNH CHỤP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Ảnh hiện trạng ô kho #{activeUnit} ({photos.length} ảnh):
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
                  <span>Ảnh chụp sẽ được lưu trữ tự động vào Phụ lục Biên bản Bàn giao hiện trạng ô kho.</span>
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
                  <span className="text-slate-800 font-medium">Đèn chiếu sáng ổn định</span>
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
                  <span className="text-slate-800 font-medium">Ô kho sạch sẽ, khô ráo</span>
                </label>
              </div>
            </div>

            {/* Tình trạng ô kho ghi nhận */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Ghi chú tình trạng ô kho trong biên bản:
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => onChangeCondition?.(e.target.value)}
                placeholder="VD: Ô kho sạch sẽ, không trầy xước, khóa hoạt động tốt"
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* BƯỚC 3: Xem, In & Ký Hợp Đồng Kỹ Thuật Số */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  3. Xem, In &amp; Ký Hợp Đồng Kỹ Thuật Số
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khách hàng đọc điều khoản, nhân viên in hợp đồng và hoàn tất ký thỏa thuận
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenContractModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem toàn văn HĐ</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPrintModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>In Hợp đồng &amp; Phụ lục</span>
                </button>
              </div>
            </div>

            {/* Trích đoạn tóm tắt hợp đồng */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5 font-sans text-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-slate-900 block">
                    HỢP ĐỒNG CHO THUÊ KHO TỰ QUẢN THÔNG MINH
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    Số: SS-HĐ-{appointment.id.replace(/[^a-zA-Z0-9]/g, '')}/2026
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
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
                  <strong className="text-slate-900">{appointment.customerName}</strong> (CCCD:{' '}
                  {appointment.idCard || '079201008899'})
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
                        : 'Khách hàng chưa ký kết hợp đồng'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isContractSigned
                      ? 'Hợp đồng điện tử đã có hiệu lực pháp lý. Tiếp tục bước 4 để thu tiền thuê kho tại quầy.'
                      : 'Vui lòng cho khách xem/in hợp đồng, đọc điều khoản và xác nhận ký tên.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsContractSigned(!isContractSigned)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    isContractSigned
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
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

          {/* BƯỚC 4: Quyết Toán & Thu Tiền Thuê Kho Tại Quầy (ĐẶT SAU BƯỚC IN HỢP ĐỒNG THEO YÊU CẦU) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-600" />
                  4. Quyết Toán &amp; Thu Tiền Thuê Kho Tại Quầy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thực hiện sau khi đã xem/in và ký kết hợp đồng. Khách thanh toán phần tiền thuê còn lại.
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  appointment.rentalStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {appointment.rentalStatus === 'paid' ? 'ĐÃ THU ĐỦ TIỀN THUÊ' : 'CẦN THU TẠI QUẦY'}
              </span>
            </div>

            {/* Chi tiết tài chính thu tiền */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Tiền cọc đã thanh toán (Online):</span>
                <span className="text-sm font-bold text-emerald-700">{formatVND(depositNum)}</span>
                <span className="text-[11px] text-slate-500 block">Đã đối soát qua cổng thanh toán</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                <span className="text-blue-700 block font-semibold">Tiền thuê còn lại cần thu:</span>
                <span className="text-base font-extrabold text-blue-900">{formatVND(remainingAmount)}</span>
                <span className="text-[11px] text-blue-700 block">VietQR SePay (tự động) hoặc Tiền mặt</span>
              </div>
            </div>

            {/* Hộp trạng thái và Nút thu tiền */}
            {appointment.rentalStatus === 'paid' ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      ĐÃ THU ĐỦ TIỀN THUÊ KHO: {formatVND(remainingAmount)}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Giao dịch đã được ghi nhận trên hệ thống tài chính và xuất biên nhận.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white">
                  Đã hoàn tất thanh toán
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-amber-950">
                      Chưa quyết toán tiền thuê: {formatVND(remainingAmount)}
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Mở giao diện VietQR để khách quét mã chuyển khoản tự động hoặc thu tiền mặt tại quầy.
                    </p>
                  </div>
                </div>

                {onOpenRentalPayment && (
                  <button
                    type="button"
                    onClick={onOpenRentalPayment}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shadow-blue-600/20"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Thu Tiền Thuê Kho Ngay (VietQR SePay / Tiền Mặt)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* BƯỚC 5: Cấp Mã PIN Smart Lock & Kích Hoạt Kho */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  5. Cấp Mã PIN Smart Lock &amp; Kích Hoạt Kho
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập mã mở cửa điện tử Smart Lock và kích hoạt ô kho sang trạng thái Đang sử dụng
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Ô #{activeUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Mã PIN Smart Lock (6 số):</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>Sinh mã ngẫu nhiên</span>
                  </button>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => onChangeCustomPin(e.target.value)}
                  placeholder="VD: 891234"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-base tracking-widest text-center rounded-xl py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  Mã thẻ từ RFID (Nếu cấp thẻ vật lý phụ):
                </label>
                <input
                  type="text"
                  value={customRfid}
                  onChange={(e) => onChangeCustomRfid(e.target.value)}
                  placeholder="Quẹt thẻ hoặc nhập mã RFID..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs rounded-xl py-2.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Ghi chú dặn dò khi bàn giao:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => onChangeNotes?.(e.target.value)}
                  placeholder="VD: Đã hướng dẫn khách mở khóa qua ứng dụng di động và mã PIN..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-900 flex items-start gap-2">
              <Key className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Khi nhấn Hoàn Tất Bàn Giao, hệ thống sẽ kích hoạt ô kho #{activeUnit} sang trạng thái <strong>Đang sử dụng (Occupied)</strong> và tự động gửi mã PIN Smart Lock qua SMS và App Mobile cho khách hàng <strong>{appointment.customerName}</strong>.
              </span>
            </div>
          </div>

          {/* Thanh tác vụ chính kết thúc bàn giao */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>
                Nhân viên bàn giao: <strong className="text-slate-900">{staffName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onOpenPrintModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>In tài liệu</span>
              </button>

              <button
                type="button"
                onClick={handleAttemptProceed}
                disabled={isSubmitting || !isContractSigned}
                title={
                  !isContractSigned
                    ? 'Yêu cầu: Khách hàng ký hợp đồng trước khi tiếp tục'
                    : 'Hoàn tất bàn giao, cấp mã PIN Smart Lock và kích hoạt kho'
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
                    <span>Hoàn Tất Bàn Giao &amp; Cấp Mã PIN</span>
                    <CheckCircle2 className="w-4 h-4" />
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

