'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  KeyRound,
  FileText,
  Headphones,
  Bell,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
  Building,
} from 'lucide-react';
import { NotificationItem, notificationsApi } from '@/lib/api/notifications';
import { api } from '@/lib/api';

interface NotificationDetailModalProps {
  notification: NotificationItem | any | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (url: string) => void;
  targetUrl?: string;
}

function getVisuals(type?: string) {
  const t = String(type || '').toUpperCase();
  if (t.includes('PAYMENT')) {
    return {
      tag: 'GIAO DỊCH & HÓA ĐƠN',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconClass: 'bg-emerald-600 text-white',
      icon: CreditCard,
    };
  }
  if (t.includes('SUPPORT')) {
    return {
      tag: 'HỖ TRỢ KỸ THUẬT',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      iconClass: 'bg-purple-600 text-white',
      icon: Headphones,
    };
  }
  if (t.includes('RESERVATION') || t.includes('HANDOVER')) {
    return {
      tag: 'ĐẶT CHỖ & BÀN GIAO',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      iconClass: 'bg-amber-600 text-white',
      icon: Calendar,
    };
  }
  if (t.includes('CONTRACT')) {
    return {
      tag: 'HỢP ĐỒNG THUÊ KHO',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      iconClass: 'bg-blue-600 text-white',
      icon: FileText,
    };
  }
  if (t.includes('ACCESS')) {
    return {
      tag: 'TRUY CẬP & MÃ KHÓA',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconClass: 'bg-cyan-600 text-white',
      icon: KeyRound,
    };
  }
  if (t.includes('RENEWAL') || t.includes('OVERDUE')) {
    return {
      tag: 'GIA HẠN HỢP ĐỒNG',
      badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
      iconClass: 'bg-pink-600 text-white',
      icon: RefreshCw,
    };
  }
  return {
    tag: 'THÔNG BÁO HỆ THỐNG',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    iconClass: 'bg-slate-700 text-white',
    icon: Bell,
  };
}

