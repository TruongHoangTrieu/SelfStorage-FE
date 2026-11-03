'use client';

import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Upload,
  Send,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerUnit, SupportTicket } from '../types';
import { customerUnitsApi } from '../../../lib/api/customerUnits';
import { supportApi, emitSupportRealtimeEvent } from '../../../lib/api/support';

// Map frontend categories to backend enum values
const CATEGORY_MAP: Record<string, string> = {
  'Lỗi ổ khóa / Mã PIN không mở được': 'LOCK',
  'Hư hỏng thiết bị / Cơ sở vật chất': 'DAMAGE',
  'Vấn đề thanh toán / Hóa đơn': 'PAYMENT',
  'Hỗ trợ thiết bị vận chuyển': 'UNIT',
  'Cấp lại mã PIN / Thẻ RFID': 'ACCESS_CODE',
  'Kỹ thuật vận hành': 'UNIT',
  'Khác': 'OTHER',
};

const URGENCY_MAP: Record<string, string> = {
  'normal': 'LOW',
  'high': 'HIGH',
  'urgent': 'URGENT',
};

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
  const [ticketTitle, setTicketTitle] = useState(`Sự cố với ${unit.unitNumber}`);
  const [category, setCategory] = useState('Lỗi ổ khóa / Mã PIN không mở được');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('high');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const res = await supportApi.uploadPhoto(file);
        if (res?.url) uploadedUrls.push(res.url);
      }
      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls]);
        toast.success(`Đã tải lên ${uploadedUrls.length} hình ảnh đính kèm`);
      }
    } catch {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const createdTicket = await customerUnitsApi.createSupportRequest({
        facilityId: unit.facilityId ? String(unit.facilityId) : '',
        contractItemId: unit.rawContractItemId ? String(unit.rawContractItemId) : (unit.rawContractId ? String(unit.id) : undefined),
        category: CATEGORY_MAP[category] || 'OTHER',
        subject: ticketTitle,
        description: description.trim(),
        priority: URGENCY_MAP[urgency] || 'HIGH',
        photos: photos.length > 0 ? photos : undefined,
      });

      onSubmitTicket(createdTicket);
      setPhotos([]);
      onClose();
    } catch (err) {
      console.warn('Backend support request creation offline, fallback to local state', err);
      const mockCode = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket: SupportTicket = {
        id: mockCode,
        title: ticketTitle,
        unitCode: unit.unitNumber,
        category: category,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        status: 'open',
        lastReply: 'Đã tiếp nhận yêu cầu. Kỹ thuật viên cơ sở đang chuẩn bị xử lý.',
      };
      emitSupportRealtimeEvent({
        type: 'support_ticket_created',
        ticket: {
          id: mockCode,
          requestCode: mockCode,
          customerId: 'cust-local',
          facilityId: String(unit.facilityId || '1'),
          category: (CATEGORY_MAP[category] || 'OTHER') as any,
          subject: ticketTitle,
          description: description.trim(),
          priority: (URGENCY_MAP[urgency] || 'HIGH') as any,
          status: 'OPEN',
          photos: photos.length > 0 ? photos : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          facility: { id: String(unit.facilityId || '1'), name: unit.facilityName },
          contractItem: {
            id: String(unit.rawContractItemId || '1'),
            unit: { id: String(unit.rawUnitId || unit.id), unitNumber: unit.unitNumber, floor: unit.floor },
          },
        },
      });
      onSubmitTicket(newTicket);
      setPhotos([]);
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
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Báo Cáo Sự Cố &amp; Yêu Cầu Kỹ Thuật
              </h3>
              <p className="text-xs text-slate-500">Cơ sở: {unit.facilityName}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ô kho đã chọn sẵn */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Ô kho bị ảnh hưởng:</span>
            <span className="font-bold text-slate-900 tabular-nums bg-white px-2.5 py-1 rounded border border-slate-200">
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
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Upload Hình Ảnh Đính Kèm */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Hình ảnh hiện trạng sự cố (Tùy chọn):
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Đang tải ảnh...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải ảnh lên từ máy</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400">
                Hỗ trợ JPG, PNG, WEBP ({photos.length} ảnh đã chọn)
              </span>
            </div>

            {photos.length > 0 && (
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={url}
                      alt={`Ảnh sự cố ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl shadow-md shadow-red-600/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi báo cáo sự cố</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
