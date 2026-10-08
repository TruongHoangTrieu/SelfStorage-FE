'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CustomerUnit } from '../types';

interface ExtendLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: CustomerUnit;
  onConfirmExtend: (months: number, newTotal: string, paymentMethod: string, rawAmount: number) => Promise<void> | void;
}

export default function ExtendLeaseModal({
  isOpen,
  onClose,
  unit,
  onConfirmExtend,
}: ExtendLeaseModalProps) {
  const [selectedMonths, setSelectedMonths] = useState<number>(6);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'card' | 'bank'>('vnpay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Tính chiết khấu theo số tháng
  const discountRate = selectedMonths === 12 ? 0.15 : selectedMonths === 6 ? 0.10 : selectedMonths === 3 ? 0.05 : 0;
  const baseTotal = unit.monthlyRentNum * selectedMonths;
  const discountAmount = baseTotal * discountRate;
  const finalTotal = baseTotal - discountAmount;

  const formattedFinalTotal = `${new Intl.NumberFormat('vi-VN').format(finalTotal)} đ`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmExtend(selectedMonths, formattedFinalTotal, paymentMethod, finalTotal);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Gia Hạn Hợp Đồng Thuê Kho
              </h3>
              <p className="text-xs text-slate-500">Ô {unit.unitNumber} • Hết hạn hiện tại: {unit.contractEndDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Chọn thời gian kéo dài thời hạn thuê:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { months: 1, label: '1 Tháng', discount: 'Chuẩn' },
                { months: 3, label: '3 Tháng', discount: '-5%' },
                { months: 6, label: '6 Tháng', discount: '-10%' },
                { months: 12, label: '12 Tháng', discount: '-15%' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.months}
                  onClick={() => setSelectedMonths(opt.months)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedMonths === opt.months
                      ? 'border-orange-500 bg-orange-50/70 text-orange-700 font-extrabold shadow-2xs ring-2 ring-orange-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="text-sm">{opt.label}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{opt.discount}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá niêm yết:</span>
              <span>{unit.monthlyRent}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thời gian gia hạn thêm:</span>
              <span className="font-semibold text-slate-900">+{selectedMonths} tháng</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Ưu đãi cam kết lâu dài:</span>
                <span>-{new Intl.NumberFormat('vi-VN').format(discountAmount)} đ ({discountRate * 100}%)</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Tổng thanh toán gia hạn:</span>
              <span className="text-base font-black text-orange-600">{formattedFinalTotal}</span>
            </div>
          </div>

          {/* Cổng thanh toán trực tuyến */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Phương thức thanh toán (Tích hợp Luồng 4):
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                paymentMethod === 'vnpay' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold ring-1 ring-orange-500/30' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'vnpay'}
                  onChange={() => setPaymentMethod('vnpay')}
                  className="sr-only"
                />
                VietQR / SePay
              </label>

              <label className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold ring-1 ring-orange-500/30' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="sr-only"
                />
                Thẻ Visa / Master
              </label>

              <label className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                paymentMethod === 'bank' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold ring-1 ring-orange-500/30' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'bank'}
                  onChange={() => setPaymentMethod('bank')}
                  className="sr-only"
                />
                Ví MoMo / PayOS
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý thanh toán...</span>
                </>
              ) : (
                <span>Xác nhận thanh toán gia hạn</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
