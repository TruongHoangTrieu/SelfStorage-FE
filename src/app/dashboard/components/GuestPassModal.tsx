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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Tạo Mã Cho Khách Tạm Thời (Guest Pass)
              </h3>
              <p className="text-xs text-slate-500">Áp dụng cho: {unit.unitNumber} • {unit.facilityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {shareSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold">
              {shareSuccess}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Tên người nhận (Bạn bè, Người chuyển nhà, Đối tác):
            </label>
            <input
              type="text"
              required
              placeholder="ví dụ: Đội chuyển nhà Thành Hưng, Anh Nam, Chị Linh..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Thời hạn hiệu lực:
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium text-slate-900"
              >
                <option value={1}>24 giờ (1 ngày)</option>
                <option value={3}>3 ngày</option>
                <option value={7}>7 ngày (1 tuần)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Mục đích vào kho:
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Generated PIN Card */}
          <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-2 text-center border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Mã PIN Smart Lock ngẫu nhiên dành riêng cho khách:</div>
            <div className="text-3xl tabular-nums font-black tracking-widest text-amber-400 font-mono">
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
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>

            {/* [ Nút Chia sẻ qua Zalo/Email ] */}
            <button
              type="button"
              onClick={handleShareZalo}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ Zalo/SMS</span>
            </button>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Xác nhận cấp mã
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
