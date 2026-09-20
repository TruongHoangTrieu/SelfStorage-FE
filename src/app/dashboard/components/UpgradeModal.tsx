'use client';

import React, { useState } from 'react';
import {
  Sliders,
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
import { CustomerUnit } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: CustomerUnit;
  onConfirmRequest: (targetType: string, note: string) => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  unit,
  onConfirmRequest,
}: UpgradeModalProps) {
  const [targetType, setTargetType] = useState('Kho Doanh nghiệp Lớn (12m² - 15m²)');
  const [reason, setReason] = useState('Nhu cầu lưu thêm đồ đạc kinh doanh và hàng hóa nhập khẩu');
  const [preferredDate, setPreferredDate] = useState('25/09/2026');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmRequest(targetType, `${reason} (Dự kiến chuyển: ${preferredDate})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4f39f6]/10 text-[#4f39f6] flex items-center justify-center font-bold">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Yêu Cầu Nâng Cấp / Hạ Cấp Ô Kho
              </h3>
              <p className="text-xs text-slate-500">Ô hiện tại: {unit.unitNumber} ({unit.size})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Chọn loại diện tích ô kho muốn chuyển sang:
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
            >
              <optgroup label="Nâng cấp diện tích lớn hơn">
                <option value="Kho Doanh nghiệp Lớn (12m² - 15m²)">
                  Kho Doanh nghiệp Lớn (12m² - 15m²) - Cửa cuốn tự động
                </option>
                <option value="Kho Gia đình Tiêu chuẩn (6m²)">
                  Kho Gia đình Tiêu chuẩn (6m²) - Rộng rãi
                </option>
              </optgroup>
              <optgroup label="Hạ cấp diện tích nhỏ hơn">
                <option value="Kho Mini Cá nhân (3m²)">
                  Kho Mini Cá nhân (3m²) - Tiết kiệm chi phí
                </option>
                <option value="Tủ Locker Lưu trữ Đồ dùng (1m²)">
                  Tủ Locker Cá nhân (1m²)
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ngày mong muốn dọn đồ sang kho mới:
            </label>
            <input
              type="text"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Lý do hoặc yêu cầu vị trí đặc biệt (tầng trệt, gần cửa xuất nhập...):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
            <div className="font-bold">Quy trình điều chuyển kho:</div>
            <p className="text-[11px] text-slate-600">
              Quản lý cơ sở sẽ kiểm tra ô kho khả dụng và liên hệ với bạn trong vòng 2 giờ làm việc để sắp xếp bàn giao và hỗ trợ xe đẩy chuyển đồ.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25 transition-all"
            >
              Gửi yêu cầu điều chuyển
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
