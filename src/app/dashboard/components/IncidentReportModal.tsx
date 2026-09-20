'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Upload,
  Send,
  CheckCircle2
} from 'lucide-react';
import { CustomerUnit, SupportTicket } from '../types';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: CustomerUnit;
  onSubmitTicket: (newTicket: SupportTicket) => void;
}

export default function IncidentReportModal({
  isOpen,
  onClose,
  unit,
  onSubmitTicket,
}: IncidentReportModalProps) {
  // Tự động điền sẵn tiêu đề với Số ô kho đã chọn sẵn!
  const [ticketTitle, setTicketTitle] = useState(`Sự cố với ${unit.unitNumber}`);
  const [category, setCategory] = useState('Lỗi ổ khóa / Mã PIN không mở được');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('high');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newTicket: SupportTicket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: ticketTitle,
      unitCode: unit.unitNumber,
      category: category,
      createdAt: '20/09/2026',
      status: 'open',
      lastReply: 'Đã tiếp nhận yêu cầu. Kỹ thuật viên cơ sở đang di chuyển tới ô kho để kiểm tra.',
    };

    onSubmitTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Báo Cáo Sự Cố & Yêu Cầu Kỹ Thuật (Luồng 7)
              </h3>
              <p className="text-xs text-slate-500">Cơ sở: {unit.facilityName}</p>
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
          {/* Ô kho đã chọn sẵn */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Ô kho bị ảnh hưởng:</span>
            <span className="font-bold text-slate-900 font-mono bg-white px-2.5 py-1 rounded border border-slate-200">
              {unit.unitNumber} ({unit.floor})
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tiêu đề phiếu hỗ trợ (Tự động điền sẵn):
            </label>
            <input
              type="text"
              required
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phân loại sự cố:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
              >
                <option value="Lỗi ổ khóa / Mã PIN không mở được">Kẹt khóa / Mã PIN không ăn</option>
                <option value="Đèn chiếu sáng hoặc quạt thông gió hỏng">Đèn chiếu sáng hỏng</option>
                <option value="Nhiệt độ hoặc độ ẩm bất thường">Nhiệt độ / Độ ẩm bất thường</option>
                <option value="Cửa cuốn kẹt, khó kéo">Cửa cuốn kẹt, khó kéo</option>
                <option value="Khác">Sự cố kỹ thuật khác</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mức độ khẩn cấp:
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
              >
                <option value="normal">Bình thường (Trong ngày)</option>
                <option value="high">Cao (Cần hỗ trợ trong 30p)</option>
                <option value="urgent">Khẩn cấp (Ngay lập tức tại quầy)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mô tả chi tiết sự cố:
            </label>
            <textarea
              required
              rows={3}
              placeholder="Mô tả cụ thể hiện tượng bạn gặp phải khi sử dụng ô kho..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
            />
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/25 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi báo cáo sự cố</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
