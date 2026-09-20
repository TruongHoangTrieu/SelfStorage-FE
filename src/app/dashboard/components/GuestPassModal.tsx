'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Key,
  Calendar,
  Clock,
  Copy,
  Check,
  Share2,
  Send,
  Sparkles,
  QrCode
} from 'lucide-react';
import { CustomerUnit, GuestPass } from '../types';

interface GuestPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: CustomerUnit;
  onCreatedPass: (newPass: GuestPass) => void;
}

export default function GuestPassModal({
  isOpen,
  onClose,
  unit,
  onCreatedPass,
}: GuestPassModalProps) {
  const [guestName, setGuestName] = useState('');
  const [purpose, setPurpose] = useState('Chuyển đồ vào kho');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [generatedPin, setGeneratedPin] = useState('742918');
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newPass: GuestPass = {
      id: `gp-${Date.now()}`,
      guestName: guestName.trim(),
      pin: generatedPin,
      validFrom: '20/09/2026 08:00',
      validTo: `2${durationDays}/09/2026 22:00`,
      status: 'active',
      purpose: purpose,
    };

    onCreatedPass(newPass);
    onClose();
  };

  const handleCopy = () => {
    const textToCopy = `Mã truy cập tạm thời ô kho ${unit.unitNumber} tại ${unit.facilityName}: PIN: ${generatedPin}. Hiệu lực: ${durationDays} ngày. Hướng dẫn: Nhập PIN tại bàn phím cửa.`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareZalo = () => {
    setShareSuccess('Đã tạo liên kết chia sẻ Zalo thành công!');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4f39f6]/10 text-[#4f39f6] flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Tạo Mã Cho Khách Tạm Thời (Guest Pass)
              </h3>
              <p className="text-xs text-slate-500">Áp dụng cho: {unit.unitNumber} • {unit.facilityName}</p>
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
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {shareSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
              {shareSuccess}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tên người nhận (Bạn bè, Người chuyển nhà, Đối tác):
            </label>
            <input
              type="text"
              required
              placeholder="ví dụ: Đội chuyển nhà Thành Hưng, Anh Nam, Chị Linh..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Thời hạn hiệu lực:
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
              >
                <option value={1}>24 giờ (1 ngày)</option>
                <option value={3}>3 ngày</option>
                <option value={7}>7 ngày (1 tuần)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mục đích vào kho:
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Generated PIN Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-center">
            <div className="text-xs text-slate-400">Mã PIN Smart Lock ngẫu nhiên dành riêng cho khách:</div>
            <div className="text-3xl font-mono font-extrabold tracking-widest text-[#818cf8]">
              {generatedPin}
            </div>
            <div className="text-[11px] text-slate-400">
              Mã sẽ tự động thu hồi quyền sau khi hết hạn.
            </div>
          </div>

          {/* Nút chia sẻ qua Zalo/Email & Copy */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>

            {/* [ Nút Chia sẻ qua Zalo/Email ] */}
            <button
              type="button"
              onClick={handleShareZalo}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ qua Zalo/Email</span>
            </button>
          </div>

          {/* Footer actions */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25"
            >
              Xác nhận cấp mã
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
