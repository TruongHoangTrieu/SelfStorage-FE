'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  Send,
  Inbox,
  Lock,
  Key,
  QrCode,
  Banknote,
  AlertCircle,
  Check,
  X,
  FileCheck2,
  Sparkles
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
  const finalPin = customPin || appointment.accessPin || '825884';
  const finalRfid = customRfid || appointment.rfidCard || 'RFID-5119';

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

  // Trạng thái thu tiền còn lại: Nếu tiền còn lại <= 0 thì tự động là true
  const [isRemainingPaid, setIsRemainingPaid] = useState<boolean>(remainingAmount <= 0);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cash'>('vietqr');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  return (
    <div className="max-w-4xl mx-auto py-6 animate-slide-up-fade space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
        {/* Biểu tượng & Tiêu đề Hợp đồng đã ký */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>HỢP ĐỒNG ĐÃ ĐƯỢC KÝ SỐ THÀNH CÔNG</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quyết Toán Tiền Thuê & Bàn Giao Mã Khóa
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
            Hợp đồng cho khách hàng <strong>{appointment.customerName}</strong> đã được xác lập pháp lý. Vui lòng quyết toán tiền còn lại để kích hoạt mã khóa kho.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BƯỚC 1: THU TIỀN THUÊ CÒN LẠI TẠI QUẦY */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                1. Quyết Toán Tiền Thuê Còn Lại Tại Quầy
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Căn cứ hợp đồng vừa ký, thu khoản tiền thuê còn lại sau khi khấu trừ tiền cọc
              </p>
            </div>

            {isRemainingPaid ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ĐÃ THU ĐỦ TIỀN
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                CẦN THU TIỀN TẠI QUẦY
              </span>
            )}
          </div>

          {/* Chi tiết tài chính */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-0.5">Tổng tiền thuê ({durationMonths} tháng):</span>
              <span className="text-sm font-bold text-slate-900">{formatVND(totalRent)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
              <span className="text-[11px] text-emerald-700 block mb-0.5">Đã nộp cọc trực tuyến:</span>
              <span className="text-sm font-bold text-emerald-800">{formatVND(depositNum)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 shadow-2xs">
              <span className="text-[11px] text-amber-800 font-semibold block mb-0.5">
                CÒN LẠI PHẢI THU:
              </span>
              <span className="text-base font-extrabold text-amber-900">
                {formatVND(remainingAmount)}
              </span>
            </div>
          </div>

          {remainingAmount > 0 && (
            <div className="space-y-4 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Chọn phương thức thu tiền tại quầy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'vietqr'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/20 font-bold'
                      : 'border-slate-200 hover:bg-white text-slate-700 text-xs font-medium'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-xs">Chuyển khoản VietQR</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/20 font-bold'
                      : 'border-slate-200 hover:bg-white text-slate-700 text-xs font-medium'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <div className="text-xs">Tiền mặt tại quầy</div>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                {paymentMethod === 'vietqr' && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Mở mã VietQR cho khách quét</span>
                  </button>
                )}

                <div className="ml-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsRemainingPaid(!isRemainingPaid)}
                    className={`w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isRemainingPaid
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                    }`}
                  >
                    {isRemainingPaid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Thu Đủ {formatVND(remainingAmount)} (Nhấn để chỉnh sửa)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Xác Nhận Đã Thu {formatVND(remainingAmount)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BƯỚC 2: CẤP QUYỀN TRUY CẬP & MÃ PIN (CHỈ HIỆN KHI ĐÃ THU TIỀN) */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              2. Quyền Truy Cập & Mã PIN Smart Lock
            </h3>
            {isRemainingPaid ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                MÃ KHÓA ĐÃ KÍCH HOẠT
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                TẠM KHÓA BẢO MẬT
              </span>
            )}
          </div>

          {!isRemainingPaid ? (
            /* TRƯỜNG HỢP CHƯA THU TIỀN: BẢO VỆ MÃ KHÓA */
            <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Mã PIN Đang Tạm Khóa An Ninh
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vì lý do an ninh, Mã PIN Smart Lock và Thẻ từ RFID chỉ xuất hiện sau khi bạn nhấn <strong>&quot;Xác Nhận Đã Thu Tiền&quot;</strong> ở Bước 1.
              </p>
            </div>
          ) : (
            /* TRƯỜNG HỢP ĐÃ THU TIỀN: XUẤT HIỆN MÃ PIN RỰC RỠ */
            <div className="space-y-4 animate-scale-in">
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div>
                  <div className="text-xs text-slate-400">Mã PIN Smart Lock (Mở cửa kho & thang máy):</div>
                  <div className="text-3xl tabular-nums font-black tracking-widest text-emerald-400 mt-1">
                    {finalPin}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Mã Thẻ Từ RFID / Tag:</div>
                  <div className="text-base tabular-nums font-bold text-white mt-1">
                    {finalRfid}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    ✓ Đã đồng bộ an ninh cơ sở
                  </div>
                </div>
              </div>

              {/* Thông tin cập nhật ô kho & trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block mb-1">Trạng thái Ô kho:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-bold text-sm text-slate-900">
                      Ô #{finalUnit}: ĐANG THUÊ (Occupied)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block mb-1">Trạng thái Bàn giao:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm text-slate-900">
                      HOÀN TẤT BÀN GIAO (Completed)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Các nút hành động tiếp theo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In Phiếu bàn giao cho khách</span>
          </button>

          <button
            type="button"
            onClick={onSendNotification}
            disabled={!isRemainingPaid}
            title={!isRemainingPaid ? 'Cần thu tiền trước khi gửi mã cho khách' : 'Gửi mã kho'}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              !isRemainingPaid
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-slate-600" />
            <span>Gửi SMS / Zalo mã kho</span>
          </button>

          <button
            type="button"
            onClick={onBackToQueue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Inbox className="w-4 h-4" />
            <span>Quay lại Hàng đợi nhận kho</span>
          </button>
        </div>
      </div>

      {/* MODAL MÃ VIETQR ĐỂ KHÁCH QUÉT TẠI QUẦY */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-in text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                Mã VietQR Thanh Toán Tại Quầy
              </h4>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
              <img
                src={`https://img.vietqr.io/image/MB-0900000000-compact2.png?amount=${remainingAmount}&addInfo=THANH TOAN ${appointment.id}&accountName=SELFSTORAGE VN`}
                alt="VietQR Code"
                className="w-56 h-auto rounded-xl shadow-xs border border-slate-200"
              />
              <div className="mt-3 text-xs space-y-0.5">
                <div className="font-extrabold text-blue-900 text-base">
                  {formatVND(remainingAmount)}
                </div>
                <div className="text-slate-500">Nội dung: THANH TOAN {appointment.id}</div>
                <div className="text-slate-400 text-[10px]">
                  Ngân hàng Quân Đội (MB) • 0900000000
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRemainingPaid(true);
                  setShowQrModal(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Xác nhận đã nhận tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