function formatVND(val?: number | string) {
  if (val === undefined || val === null) return '';
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
  if (isNaN(num)) return String(val);
  return `${new Intl.NumberFormat('vi-VN').format(num)} đ`;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onNavigate,
  targetUrl,
}: NotificationDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !notification) {
      setDetailData(null);
      return;
    }

    let cancelled = false;
    setDetailData(notification);
    setLoading(true);

    const resolveDetails = async () => {
      let currentDetail: any = {
        ...notification,
        relatedEntity: notification.relatedEntity || notification.metadata?.relatedEntity,
      };

      // 1. Thử lấy chi tiết từ /notifications/:id
      if (notification.id && !String(notification.id).startsWith('notif-tk-')) {
        try {
          const res: any = await notificationsApi.getDetail(notification.id);
          if (res) {
            currentDetail = { ...currentDetail, ...res };
          }
        } catch {}
      }

      // 2. Nếu chưa có relatedEntity đầy đủ, tự động truy vấn chi tiết đơn hàng/hợp đồng/hóa đơn/sự cố
      if (!currentDetail.relatedEntity) {
        const rawType = String(currentDetail.type || currentDetail.entityType || '').toUpperCase();
        const text = `${currentDetail.title || ''} ${currentDetail.body || ''}`;
        const entityId = currentDetail.entityId || currentDetail.metadata?.entityId || currentDetail.metadata?.reservationId || currentDetail.metadata?.contractId;

        const rsvMatch = text.match(/RSV-[A-Z0-9-]+/i)?.[0];
        const conMatch = text.match(/CON-[A-Z0-9-]+/i)?.[0];
        const tkMatch = text.match(/TK-[A-Z0-9-]+/i)?.[0];
        const payMatch = text.match(/SS(?:DEP|REN)[A-Z0-9]+/i)?.[0];

        try {
          if (rawType.includes('RESERVATION') || rawType.includes('HANDOVER') || rsvMatch) {
            if (entityId && !String(entityId).startsWith('RSV-')) {
              const rsv = await api.get(`/handovers/reservations/${entityId}`).catch(() =>
                api.get(`/reservations/${entityId}`).catch(() => null)
              );
              if (rsv) currentDetail.relatedEntity = rsv;
            }
            if (!currentDetail.relatedEntity) {
              const listRes: any = await api.get('/reservations?limit=50').catch(() => null);
              const list = Array.isArray(listRes) ? listRes : listRes?.data || [];
              const found = list.find(
                (r: any) =>
                  (entityId && (String(r.id) === String(entityId) || String(r.reservationCode) === String(entityId))) ||
                  (rsvMatch && String(r.reservationCode).toUpperCase() === rsvMatch.toUpperCase())
              ) || list[0];
              if (found) currentDetail.relatedEntity = found;
            }
          } else if (rawType.includes('CONTRACT') || rawType.includes('RENEWAL') || rawType.includes('OVERDUE') || conMatch) {
            const listRes: any = await api.get('/contracts').catch(() => null);
            const list = Array.isArray(listRes) ? listRes : listRes?.data || [];
            const found = list.find(
              (c: any) =>
                (entityId && (String(c.id) === String(entityId) || String(c.contractCode) === String(entityId))) ||
                (conMatch && String(c.contractCode).toUpperCase() === conMatch.toUpperCase())
            ) || list[0];
            if (found) currentDetail.relatedEntity = found;
          } else if (rawType.includes('PAYMENT') || payMatch) {
            const listRes: any = await api.get('/payments?limit=50').catch(() => null);
            const list = Array.isArray(listRes) ? listRes : listRes?.data || [];
            const found = list.find(
              (p: any) =>
                (entityId && (String(p.id) === String(entityId) || String(p.paymentCode) === String(entityId))) ||
                (payMatch && String(p.paymentCode).toUpperCase() === payMatch.toUpperCase())
            ) || list[0];
            if (found) currentDetail.relatedEntity = found;
          } else if (rawType.includes('SUPPORT') || tkMatch) {
            if (entityId && !String(entityId).startsWith('TK-')) {
              const tk = await api.get(`/support/requests/${entityId}`).catch(() => null);
              if (tk) currentDetail.relatedEntity = tk;
            }
            if (!currentDetail.relatedEntity) {
              const listRes: any = await api.get('/support/requests?limit=50').catch(() => null);
              const list = Array.isArray(listRes) ? listRes : listRes?.data || [];
              const found = list.find(
                (t: any) =>
                  (entityId && (String(t.id) === String(entityId) || String(t.requestCode) === String(entityId))) ||
                  (tkMatch && String(t.requestCode).toUpperCase() === tkMatch.toUpperCase())
              );
              if (found) currentDetail.relatedEntity = found;
            }
          }
        } catch {}
      }

      if (!cancelled) {
        setDetailData(currentDetail);
        setLoading(false);
      }
    };

    resolveDetails();
    return () => {
      cancelled = true;
    };
  }, [isOpen, notification]);

  if (!isOpen || !notification || !mounted) return null;

  const visuals = getVisuals(notification.type || notification.entityType);
  const IconComp = visuals.icon;
  const entity = detailData?.relatedEntity;

  const handleActionClick = () => {
    onClose();
    if (targetUrl && onNavigate) {
      onNavigate(targetUrl);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${visuals.iconClass}`}>
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${visuals.badgeClass}`}>
                  {visuals.tag}
                </span>
                <span className="text-[11px] text-slate-400">
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString('vi-VN') : ''}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 leading-snug">
                Chi Tiết Thông Báo
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Main Title & Body */}
          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {notification.title}
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {notification.body}
            </div>
          </div>

          {/* Reference Entity Code */}
          {notification.entityId && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50/50 px-3.5 py-2 rounded-xl border border-blue-100">
              <span className="font-semibold text-slate-600">Mã định danh liên kết:</span>
              <span className="font-mono font-bold text-blue-700">#{notification.entityId}</span>
            </div>
          )}

          {/* Loading indicator for detailed backend resolution */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Đang kiểm tra chi tiết từ hệ thống...</span>
            </div>
          )}

          {/* Related Live Entity Details */}
          {entity && !loading && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 text-xs font-bold text-slate-800">
                <span>Dữ Liệu Đối Tượng Liên Quan</span>
                {entity.status && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {entity.status}
                  </span>
                )}
              </div>

              {/* PAYMENT DETAILS */}
              {(entity.paymentCode || entity.amount !== undefined) && (
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  {entity.paymentCode && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500">Mã giao dịch:</span>
                      <span className="font-mono font-bold text-slate-800">#{entity.paymentCode}</span>
                    </div>
                  )}
                  {entity.amount !== undefined && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Số tiền thanh toán:</span>
                      <span className="font-bold text-emerald-600 text-sm">{formatVND(entity.amount)}</span>
                    </div>
                  )}
                  {entity.paymentType && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Khoản mục:</span>
                      <span className="font-semibold text-slate-800">
                        {entity.paymentType === 'DEPOSIT'
                          ? 'Tiền đặt cọc giữ chỗ'
                          : entity.paymentType === 'RENTAL' || entity.paymentType === 'FIRST_MONTH'
                          ? 'Tiền thuê buồng kho'
                          : entity.paymentType === 'RENEWAL'
                          ? 'Gia hạn hợp đồng'
                          : entity.paymentType}
                      </span>
                    </div>
                  )}
                  {entity.paymentMethod && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Hình thức:</span>
                      <span className="font-semibold text-slate-800">
                        {entity.paymentMethod === 'SEPAY_QR' || entity.paymentMethod === 'VNPAY'
                          ? 'Cổng thanh toán tự động (VietQR / Chuyển khoản)'
                          : entity.paymentMethod === 'CASH'
                          ? 'Tiền mặt tại cơ sở'
                          : entity.paymentMethod}
                      </span>
                    </div>
                  )}
                  {entity.paidAt && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Thời gian nộp:</span>
                      <span className="text-slate-700">{new Date(entity.paidAt).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SUPPORT DETAILS */}
              {(entity.requestCode || entity.subject) && (
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  {entity.requestCode && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500">Mã phiếu:</span>
                      <span className="font-mono font-bold text-slate-800">#{entity.requestCode}</span>
                    </div>
                  )}
                  {entity.subject && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Tiêu đề:</span>
                      <span className="font-bold text-slate-800 text-right">{entity.subject}</span>
                    </div>
                  )}
                  {entity.category && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Phân loại:</span>
                      <span className="font-semibold text-slate-700">{entity.category}</span>
                    </div>
                  )}
                  {entity.priority && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Mức độ ưu tiên:</span>
                      <span className="font-semibold text-amber-700">{entity.priority}</span>
                    </div>
                  )}
                  {entity.photos && entity.photos.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-slate-500 block">Hình ảnh đính kèm:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {entity.photos.map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white block"
                          >
                            <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {entity.logs && entity.logs.length > 0 && (
                    <div className="pt-2 text-[11px] text-slate-600 space-y-1">
                      <span className="font-bold text-slate-700 block">Nhật ký xử lý:</span>
                      <p className="bg-white p-2 rounded-lg border border-slate-200">
                        {entity.logs[0]?.note || entity.logs[0]?.message || entity.logs[0]?.notes || 'Đã ghi nhận yêu cầu'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* RESERVATION / ORDER DETAILS */}
              {entity.reservationCode && (
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">Mã đơn đặt kho:</span>
                    <span className="font-mono font-bold text-blue-700">#{entity.reservationCode}</span>
                  </div>
                  {entity.customer && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Khách hàng:</span>
                      <span className="font-bold text-slate-800">
                        {entity.customer.fullName}
                        {entity.customer.phone ? ` • ${entity.customer.phone}` : ''}
                      </span>
                    </div>
                  )}
                  {entity.facility && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Cơ sở lưu trữ:</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[65%]">{entity.facility.name}</span>
                    </div>
                  )}
                  {entity.items && entity.items[0] && (
                    <>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500">Loại kho / Ngăn kho:</span>
                        <span className="font-bold text-slate-800 text-right">
                          {entity.items[0].unitType?.name || 'Ngăn kho tiêu chuẩn'}
                          {entity.items[0].unit?.unitNumber ? ` (Ô ${entity.items[0].unit.unitNumber})` : ''}
                        </span>
                      </div>
                      {entity.items[0].depositAmount !== undefined && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-slate-500">Tiền cọc giữ chỗ:</span>
                          <span className="font-bold text-emerald-600">{formatVND(entity.items[0].depositAmount)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {entity.rentalPeriod && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Thời hạn thuê:</span>
                      <span className="font-semibold text-slate-800">{entity.rentalPeriod} tháng</span>
                    </div>
                  )}
                  {entity.totalAmount !== undefined && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Tổng giá trị đơn hàng:</span>
                      <span className="font-extrabold text-blue-700 text-sm">{formatVND(entity.totalAmount)}</span>
                    </div>
                  )}
                  {entity.appointmentDate && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Lịch hẹn nhận kho:</span>
                      <span className="font-semibold text-slate-800">{new Date(entity.appointmentDate).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* CONTRACT DETAILS */}
              {entity.contractCode && (
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">Mã hợp đồng:</span>
                    <span className="font-mono font-bold text-blue-700">#{entity.contractCode}</span>
                  </div>
                  {entity.customer && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Khách thuê:</span>
                      <span className="font-bold text-slate-800">
                        {entity.customer.fullName}
                        {entity.customer.phone ? ` • ${entity.customer.phone}` : ''}
                      </span>
                    </div>
                  )}
                  {entity.facility && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Cơ sở:</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[65%]">{entity.facility.name}</span>
                    </div>
                  )}
                  {entity.contractItems && entity.contractItems[0]?.unit && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Ngăn kho:</span>
                      <span className="font-bold text-slate-800">
                        Ô {entity.contractItems[0].unit.unitNumber}
                        {entity.contractItems[0].price ? ` • ${formatVND(entity.contractItems[0].price)}/tháng` : ''}
                      </span>
                    </div>
                  )}
                  {entity.startDate && entity.endDate && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500">Thời hạn hiệu lực:</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(entity.startDate).toLocaleDateString('vi-VN')} - {new Date(entity.endDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>

          {targetUrl && (
            <button
              type="button"
              onClick={handleActionClick}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Xem Trong Quản Lý Kho</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
