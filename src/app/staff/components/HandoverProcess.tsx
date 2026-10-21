'use client';

import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  RefreshCw,
  FileText,
  Printer,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  QrCode,
  Banknote,
  Check,
  X,
  Upload,
  Copy,
  Eye,
  Building2,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { CheckInAppointment, AvailableUnit } from '../types';
import { handoversApi } from '@/lib/api/handovers';

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
  onCompleteHandover: (photos?: string[]) => void;
  onOpenRentalPayment?: () => void;
}

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
  // Stepper state: 1 -> 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Tính toán tài chính
  const monthlyRentNum = parseCurrency(appointment.monthlyRent);
  const depositNum = parseCurrency(appointment.depositAmount);
  const durationMonths = appointment.durationMonths || 1;
  const discountPercent =
    durationMonths >= 12 ? 15 : durationMonths >= 6 ? 10 : durationMonths >= 3 ? 5 : 0;
  const rawTotal = monthlyRentNum * durationMonths;
  const discountAmount = Math.round(rawTotal * (discountPercent / 100));
  const totalRent = rawTotal - discountAmount;
  const remainingAmount = Math.max(0, totalRent - depositNum);

  // Trạng thái các bước
  const [isCustomerVerified, setIsCustomerVerified] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cash'>('vietqr');
  const [isRentalPaidLocally, setIsRentalPaidLocally] = useState<boolean>(
    appointment.rentalStatus === 'paid'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Danh sách ảnh hiện trạng ô kho
  const [photos, setPhotos] = useState([
    {
      id: 'photo-1',
      title: 'Cửa cuốn & Ổ khóa thông minh',
      url: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'photo-2',
      title: 'Không gian bên trong ô kho',
      url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'photo-3',
      title: 'Hệ thống PCCC & Hành lang',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    },
  ]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Checklist kiểm tra
  const [checklist, setChecklist] = useState({
    lockTested: true,
    lightingChecked: true,
    cleanlinessChecked: true,
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await handoversApi.uploadHandoverPhoto(file);
      setPhotos((prev) => [
        ...prev,
        {
          id: res.public_id || `photo-${Date.now()}`,
          title: `Ảnh hiện trạng (${file.name})`,
          url: res.url,
        },
      ]);
    } catch (err: any) {
      console.warn('Upload Cloudinary failed, using local preview fallback:', err);
      const newUrl = URL.createObjectURL(file);
      setPhotos((prev) => [
        ...prev,
        {
          id: `photo-${Date.now()}`,
          title: `Ảnh chụp tại quầy (${file.name})`,
          url: newUrl,
        },
      ]);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    onChangeCustomPin(randomPin);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const activeUnit = selectedUnitCode || appointment.assignedUnit;

  // Điều hướng tuần tự giữa các bước (chỉ cho phép tiến khi xong bước hiện tại)
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!isCustomerVerified) {
        alert('Vui lòng xác nhận thông tin khách hàng trước khi tiếp tục.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!isRentalPaidLocally && remainingAmount > 0) {
        const confirmProceed = window.confirm(
          `Khách hàng chưa thanh toán số tiền thuê còn lại (${formatVND(remainingAmount)}).\n\nNhấn 'OK' để tiếp tục cấp mã PIN (ghi nợ thu sau), hoặc 'Cancel' để quay lại xác nhận thu tiền.`
        );
        if (!confirmProceed) {
          return;
        }
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBackToQueue();
    }
  };

  const handleAttemptComplete = () => {
    if (!isCustomerVerified) {
      alert('Vui lòng xác nhận thông tin khách hàng!');
      setCurrentStep(1);
      return;
    }
    if (!customPin || customPin.trim().length < 4) {
      alert('Vui lòng thiết lập mã PIN mở kho tối thiểu 4-6 số!');
      return;
    }
    onCompleteHandover(photos.map((p) => p.url));
  };

  // Thông tin thanh toán QR chuẩn
  const paymentContent = `THANH TOAN ${appointment.id}`;
  const qrUrl = `https://img.vietqr.io/image/MB-0900000000-compact2.png?amount=${remainingAmount}&addInfo=${encodeURIComponent(
    paymentContent
  )}&accountName=${encodeURIComponent('SELFSTORAGE VN')}`;

  const steps = [
    { number: 1, label: 'Khách & Ô kho', desc: 'Xác nhận khách & chọn ô' },
    { number: 2, label: 'Hiện trạng kho', desc: 'Kiểm tra ổ khóa & chụp ảnh' },
    { number: 3, label: 'Thu tiền thuê', desc: 'Mã VietQR & Tiền mặt' },
    { number: 4, label: 'Cấp mã PIN', desc: 'Mã mở cửa 24/7 & kích hoạt' },
  ];

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto space-y-5 animate-slide-up-fade">
      {/* ─── Top Bar: Quay lại & Thông tin vắn tắt ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToQueue}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Bàn Giao Kho: {appointment.customerName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                Ô #{activeUnit}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã đơn: <strong className="text-slate-700 font-mono">{appointment.id}</strong> • SĐT: {appointment.phone} • Loại kho: {appointment.unitType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenContractModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Xem Hợp Đồng</span>
          </button>
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">In tài liệu</span>
          </button>
        </div>
      </div>

      {/* ─── Stepper Indicator (4 bước tuần tự, không cho nhảy cóc) ─── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((st) => {
            const isCompleted = currentStep > st.number;
            const isActive = currentStep === st.number;
            const isClickable = st.number <= currentStep;
            return (
              <button
                key={st.number}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) setCurrentStep(st.number);
                }}
                className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm cursor-default'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 font-medium cursor-not-allowed opacity-50'
                }`}
                title={
                  !isClickable
                    ? `Hoàn thành Bước ${currentStep} trước khi chuyển sang Bước ${st.number}`
                    : undefined
                }
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate leading-tight">{st.label}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {st.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── NỘI DUNG TỪNG BƯỚC (CHỈ HIỂN THỊ BƯỚC ĐANG CHỌN) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        {/* ================= BƯỚC 1: XÁC NHẬN KHÁCH HÀNG & Ô KHO ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Bước 1: Xác Nhận Khách Hàng &amp; Chọn Ô Kho
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra thông tin nhận kho của khách hàng và đổi ô kho nếu khách có nhu cầu.
              </p>
            </div>

            {/* Thông tin khách */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Họ và tên khách:</span>
                <span className="font-bold text-slate-900 text-sm">{appointment.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Mã đặt chỗ / Hồ sơ:</span>
                <span className="font-bold text-blue-700 text-sm font-mono">
                  {appointment.reservationCode || appointment.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
                <span className="font-bold text-slate-800 text-sm">{appointment.phone}</span>
              </div>
            </div>

            {/* Checkbox xác nhận thông tin */}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/60 cursor-pointer hover:bg-blue-50 transition">
              <input
                type="checkbox"
                checked={isCustomerVerified}
                onChange={(e) => setIsCustomerVerified(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="text-xs">
                <strong className="text-blue-950 font-bold block">
                  Đã xác thực thông tin khách hàng (Tên &amp; Số điện thoại)
                </strong>
                <span className="text-blue-700">Khách hàng đến nhận kho đúng theo thông tin đăng ký</span>
              </div>
            </label>

            {/* Thông tin ô kho & Đổi ô nếu muốn */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Ô kho được gán hiện tại:</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-extrabold rounded-md border border-emerald-200">
                  Ô #{activeUnit} • {appointment.unitType} ({appointment.unitSize})
                </span>
              </div>

              {availableUnits.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs text-slate-600">Đổi sang ô khác (nếu khách đổi ý):</span>
                  <select
                    value={selectedUnitCode}
                    onChange={(e) => onChangeUnitCode(e.target.value)}
                    className="w-full sm:w-64 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={appointment.assignedUnit}>
                      Giữ nguyên: Ô #{appointment.assignedUnit} (Khuyên dùng)
                    </option>
                    {availableUnits
                      .filter((u) => u.code !== appointment.assignedUnit)
                      .map((u) => (
                        <option key={u.id} value={u.code}>
                          Ô #{u.code} - {u.type} ({String(u.floor).toLowerCase().startsWith('tầng') ? u.floor : `Tầng ${u.floor}`})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= BƯỚC 2: HIỆN TRẠNG Ô KHO ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Bước 2: Biên Bản Hiện Trạng Ô Kho #{activeUnit}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận ô kho đã được vệ sinh sạch sẽ, khóa và hệ thống vận hành tốt.
                </p>
              </div>

              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed border border-blue-200 rounded-lg transition cursor-pointer"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Đang tải lên Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chụp / Thêm ảnh</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadPhoto}
                className="hidden"
              />
            </div>

            {/* Gallery ảnh trực quan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {photos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPhoto(p.url)}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer hover:shadow-md transition"
                >
                  <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  
                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotos((prev) => prev.filter((item) => item.id !== p.id));
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white transition cursor-pointer z-10"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1 text-xs font-bold">
                    <Eye className="w-4 h-4" />
                    <span>Xem rõ</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] font-semibold truncate">
                    {p.title}
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist kiểm tra 3 điểm nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.lockTested}
                  onChange={(e) => setChecklist({ ...checklist, lockTested: e.target.checked })}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Khóa cửa hoạt động tốt</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.lightingChecked}
                  onChange={(e) => setChecklist({ ...checklist, lightingChecked: e.target.checked })}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Đèn chiếu sáng ổn định</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.cleanlinessChecked}
                  onChange={(e) => setChecklist({ ...checklist, cleanlinessChecked: e.target.checked })}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">Kho sạch sẽ, không mùi</span>
              </label>
            </div>

            {/* Ghi chú hiện trạng */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mô tả hiện trạng ghi vào biên bản bàn giao:
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => onChangeCondition?.(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* ================= BƯỚC 3: THU TIỀN THUÊ KHO (CÓ QR TO RÕ NÉT) ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-blue-600" />
                  Bước 3: Quyết Toán Tiền Thuê Kho
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đưa mã VietQR cho khách quét chuyển khoản hoặc thu tiền mặt trực tiếp tại quầy.
                </p>
              </div>

              {isRentalPaidLocally ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Đã thu tiền
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  Chưa thu tiền
                </span>
              )}
            </div>

            {/* Bảng số tiền cần thu */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Tổng tiền thuê ({durationMonths}T):</span>
                <span className="font-bold text-slate-800 text-sm sm:text-base">{formatVND(totalRent)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block mb-0.5">Đã nộp cọc:</span>
                <span className="font-bold text-emerald-800 text-sm sm:text-base">
                  {appointment.depositAmount || formatVND(depositNum)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300">
                <span className="text-amber-800 font-bold block mb-0.5">TIỀN THUÊ CẦN THU:</span>
                <span className="font-black text-amber-950 text-base sm:text-lg tabular-nums">
                  {formatVND(remainingAmount)}
                </span>
              </div>
            </div>

            {/* Lựa chọn phương thức thu */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('vietqr')}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'vietqr'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Chuyển khoản VietQR SePay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Tiền mặt tại quầy</span>
              </button>
            </div>

            {/* KHUNG HIỂN THỊ MÃ VIETQR TRỰC TIẾP */}
            {paymentMethod === 'vietqr' && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                {/* Ảnh QR Code */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 text-center">
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    className="w-52 h-52 object-contain mx-auto rounded-lg"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `THANH TOAN ${appointment.id} - ${formatVND(remainingAmount)}`
                      )}`;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <span className="text-[10px] text-slate-400 block mt-2 font-medium">
                    Quét bằng mọi ứng dụng Ngân hàng
                  </span>
                </div>

                {/* Thông tin chuyển khoản */}
                <div className="space-y-3 text-xs flex-1 w-full">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Ngân hàng thụ hưởng:</span>
                      <strong className="text-slate-800 font-bold">MBBank (Quân Đội)</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Số tài khoản:</span>
                      <strong className="text-blue-900 font-mono text-sm font-black">0900000000</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('0900000000', 'STK')}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                    >
                      {copiedField === 'STK' ? 'Đã chép!' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Chủ tài khoản:</span>
                      <strong className="text-slate-800 font-bold">SELFSTORAGE VN</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-amber-800 text-[10px] font-bold block">Nội dung chuyển khoản:</span>
                      <strong className="text-amber-950 font-mono text-xs font-black">{paymentContent}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentContent, 'Nội dung')}
                      className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition cursor-pointer"
                    >
                      {copiedField === 'Nội dung' ? 'Đã chép!' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB TIỀN MẶT */}
            {paymentMethod === 'cash' && (
              <div className="p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Banknote className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-base">Thu Tiền Mặt Trực Tiếp Tại Quầy</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Số tiền cần nhận từ khách hàng {appointment.customerName}:
                  </p>
                  <div className="text-3xl font-black text-emerald-900 mt-2">
                    {formatVND(remainingAmount)}
                  </div>
                </div>
              </div>
            )}

            {/* Nút xác nhận đã thu tiền */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsRentalPaidLocally(!isRentalPaidLocally)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  isRentalPaidLocally
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                }`}
              >
                {isRentalPaidLocally ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Đã Thu Đủ {formatVND(remainingAmount)} (Nhấn nếu muốn đổi lại)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Đã Thu Đủ {formatVND(remainingAmount)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= BƯỚC 4: CẤP MÃ PIN & KÍCH HOẠT KHO ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Bước 4: Cấp Mã PIN Smart Lock &amp; Hoàn Tất Bàn Giao
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập mã PIN mở cửa Smart Lock và kích hoạt ô kho #{activeUnit} cho khách hàng.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                Ô #{activeUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Nhập mã PIN */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Mã PIN Smart Lock (6 số):</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>Sinh mã ngẫu nhiên</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => onChangeCustomPin(e.target.value)}
                  placeholder="VD: 891234"
                  className="w-full bg-white border border-slate-300 text-slate-900 font-mono font-black text-2xl tracking-widest text-center rounded-xl py-3.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 block text-center">
                  Mã này dùng để mở khóa điện tử 24/7 và đồng bộ vào App khách hàng
                </span>
              </div>

              {/* Mã RFID phụ */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-800 block">
                  Mã thẻ từ RFID phụ (Nếu cấp thẻ vật lý):
                </label>
                <input
                  type="text"
                  value={customRfid}
                  onChange={(e) => onChangeCustomRfid(e.target.value)}
                  placeholder="Quẹt thẻ hoặc nhập mã RFID..."
                  className="w-full bg-white border border-slate-300 text-slate-900 font-mono text-sm rounded-xl py-3.5 px-3 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 block">
                  Không bắt buộc nếu khách chỉ sử dụng mã PIN bàn phím số
                </span>
              </div>

              {/* Ghi chú dặn dò */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Ghi chú dặn dò khi bàn giao:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => onChangeNotes?.(e.target.value)}
                  placeholder="VD: Đã hướng dẫn khách mở khóa qua mã PIN và ứng dụng Mobile..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Tóm tắt tình trạng trước khi bấm hoàn tất */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Check className="w-4 h-4" /> Khách hàng đã xác nhận
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Check className="w-4 h-4" /> Hiện trạng đã kiểm tra
                </div>
                <div
                  className={`flex items-center gap-1.5 font-bold ${
                    isRentalPaidLocally ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isRentalPaidLocally ? <Check className="w-4 h-4" /> : '•'}
                  {isRentalPaidLocally ? 'Đã thu tiền thuê' : 'Thu tiền thuê sau'}
                </div>
              </div>
              <div className="text-slate-500">
                Nhân viên bàn giao: <strong>{staffName}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Footer Action Bar: Điều Hướng Các Bước ─── */}
      <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={handlePrevStep}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep === 1 ? 'Quay lại hàng đợi' : 'Bước trước'}</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          Bước {currentStep} / {steps.length}
        </span>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <span>Tiếp tục bước tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAttemptComplete}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold text-white rounded-xl transition shadow-md active:scale-95 cursor-pointer ${
              isSubmitting
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
                <span>Hoàn Tất Bàn Giao &amp; Kích Hoạt Kho</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* ─── Lightbox Xem Ảnh Phóng To ─── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedPhoto} alt="Xem chi tiết" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
