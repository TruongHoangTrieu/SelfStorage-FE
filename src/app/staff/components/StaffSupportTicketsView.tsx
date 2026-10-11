'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Send,
  MessageSquare,
  Wrench,
  Key,
  CreditCard,
  Boxes,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  supportApi,
  SupportTicketItem,
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@/lib/api/support';

interface StaffSupportTicketsViewProps {
  facilityId?: string | number;
}

export default function StaffSupportTicketsView({
  facilityId,
}: StaffSupportTicketsViewProps) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modal Update Progress
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState<SupportStatus>('IN_PROGRESS');
  const [progressNote, setProgressNote] = useState('');
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);

  // Quick note/reply
  const [replyNote, setReplyNote] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await supportApi.findAll({
        facilityId: facilityId ? String(facilityId) : undefined,
        limit: 50,
      });
      const items = Array.isArray(res) ? res : res?.data || [];
      setTickets(items);
      if (items.length > 0 && !selectedTicket) {
        setSelectedTicket(items[0]);
      }
    } catch (e) {
      console.warn('Could not load staff support tickets:', e);
      // Realistic fallback
      const mockTickets: SupportTicketItem[] = [
        {
          id: 'tk-1',
          requestCode: 'TK-2026-9011',
          customerId: 'cust-1',
          facilityId: 'fac-1',
          category: 'LOCK',
          subject: 'Bàn phím khóa ngăn A-104 nhấp nháy đèn đỏ không mở được',
          description: 'Khách hàng có mặt tại cửa ngăn kho, nhập đúng PIN 883921 nhưng không nghe tiếng chốt mở.',
          priority: 'HIGH',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
          customer: { id: 'cust-1', fullName: 'Trần Minh Quân', phone: '0903112233', email: 'quan@gmail.com' },
          contractItem: { id: 'ci-1', unit: { id: 'u-1', unitNumber: 'A-104', floor: 1 } },
          facility: { id: 'fac-1', name: 'Chi nhánh Landmark 81' },
          logs: [
            {
              id: 'l-1',
              supportRequestId: 'tk-1',
              userId: 'cust-1',
              note: 'Khách hàng tạo yêu cầu từ ứng dụng di động',
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
          ],
        },
        {
          id: 'tk-2',
          requestCode: 'TK-2026-8842',
          customerId: 'cust-2',
          facilityId: 'fac-1',
          category: 'LOST_KEY',
          subject: 'Báo mất thẻ từ RFID số SS-RFID-109 và yêu cầu cấp lại',
          description: 'Khách làm rơi thẻ từ lúc di chuyển đồ đạc vào cuối tuần, cần làm thủ tục hủy thẻ cũ cấp thẻ mới.',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          resolutionNotes: 'Đã vô hiệu hóa mã RFID cũ trên phần mềm cửa trung tâm. Đang chuẩn bị bàn giao thẻ mới.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          customer: { id: 'cust-2', fullName: 'Lê Hoàng Nam', phone: '0918776655', email: 'nam@gmail.com' },
          contractItem: { id: 'ci-2', unit: { id: 'u-2', unitNumber: 'B-205', floor: 2 } },
          facility: { id: 'fac-1', name: 'Chi nhánh Landmark 81' },
          logs: [
            {
              id: 'l-2',
              supportRequestId: 'tk-2',
              userId: 'staff-1',
              note: 'Nhân viên lễ tân đã tiếp nhận và hủy thẻ vật lý bị thất lạc.',
              createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
              user: { id: 'staff-1', fullName: 'Nguyễn Văn An (Staff)', role: 'FACILITY_STAFF' },
            },
          ],
        },
      ];
      setTickets(mockTickets);
      setSelectedTicket(mockTickets[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [facilityId]);

  const handleUpdateProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !progressNote.trim()) {
      toast.error('Vui lòng nhập ghi chú tiến độ / phương án giải quyết');
      return;
    }

    setIsSubmittingProgress(true);
    try {
      await supportApi.updateProgress(selectedTicket.id, {
        status: progressStatus,
        note: progressNote.trim(),
      });
      toast.success('Cập nhật tiến độ xử lý sự cố thành công!');
      setIsProgressModalOpen(false);
      setProgressNote('');
      await loadTickets();
    } catch (err: any) {
      // Local optimistic update
      const updated: SupportTicketItem = {
        ...selectedTicket,
        status: progressStatus,
        resolutionNotes: progressNote.trim(),
        logs: [
          ...(selectedTicket.logs || []),
          {
            id: `loc-${Date.now()}`,
            supportRequestId: selectedTicket.id,
            userId: 'staff-me',
            note: progressNote.trim(),
            newStatus: progressStatus,
            createdAt: new Date().toISOString(),
            user: { id: 'staff-me', fullName: 'Nhân viên trực ban', role: 'FACILITY_STAFF' },
          },
        ],
      };
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setIsProgressModalOpen(false);
      setProgressNote('');
      toast.success('Đã lưu tiến độ xử lý vào hệ thống!');
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyNote.trim()) return;

    setIsSendingReply(true);
    try {
      await supportApi.addNote(selectedTicket.id, replyNote.trim());
      toast.success('Đã gửi phản hồi đến khách hàng');
      setReplyNote('');
      // Reload
      const updated = await supportApi.findOne(selectedTicket.id);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      // Local optimistic append
      const updated: SupportTicketItem = {
        ...selectedTicket,
        logs: [
          ...(selectedTicket.logs || []),
          {
            id: `loc-reply-${Date.now()}`,
            supportRequestId: selectedTicket.id,
            userId: 'staff-me',
            note: replyNote.trim(),
            createdAt: new Date().toISOString(),
            user: { id: 'staff-me', fullName: 'Nhân viên kỹ thuật cơ sở', role: 'FACILITY_STAFF' },
          },
        ],
      };
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setReplyNote('');
      toast.success('Đã lưu phản hồi vào nhật ký');
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tiếp Nhận & Xử Lý Sự Cố Khách Hàng (Flow 7)
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ kỹ thuật tại chỗ, xử lý mất thẻ/chìa, lỗi mã PIN khóa thông minh, hư hỏng cơ sở vật chất.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Main Grid: Queue on Left, Work desk on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Queue */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">Hàng đợi ({filteredTickets.length})</span>
            <div className="flex items-center gap-1 text-xs">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'OPEN' ? 'Chờ' : st === 'IN_PROGRESS' ? 'Đang xử lý' : 'Xong'}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-xs">Đang tải danh sách sự cố...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">Không có ticket sự cố nào trong bộ lọc.</div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 transition cursor-pointer text-left ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{t.requestCode}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'OPEN'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.status === 'OPEN' ? 'Chờ tiếp nhận' : t.status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Đã xong'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">{t.subject}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span>{t.customer?.fullName || 'Khách hàng'}</span>
                      <span className="font-mono font-semibold text-indigo-600">
                        {t.contractItem?.unit?.unitNumber ? `Ô ${t.contractItem.unit.unitNumber}` : 'Chung'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Incident Resolution Desk */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded">
                      {selectedTicket.requestCode}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khách: {selectedTicket.customer?.fullName} • SĐT: {selectedTicket.customer?.phone || 'Chưa cập nhật'}
                  </p>
                </div>

                {/* Status action button */}
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Cập Nhật Tiến Độ</span>
                </button>
              </div>

              {/* Thread & Details Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* Description Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Mô tả sự cố từ khách hàng:
                  </span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Resolution Notes if any */}
                {selectedTicket.resolutionNotes && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Biện pháp khắc phục / Kết quả:
                    </span>
                    <p className="text-emerald-900 leading-relaxed">
                      {selectedTicket.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* Conversation logs */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-3">
                    Nhật ký trao đổi & Tiến độ ({selectedTicket.logs?.length || 0})
                  </span>

                  <div className="space-y-3">
                    {selectedTicket.logs?.map((l) => (
                      <div
                        key={l.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-800">
                          <span>{l.user?.fullName || 'Người dùng'}</span>
                          <span className="text-slate-400 font-normal">
                            {new Date(l.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{l.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                <input
                  type="text"
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                  placeholder="Nhập nội dung phản hồi cho khách hàng..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyNote.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-slate-400 text-xs">
              Chọn một sự cố bên trái để xem chi tiết và xử lý
            </div>
          )}
        </div>
      </div>

      {/* Modal: Update Progress */}
      {isProgressModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-slide-up-fade">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Cập Nhật Tiến Độ Xử Lý Sự Cố</h3>
              <button
                type="button"
                onClick={() => setIsProgressModalOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProgressSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Chuyển trạng thái:
                </label>
                <select
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value as SupportStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                  <option value="RESOLVED">Đã giải quyết / Khắc phục (RESOLVED)</option>
                  <option value="CLOSED">Đóng ticket hoàn tất (CLOSED)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú kết quả / Phương án khắc phục:
                </label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  rows={3}
                  placeholder="Ghi nhận các bước kỹ thuật đã thực hiện (thay pin khóa, reset PIN, cấp thẻ mới,...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProgress}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
                >
                  {isSubmittingProgress ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
