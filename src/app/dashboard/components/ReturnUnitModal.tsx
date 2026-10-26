'use client';

import React, { useState, useId } from 'react';
import {
  DoorClosed,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Upload,
  Lock,
  Info,
  Check,
  Sparkles,
  FileCheck,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { CustomerUnit, CheckoutRequest } from '../types';

interface ReturnUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: CustomerUnit;
  onConfirmCheckout: (payload: {
    contractId: string | number;
    contractCode?: string;
    unitId?: string | number;
    unitNumber: string;
    requestedMoveOutDate: string;
    reason: string;
    feedbackNotes?: string;
    unitClearanceConfirmed: boolean;
    lockIntactConfirmed: boolean;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
    depositAmount: number;
    estimatedRefund: number;
    photos?: string[];
  }) => Promise<void> | void;
  onCancelCheckout?: (unit: CustomerUnit) => Promise<void> | void;
}

const COMMON_BANKS = [
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { code: 'MB', name: 'MB Bank (Quân Đội)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)' },
  { code: 'CTG', name: 'VietinBank (Công Thương Việt Nam)' },
  { code: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)' },
  { code: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { code: 'HDB', name: 'HDBank (Phát Triển TP.HCM)' },
  { code: 'VIB', name: 'VIB (Quốc Tế)' },
];

const REASON_OPTIONS = [
  'Đã hoàn thành nhu cầu lưu trữ (dự án/chuyển đồ xong)',
  'Chuyển địa điểm sinh sống hoặc dời văn phòng công ty',
  'Cần thuê diện tích kho khác (lớn hơn hoặc nhỏ hơn)',
  'Tối ưu hóa kế hoạch chi phí cá nhân / doanh nghiệp',
  'Lý do khác',
];

export default function ReturnUnitModal({
  isOpen,
  onClose,
  unit,
  onConfirmCheckout,
  onCancelCheckout,
}: ReturnUnitModalProps) {
  const isAlreadyPending = unit.status === 'checkout_pending' || Boolean(unit.checkoutRequest);
  const existingReq = unit.checkoutRequest;

  // Step state: 1 (Lên lịch & Lý do), 2 (Checklist dọn dẹp), 3 (Hoàn cọc & Ngân hàng), 4 (Ký số & Gửi)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [moveOutDate, setMoveOutDate] = useState<string>(existingReq?.requestedMoveOutDate || todayStr);
  const [selectedReason, setSelectedReason] = useState<string>(existingReq?.reason || REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>(existingReq?.feedbackNotes || '');

  // Step 2: Clearance Checklist
  const [itemsCleared, setItemsCleared] = useState<boolean>(existingReq?.unitClearanceConfirmed ?? false);
  const [lockIntact, setLockIntact] = useState<boolean>(existingReq?.lockIntactConfirmed ?? false);
  const [readyForInspection, setReadyForInspection] = useState<boolean>(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingReq?.photos?.[0] || null);

  // Step 3: Financial & Bank
  const depositNum = unit.depositAmount || unit.monthlyRentNum || 1800000;
  const estimatedRefund = depositNum; // Full deposit returned if conditions met
  const [bankName, setBankName] = useState<string>(existingReq?.bankInfo?.bankName || COMMON_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState<string>(existingReq?.bankInfo?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState<string>(existingReq?.bankInfo?.accountHolder || '');

  // Step 4: Digital sign PIN
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unique IDs for accessibility
  const moveOutDateId = useId();
  const customReasonId = useId();
  const feedbackId = useId();
  const bankNameId = useId();
  const accountNumberId = useId();
  const accountHolderId = useId();
  const confirmPinId = useId();

  if (!isOpen) return null;

  // Step validation
  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!moveOutDate) {
        setErrorMsg('Vui lòng chọn ngày dự kiến trả kho');
        return false;
      }
      if (selectedReason === 'Lý do khác' && !customReason.trim()) {
        setErrorMsg('Vui lòng nhập lý do cụ thể');
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!itemsCleared) {
        setErrorMsg('Vui lòng xác nhận bạn đã lấy hết tài sản ra khỏi ô kho');
        return false;
      }
      if (!lockIntact) {
        setErrorMsg('Vui lòng xác nhận cửa kho và khóa điện tử không bị hư hại');
        return false;
      }
      if (!readyForInspection) {
        setErrorMsg('Vui lòng đồng ý để nhân viên tiến hành nghiệm thu');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (!bankName) {
        setErrorMsg('Vui lòng chọn ngân hàng thụ hưởng');
        return false;
      }
      if (!accountNumber.trim() || accountNumber.length < 6) {
        setErrorMsg('Vui lòng nhập số tài khoản ngân hàng hợp lệ');
        return false;
      }
      if (!accountHolder.trim()) {
        setErrorMsg('Vui lòng nhập tên chủ tài khoản (in hoa không dấu)');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMsg('Vui lòng đánh dấu đồng ý với biên bản thanh lý và thu hồi mã Smart Lock');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const finalReason = selectedReason === 'Lý do khác' ? customReason.trim() : selectedReason;
      await onConfirmCheckout({
        contractId: unit.rawContractId || unit.contractId,
        contractCode: unit.contractId,
        unitId: unit.rawUnitId || unit.id,
        unitNumber: unit.unitNumber,
        requestedMoveOutDate: moveOutDate,
        reason: finalReason,
        feedbackNotes: feedback.trim() || undefined,
        unitClearanceConfirmed: itemsCleared,
        lockIntactConfirmed: lockIntact,
        bankInfo: {
          bankName,
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim().toUpperCase(),
        },
        depositAmount: depositNum,
        estimatedRefund,
        photos: photoPreview ? [photoPreview] : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi gửi yêu cầu trả kho. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    if (!onCancelCheckout) return;
    setIsCancelling(true);
    try {
      await onCancelCheckout(unit);
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMockUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setPhotoPreview(fakeUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-slide-up-fade">
        {/* ================= MODAL HEADER ================= */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-rose-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center font-bold shadow-2xs">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Thủ Tục Trả Kho &amp; Thanh Lý Hợp Đồng
                </h3>
                {isAlreadyPending && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Đang xử lý
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {unit.unitNumber} • {unit.facilityName} • Mã HĐ: {unit.contractId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ================= IF ALREADY PENDING: VIEW DETAILS OR CANCEL ================= */}
        {isAlreadyPending ? (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Yêu cầu trả kho của bạn đang được tiếp nhận</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Hệ thống và nhân viên cơ sở đã nhận thông tin. Vui lòng dọn dẹp sạch sẽ đồ đạc trước ngày hẹn nghiệm thu kho.
              </p>
            </div>

            {/* Timeline Tiến độ */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tiến độ thanh lý &amp; hoàn tiền cọc
              </h4>
              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 ml-2">
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div className="text-xs font-bold text-slate-800">1. Gửi yêu cầu trả kho</div>
                  <div className="text-[11px] text-slate-500">Đã gửi thành công • Chờ nghiệm thu thực tế</div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 animate-pulse" />
                  <div className="text-xs font-bold text-amber-800">2. Nghiệm thu hiện trạng kho trống</div>
                  <div className="text-[11px] text-slate-500">
                    Dự kiến vào ngày: <strong className="text-slate-800">{existingReq?.requestedMoveOutDate || 'Hôm nay'}</strong>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-300" />
                  <div className="text-xs font-bold text-slate-500">3. Quyết toán tài chính &amp; Hoàn trả tiền cọc</div>
                  <div className="text-[11px] text-slate-400">
                    Chuyển khoản vào STK: {existingReq?.bankInfo?.accountNumber || 'Đang cập nhật'} ({existingReq?.bankInfo?.bankName || 'Ngân hàng'})
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-300" />
                  <div className="text-xs font-bold text-slate-500">4. Hoàn tất thanh lý &amp; Khóa mã truy cập</div>
                  <div className="text-[11px] text-slate-400">Hợp đồng kết thúc hoàn tất</div>
                </div>
              </div>
            </div>

            {/* Thông tin hoàn trả đã đăng ký */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Ngày hẹn dọn kho:</span>
                <span className="font-bold text-slate-800">{existingReq?.requestedMoveOutDate || 'Đang cập nhật'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tiền cọc ước tính hoàn trả:</span>
                <span className="font-extrabold text-emerald-600">
                  {new Intl.NumberFormat('vi-VN').format(existingReq?.estimatedRefund || depositNum)} đ
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tài khoản nhận tiền:</span>
                <span className="font-semibold text-slate-800">
                  {existingReq?.bankInfo?.accountHolder || 'CHỦ TÀI KHOẢN'} - {existingReq?.bankInfo?.accountNumber} ({existingReq?.bankInfo?.bankName})
                </span>
              </div>
            </div>

            {/* Footer Buttons for Pending */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCancelPending}
                disabled={isCancelling}
                className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isCancelling ? 'Đang hủy...' : 'Hủy Yêu Cầu Trả Kho'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          /* ================= STEP-BY-STEP CHECKOUT FORM ================= */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Step Stepper Header */}
            <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs font-semibold shrink-0">
              {[
                { s: 1, label: 'Lên lịch & Lý do' },
                { s: 2, label: 'Kiểm tra kho' },
                { s: 3, label: 'Hoàn cọc' },
                { s: 4, label: 'Xác nhận' },
              ].map(({ s, label }) => {
                const isActive = step === s;
                const isCompleted = step > s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      if (isCompleted) setStep(s);
                    }}
                    disabled={!isCompleted && step !== s}
                    className={`flex items-center gap-1.5 cursor-pointer transition ${
                      isActive
                        ? 'text-rose-600 font-bold'
                        : isCompleted
                        ? 'text-emerald-600 hover:text-emerald-700 font-medium'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isActive
                          ? 'bg-rose-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : s}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Body Steps */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* ================= STEP 1: LÊN LỊCH & LÝ DO ================= */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  {(unit.hasPendingRenewal || unit.statusLabel?.includes('gia hạn')) && (
                    <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        <strong>Lưu ý chuyển đổi thủ tục:</strong> Ngăn kho này hiện đang có yêu cầu gia hạn chờ duyệt. Khi bạn gửi yêu cầu trả kho, hệ thống sẽ tự động chuyển đổi sang thủ tục nghiệm thu trả kho và hủy bỏ yêu cầu gia hạn trước đó.
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 leading-relaxed">
                      Quý khách vui lòng chọn ngày dự kiến bàn giao mặt bằng kho trống. Hợp đồng thuê sẽ được tính đến ngày hoàn tất nghiệm thu thực tế.
                    </div>
                  </div>

                  <div>
                    <label htmlFor={moveOutDateId} className="text-xs font-bold text-slate-800 block mb-1.5">
                      Ngày dự kiến trả kho &amp; dọn sạch đồ đạc:
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id={moveOutDateId}
                        min={todayStr}
                        value={moveOutDate}
                        onChange={(e) => setMoveOutDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-xs font-semibold text-slate-900 bg-white"
                        required
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setMoveOutDate(todayStr)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 3);
                          setMoveOutDate(d.toISOString().split('T')[0]);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Sau 3 ngày
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-1.5">
                      Lý do trả kho:
                    </span>
                    <div className="space-y-2">
                      {REASON_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                            selectedReason === opt
                              ? 'border-rose-500 bg-rose-50/60 text-rose-950 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="return_reason"
                            checked={selectedReason === opt}
                            onChange={() => setSelectedReason(opt)}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>

                    {selectedReason === 'Lý do khác' && (
                      <div className="mt-3">
                        <textarea
                          id={customReasonId}
                          rows={2}
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Vui lòng cho biết lý do cụ thể..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 text-xs text-slate-900 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor={feedbackId} className="text-xs font-bold text-slate-800 block mb-1.5">
                      Góp ý / Đánh giá dịch vụ (Không bắt buộc):
                    </label>
                    <textarea
                      id={feedbackId}
                      rows={2}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ tốt hơn..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* ================= STEP 2: CHECKLIST DỌN DẸP & KIỂM TRA ================= */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Quy chuẩn bàn giao kho tự quản
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Để nhận lại đầy đủ 100% tiền đặt cọc mà không bị phát sinh phụ phí vệ sinh, vui lòng đảm bảo hoàn tất các tiêu chí dưới đây:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                        itemsCleared
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={itemsCleared}
                        onChange={(e) => setItemsCleared(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <div>
                        <div>Tôi đã lấy toàn bộ hàng hóa &amp; tài sản ra khỏi kho</div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Kho trống hoàn toàn, không bỏ lại bất kỳ thùng hàng hoặc rác thải nào.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                        lockIntact
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={lockIntact}
                        onChange={(e) => setLockIntact(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <div>
                        <div>Khóa thông minh Smart Lock &amp; Cửa kho hoạt động nguyên vẹn</div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Không có dấu hiệu cạy phá, trầy xước nặng hoặc hư hại chốt an toàn.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                        readyForInspection
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={readyForInspection}
                        onChange={(e) => setReadyForInspection(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <div>
                        <div>Sẵn sàng để nhân viên kỹ thuật kiểm tra nghiệm thu</div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Nhân viên sẽ đối chiếu hiện trạng và phê duyệt hoàn cọc tự động.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Upload ảnh minh chứng hiện trạng kho trống (Tùy chọn) */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-800 block mb-1">
                      Ảnh chụp kho trống trước khi rời đi (Khuyến khích):
                    </span>
                    <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/30">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">
                        {photoPreview ? 'Đã tải lên 1 ảnh hiện trạng (Bấm để đổi)' : 'Tải lên ảnh hoặc chụp ảnh kho'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG (tối đa 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMockUploadPhoto}
                        className="hidden"
                      />
                    </label>

                    {photoPreview && (
                      <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                        <img
                          src={photoPreview}
                          alt="Kho trống preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoPreview(null)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white text-[10px] flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= STEP 3: QUYẾT TOÁN TÀI CHÍNH & HOÀN CỌC ================= */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Bảng Quyết toán cọc */}
                  <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 rounded-2xl p-4 border border-emerald-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">Quyết toán tiền cọc thuê kho</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Hoàn trả 100%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Tiền đặt cọc ban đầu:</span>
                        <span className="font-bold text-slate-900">
                          {new Intl.NumberFormat('vi-VN').format(depositNum)} đ
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Phụ phí phát sinh / hư hỏng dự kiến:</span>
                        <span className="font-semibold text-emerald-600">0 đ</span>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex justify-between items-center text-sm font-black">
                        <span className="text-emerald-950">Số tiền cọc hoàn trả dự kiến:</span>
                        <span className="text-emerald-600 text-base">
                          {new Intl.NumberFormat('vi-VN').format(estimatedRefund)} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form thông tin ngân hàng nhận hoàn cọc */}
                  <div className="space-y-3 bg-white rounded-2xl p-4 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      Tài khoản ngân hàng nhận tiền hoàn cọc
                    </h4>

                    <div>
                      <label htmlFor={bankNameId} className="text-[11px] font-bold text-slate-700 block mb-1">
                        Ngân hàng thụ hưởng:
                      </label>
                      <select
                        id={bankNameId}
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:border-blue-500"
                        required
                      >
                        {COMMON_BANKS.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={accountNumberId} className="text-[11px] font-bold text-slate-700 block mb-1">
                        Số tài khoản ngân hàng:
                      </label>
                      <input
                        type="text"
                        id={accountNumberId}
                        placeholder="Ví dụ: 19036829140019"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor={accountHolderId} className="text-[11px] font-bold text-slate-700 block mb-1">
                        Tên chủ tài khoản (In hoa không dấu):
                      </label>
                      <input
                        type="text"
                        id={accountHolderId}
                        placeholder="Ví dụ: NGUYEN VAN A"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white uppercase focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: KÝ SỐ & GỬI YÊU CẦU ================= */}
              {step === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      Tóm tắt biên bản thanh lý &amp; bàn giao kho
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Ô kho:</span>
                        <span className="font-bold text-slate-800">{unit.unitNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Ngày dự kiến trả:</span>
                        <span className="font-bold text-rose-600">{moveOutDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Số tiền hoàn cọc:</span>
                        <span className="font-extrabold text-emerald-600">
                          {new Intl.NumberFormat('vi-VN').format(estimatedRefund)} đ
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tài khoản nhận:</span>
                        <span className="font-bold text-slate-800">{accountNumber} ({bankName.split(' ')[0]})</span>
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo thu hồi mã khóa Smart Lock */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed text-[11px]">
                      <strong>Lưu ý quan trọng:</strong> Sau khi nhân viên cơ sở nghiệm thu ô kho thành công, mã PIN Smart Lock và quyền truy cập từ xa sẽ chính thức được thu hồi để bàn giao cho khách thuê tiếp theo.
                    </div>
                  </div>

                  {/* Xác thực PIN cá nhân (tùy chọn bảo mật) */}
                  <div>
                    <label htmlFor={confirmPinId} className="text-xs font-bold text-slate-800 block mb-1">
                      Mã PIN xác thực hợp đồng (Mã khóa hiện tại):
                    </label>
                    <input
                      type="password"
                      id={confirmPinId}
                      maxLength={8}
                      placeholder="Nhập mã PIN cá nhân để ký điện tử"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:border-rose-500"
                    />
                  </div>

                  {/* Checkbox đồng ý */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      required
                    />
                    <span className="text-[11px] text-slate-700 leading-relaxed">
                      Tôi xác nhận các thông tin trên là chính xác và đồng ý chấm dứt hợp đồng thuê kho tự quản theo đúng quy định hoàn cọc của SelfStorage.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-98"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms}
                  className="px-6 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-xl transition cursor-pointer shadow-md shadow-rose-600/30 flex items-center gap-2 active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang gửi hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <DoorClosed className="w-4 h-4" />
                      <span>Xác Nhận &amp; Gửi Yêu Cầu Trả Kho</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
