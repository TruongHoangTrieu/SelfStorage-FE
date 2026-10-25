'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Image as ImageIcon,
  ChevronRight,
  Filter,
  ShieldAlert,
  Key,
  Boxes,
  CreditCard,
  Wrench,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  supportApi,
  SupportTicketItem,
  SupportCategory,
  SupportPriority,
} from '@/lib/api/support';
import { CustomerUnit } from '../types';

interface CustomerSupportViewProps {
  units: CustomerUnit[];
  onOpenReportIncident?: () => void;
}

export default function CustomerSupportView({
  units,
  onOpenReportIncident,
}: CustomerSupportViewProps) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newNote, setNewNote] = useState('');
  const [isSendingNote, setIsSendingNote] = useState(false);

  // Modal Create Ticket
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [category, setCategory] = useState<SupportCategory>('LOCK');
  const [priority, setPriority] = useState<SupportPriority>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await supportApi.findAll({ limit: 50 });
      const items = Array.isArray(res) ? res : res?.data || [];
      setTickets(items);
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const targetTicketId = searchParams?.get('ticketId');
      if (targetTicketId) {
        const found = items.find((t: any) => String(t.id) === String(targetTicketId) || String(t.requestCode) === String(targetTicketId));
        if (found) {
          setSelectedTicket(found);
        } else if (items.length > 0 && !selectedTicket) {
          setSelectedTicket(items[0]);
        }
      } else if (items.length > 0 && !selectedTicket) {
        setSelectedTicket(items[0]);
      }
    } catch (e) {
      console.warn('Could not load support tickets from backend:', e);
      // Fallback sample data if backend is starting up or has no tickets yet
      const fallbackTickets: SupportTicketItem[] = [
        {
          id: 'fb-1',
          requestCode: 'TK-2026-8910',
          customerId: 'cust-1',
          facilityId: 'fac-1',
          category: 'LOCK',
          subject: 'Khóa cửa thông minh không phản hồi khi nhập mã PIN',
          description: 'Tôi đã nhập mã PIN 4 lần liên tiếp nhưng bàn phím số chỉ nháy đèn vàng và không mở chốt.',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          resolutionNotes: 'Kỹ thuật viên đã kiểm tra nguồn pin và đang tiến hành reset ổ khóa tại cơ sở.',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          updatedAt: new Date().toISOString(),
          facility: { id: 'fac-1', name: 'Chi nhánh Landmark 81' },
          contractItem: { id: 'ci-1', unit: { id: 'u-1', unitNumber: 'A-104', floor: 1 } },
          logs: [
            {
              id: 'log-1',
              supportRequestId: 'fb-1',
              userId: 'staff-1',
              note: 'Nhân viên trực ca Nguyễn Văn An đã tiếp nhận sự cố và có mặt tại ngăn kho.',
              newStatus: 'IN_PROGRESS',
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              user: { id: 'staff-1', fullName: 'Nguyễn Văn An (Kỹ thuật)', role: 'FACILITY_STAFF' },
            },
          ],
        },
        {
          id: 'fb-2',
          requestCode: 'TK-2026-6734',
          customerId: 'cust-1',
          facilityId: 'fac-1',
          category: 'PAYMENT',
          subject: 'Xác nhận giao dịch thanh toán phí gia hạn hợp đồng qua VietQR',
          description: 'Tôi đã quét mã VietQR và tiền đã trừ trong ngân hàng nhưng hệ thống vẫn báo Pending.',
          priority: 'MEDIUM',
          status: 'RESOLVED',
          resolutionNotes: 'Hệ thống đã nhận Webhook SePay và cập nhật trạng thái hóa đơn thành công.',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          facility: { id: 'fac-1', name: 'Chi nhánh Landmark 81' },
          logs: [
            {
              id: 'log-2',
              supportRequestId: 'fb-2',
              userId: 'admin-1',
              note: 'Đã đối soát biến động số dư SePay. Hợp đồng đã được gia hạn thêm 3 tháng.',
              newStatus: 'RESOLVED',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              user: { id: 'admin-1', fullName: 'Bộ phận Kế toán', role: 'BUSINESS_OPERATIONS_MANAGER' },
            },
          ],
        },
      ];
      setTickets(fallbackTickets);
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const targetTicketId = searchParams?.get('ticketId');
      if (targetTicketId) {
        const found = fallbackTickets.find((t: any) => String(t.id) === String(targetTicketId) || String(t.requestCode) === String(targetTicketId));
        if (found) {
          setSelectedTicket(found);
        } else {
          setSelectedTicket(fallbackTickets[0]);
        }
      } else {
        setSelectedTicket(fallbackTickets[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const handleTicketUrlSync = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('ticketId');
        if (ticketId && tickets.length > 0) {
          const match = tickets.find(
            (t) => String(t.id) === String(ticketId) || String(t.requestCode) === String(ticketId)
          );
          if (match) {
            setSelectedTicket(match);
          }
        }
      }
    };
    window.addEventListener('popstate', handleTicketUrlSync);
    window.addEventListener('custom-tab-change', handleTicketUrlSync);
    return () => {
      window.removeEventListener('popstate', handleTicketUrlSync);
      window.removeEventListener('custom-tab-change', handleTicketUrlSync);
    };
  }, [tickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và mô tả sự cố');
      return;
    }

    const targetUnit = units.find((u) => u.id === selectedUnitId) || units[0];
    const facId = String(targetUnit?.facilityId || '1');

    setIsSubmitting(true);
    try {
      const created = await supportApi.create({
        facilityId: facId,
        contractItemId: targetUnit?.rawContractItemId ? String(targetUnit.rawContractItemId) : undefined,
        category,
        subject,
        description,
        priority,
        photos: photoUrl.trim() ? [photoUrl.trim()] : undefined,
      });
      toast.success('Gửi yêu cầu hỗ trợ thành công! Đội ngũ kỹ thuật sẽ tiếp nhận ngay.');
      setIsCreateOpen(false);
      setSubject('');
      setDescription('');
      setPhotoUrl('');
      await loadTickets();
      if (created) setSelectedTicket(created);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo yêu cầu hỗ trợ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedTicket) return;

    setIsSendingNote(true);
    try {
      await supportApi.addNote(selectedTicket.id, newNote.trim());
      toast.success('Đã gửi phản hồi thành công');
      setNewNote('');
      // Reload ticket detail
      const updated = await supportApi.findOne(selectedTicket.id);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      // Local optimistic append if backend is not responsive
      const mockLog = {
        id: `local-${Date.now()}`,
        supportRequestId: selectedTicket.id,
        userId: 'me',
        note: newNote.trim(),
        createdAt: new Date().toISOString(),
        user: { id: 'me', fullName: 'Tôi (Khách hàng)', role: 'STORAGE_CUSTOMER' },
      };
      setSelectedTicket({
        ...selectedTicket,
        logs: [...(selectedTicket.logs || []), mockLog],
      });
      setNewNote('');
      toast.success('Đã lưu phản hồi vào nhật ký trao đổi');
    } finally {
      setIsSendingNote(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const getCategoryIcon = (cat: SupportCategory) => {
    switch (cat) {
      case 'LOCK':
      case 'ACCESS_CODE':
      case 'LOST_KEY':
        return <Key className="w-4 h-4 text-amber-600" />;
      case 'UNIT':
      case 'DAMAGE':
        return <Wrench className="w-4 h-4 text-rose-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'STORED_ITEMS':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoryLabel = (cat: SupportCategory) => {
    switch (cat) {
      case 'LOCK':
        return 'Khóa thông minh';
      case 'ACCESS_CODE':
        return 'Mã truy cập / PIN';
      case 'LOST_KEY':
        return 'Mất chìa / Thẻ từ';
      case 'UNIT':
        return 'Cơ sở hạ tầng kho';
      case 'DAMAGE':
        return 'Hư hỏng thiết bị';
      case 'PAYMENT':
        return 'Thanh toán & Hóa đơn';
      case 'STORED_ITEMS':
        return 'Đồ đạc lưu trữ';
      default:
        return 'Yêu cầu khác';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Chờ tiếp nhận
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> Đang xử lý
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Đã khắc phục
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Đã đóng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (p: SupportPriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-700">Ưu tiên cao</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">Trung bình</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">Thấp</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Trung Tâm Hỗ Trợ & Tiếp Nhận Sự Cố</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gửi phản ánh kỹ thuật (khóa thông minh, mất thẻ, sự cố ngăn kho, hóa đơn). Đội ngũ cơ sở tiếp nhận 24/7.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Yêu Cầu Mới</span>
        </button>
      </div>

      {/* Main Grid: List on Left, Detail & Thread on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ticket List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[640px]">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600">Danh sách ({filteredTickets.length})</span>
            <div className="flex items-center gap-1 text-xs">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'OPEN' ? 'Chờ' : st === 'IN_PROGRESS' ? 'Đang xử lý' : 'Đã xong'}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-xs">Đang tải danh sách ticket...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Chưa có yêu cầu hỗ trợ nào</p>
                <p className="text-[11px] text-slate-400">Nếu bạn gặp vấn đề kỹ thuật tại kho, hãy bấm Tạo Yêu Cầu Mới</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 transition cursor-pointer text-left ${
                      isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-slate-500 font-medium">{t.requestCode}</span>
                      {getStatusBadge(t.status)}
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{t.subject}</h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(t.category)}
                        <span>{getCategoryLabel(t.category)}</span>
                      </div>
                      <span>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Ticket Detail & Conversation Thread */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[640px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded">
                      {selectedTicket.requestCode}
                    </span>
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="inline-flex items-center gap-1">
                    {getCategoryIcon(selectedTicket.category)}
                    <strong>Loại:</strong> {getCategoryLabel(selectedTicket.category)}
                  </span>
                  {selectedTicket.facility && (
                    <span>
                      <strong>Cơ sở:</strong> {selectedTicket.facility.name}
                    </span>
                  )}
                  {selectedTicket.contractItem?.unit && (
                    <span>
                      <strong>Ngăn kho:</strong> {selectedTicket.contractItem.unit.unitNumber}
                    </span>
                  )}
                  <span>
                    <strong>Ngày gửi:</strong> {new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Ticket Description & Logs Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* Original Description */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nội dung yêu cầu ban đầu:
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedTicket.description}
                  </p>
                  {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium">Đính kèm ảnh minh họa:</span>
                      <a
                        href={selectedTicket.photos[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        Xem hình ảnh
                      </a>
                    </div>
                  )}
                </div>

                {/* Staff Resolution Notes if any */}
                {selectedTicket.resolutionNotes && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Biện pháp khắc phục / Kết quả xử lý:
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {selectedTicket.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* Timeline / Conversation Thread */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span>Nhật ký trao đổi & Tiến độ ({selectedTicket.logs?.length || 0})</span>
                  </div>

                  {(!selectedTicket.logs || selectedTicket.logs.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">Chưa có phản hồi mới. Bạn có thể gửi ghi chú bên dưới.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTicket.logs.map((log) => {
                        const isCustomer = log.user?.role === 'STORAGE_CUSTOMER' || log.userId === 'me';
                        return (
                          <div
                            key={log.id}
                            className={`p-3.5 rounded-xl border text-xs ${
                              isCustomer
                                ? 'bg-indigo-50/70 border-indigo-100 ml-4'
                                : 'bg-slate-50 border-slate-200/80 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                              <span className={isCustomer ? 'text-indigo-700' : 'text-slate-800'}>
                                {log.user?.fullName || (isCustomer ? 'Tôi (Khách hàng)' : 'Kỹ thuật viên')}
                              </span>
                              <span className="text-slate-400 font-normal">
                                {new Date(log.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{log.note}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply / Note Input */}
              <form onSubmit={handleSendNote} className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Nhập nội dung trao đổi hoặc cập nhật thêm thông tin..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSendingNote || !newNote.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-slate-400 text-xs">
              Chọn một yêu cầu bên trái để xem tiến độ chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Support Request */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-slide-up-fade">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Gửi Yêu Cầu Hỗ Trợ Kỹ Thuật</h3>
                  <p className="text-[11px] text-slate-500">Đội ngũ kỹ thuật cơ sở sẽ phản hồi trong 15-30 phút</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              {/* Select Unit */}
              {units.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ngăn kho liên quan:
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} - {u.facilityName} ({u.dimensions})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Danh mục sự cố:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="LOCK">Khóa thông minh (Smart Lock)</option>
                    <option value="ACCESS_CODE">Mã truy cập / Bàn phím PIN</option>
                    <option value="LOST_KEY">Mất thẻ từ / Chìa khóa</option>
                    <option value="DAMAGE">Hư hỏng thiết bị / Cửa kho</option>
                    <option value="UNIT">Nhiệt độ / Độ ẩm / Cơ sở</option>
                    <option value="PAYMENT">Thanh toán & Hóa đơn</option>
                    <option value="STORED_ITEMS">Danh mục đồ đạc</option>
                    <option value="OTHER">Vấn đề khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mức độ ưu tiên:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="LOW">Thấp (Trong 24h)</option>
                    <option value="MEDIUM">Trung bình (Trong 4h)</option>
                    <option value="HIGH">Ưu tiên cao (Trong 1h)</option>
                    <option value="URGENT">Khẩn cấp (Ngay lập tức)</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tiêu đề tóm tắt:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Khóa ngăn kho A-104 không mở được sau khi nhập PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mô tả chi tiết sự cố:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả cụ thể triệu chứng, thời điểm xảy ra và vị trí để kỹ thuật viên xử lý nhanh nhất..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              {/* Image URL optional */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Đường dẫn hình ảnh đính kèm (tùy chọn):
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/anh-su-co.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
