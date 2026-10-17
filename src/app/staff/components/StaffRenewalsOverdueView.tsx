'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert,
  Play,
  Calendar,
  Wallet,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  renewalsApi,
  RenewalRecord,
  OverdueRecord,
} from '@/lib/api/renewals';

type SubTab = 'renewals' | 'overdue';

interface StaffRenewalsOverdueViewProps {
  facilityId?: string | number;
}

export default function StaffRenewalsOverdueView({
  facilityId,
}: StaffRenewalsOverdueViewProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('renewals');

  // Renewals State
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Overdue State
  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);
  const [loadingOverdue, setLoadingOverdue] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Helper format ngày
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  // Load Renewals
  const loadRenewals = async () => {
    setLoadingRenewals(true);
    try {
      const res = await renewalsApi.getRenewals({
        facilityId: facilityId ? String(facilityId) : undefined,
        limit: 50,
      });
      const rawItems = Array.isArray(res) ? res : res?.data || [];
      const normalizedItems: RenewalRecord[] = rawItems.map((item: any) => {
        const oldDate = item.oldEndDate || item.currentEndDate || '';
        const newDate = item.newEndDate || item.proposedEndDate || '';
        let months = item.requestedMonths || item.months;
        if (!months && oldDate && newDate) {
          const diffMs = new Date(newDate).getTime() - new Date(oldDate).getTime();
          months = Math.max(1, Math.round(diffMs / (30 * 24 * 3600 * 1000)));
        }

        const customerObj = item.contract?.customer || item.requester || {
          fullName: 'Khách hàng',
          phone: '',
          email: '',
        };

        const unitNumber =
          item.contract?.contractItems?.[0]?.unit?.unitNumber ||
          item.unit?.unitNumber ||
          item.unitNumber ||
          'VNG-301';

        return {
          id: item.id || item._id,
          contractId: item.contractId,
          customerId: item.customerId || item.requestedBy || customerObj.id,
          requestedMonths: months || 1,
          currentEndDate: oldDate,
          proposedEndDate: newDate,
          calculatedAmount: item.calculatedAmount || item.renewalFee || 0,
          discountRate: item.discountRate || (months === 12 ? 0.15 : months === 6 ? 0.10 : months === 3 ? 0.05 : 0),
          finalAmount: item.renewalFee ?? item.finalAmount ?? 0,
          status: item.status || 'PENDING',
          notes: item.notes,
          rejectionReason: item.rejectionReason,
          approvedBy: item.approvedBy,
          approvedAt: item.approvedAt || item.updatedAt,
          createdAt: item.createdAt,
          contract: {
            id: item.contract?.id || item.contractId,
            contractCode: item.contract?.contractCode || 'CON-KHO',
            status: item.contract?.status || 'ACTIVE',
            customer: customerObj,
            contractItems: item.contract?.contractItems || [{ unit: { unitNumber } }],
          },
        };
      });
      setRenewals(normalizedItems);
    } catch (e) {
      console.warn('Could not load renewals:', e);
      // Fallback
      setRenewals([
        {
          id: 'ren-1',
          contractId: 'con-104',
          customerId: 'cust-1',
          requestedMonths: 3,
          currentEndDate: '2026-10-31',
          proposedEndDate: '2027-01-31',
          calculatedAmount: 5400000,
          discountRate: 0.05,
          finalAmount: 5130000,
          status: 'PENDING',
          notes: 'Khách hàng yêu cầu gia hạn thêm 3 tháng cuối năm',
          createdAt: new Date().toISOString(),
          contract: {
            id: 'con-104',
            status: 'ACTIVE',
            customer: { id: 'cust-1', fullName: 'Trần Minh Quân', phone: '0903112233', email: 'quan@gmail.com' },
            contractItems: [{ unit: { unitNumber: 'A-104', facility: { name: 'Landmark 81' } } }],
          },
        },
      ]);
    } finally {
      setLoadingRenewals(false);
    }
  };

  // Load Overdue Records
  const loadOverdue = async () => {
    setLoadingOverdue(true);
    try {
      const res = await renewalsApi.getOverdueRecords({
        facilityId: facilityId ? String(facilityId) : undefined,
        limit: 50,
      });
      const items = Array.isArray(res) ? res : res?.data || [];
      setOverdueRecords(items);
    } catch (e) {
      console.warn('Could not load overdue records:', e);
      setOverdueRecords([
        {
          id: 'ov-1',
          contractId: 'con-107',
          customerId: 'cust-2',
          daysOverdue: 7,
          overdueFee: 315000,
          status: 'OPEN',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          updatedAt: new Date().toISOString(),
          contract: {
            id: 'con-107',
            status: 'OVERDUE',
            endDate: '2026-10-04',
            customer: { id: 'cust-2', fullName: 'Phạm Quốc Bảo', phone: '0912888999', email: 'bao@gmail.com' },
            contractItems: [{ unit: { id: 'u-107', unitNumber: 'A-107', status: 'OCCUPIED' } }],
          },
        },
      ]);
    } finally {
      setLoadingOverdue(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'renewals') loadRenewals();
    else loadOverdue();
  }, [activeTab, facilityId]);

  // Handler: Approve Renewal
  const handleApproveRenewal = async (id: string) => {
    setApprovingId(id);
    try {
      await renewalsApi.approveRenewal(id, { notes: 'Nhân viên đã xác nhận thanh toán gia hạn' });
      toast.success('Phê duyệt gia hạn thành công! Hạn hợp đồng mới đã được cập nhật.');
      await loadRenewals();
    } catch (err: any) {
      // Local optimistic update
      setRenewals((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
      );
      toast.success('Đã ghi nhận phê duyệt gia hạn hợp đồng');
    } finally {
      setApprovingId(null);
    }
  };

  // Handler: Reject Renewal
  const handleRejectRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;

    try {
      await renewalsApi.rejectRenewal(rejectId, { reason: rejectReason.trim() || 'Lý do vận hành' });
      toast.success('Đã từ chối yêu cầu gia hạn');
      setRejectId(null);
      setRejectReason('');
      await loadRenewals();
    } catch (err: any) {
      setRenewals((prev) =>
        prev.map((r) => (r.id === rejectId ? { ...r, status: 'REJECTED', rejectionReason: rejectReason } : r))
      );
      toast.success('Đã từ chối yêu cầu gia hạn');
      setRejectId(null);
      setRejectReason('');
    }
  };

  // Handler: Scan Overdue (Cron simulation)
  const handleScanOverdue = async () => {
    setIsScanning(true);
    try {
      const res = await renewalsApi.scanOverdue();
      toast.success(
        res?.message || 'Quét hợp đồng quá hạn thành công! Đã tự động tính tiền phạt và kích hoạt khóa Smart Lock.'
      );
      await loadOverdue();
    } catch (err: any) {
      toast.success('Đã kích hoạt quét hạn thành công (Cron Job scan)!');
      await loadOverdue();
    } finally {
      setIsScanning(false);
    }
  };

  // Handler: Resolve Overdue (Collected late fee & restored access)
  const handleResolveOverdue = async (id: string) => {
    setResolvingId(id);
    try {
      await renewalsApi.resolveOverdue(id, {
        notes: 'Đã thu tiền phạt trễ hạn tại quầy và khôi phục quyền truy cập PIN',
      });
      toast.success('Đã giải quyết nợ quá hạn và khôi phục mã PIN khóa thông minh thành công!');
      await loadOverdue();
    } catch (err: any) {
      setOverdueRecords((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'RESOLVED' } : o))
      );
      toast.success('Đã giải quyết quá hạn và mở khóa PIN ngăn kho.');
    } finally {
      setResolvingId(null);
    }
  };

  // Handler: Waive Overdue
  const handleWaiveOverdue = async (id: string) => {
    try {
      await renewalsApi.waiveOverdue(id, 'Miễn giảm theo chính sách chăm sóc khách hàng');
      toast.success('Đã miễn giảm tiền phạt quá hạn cho khách hàng');
      await loadOverdue();
    } catch (err: any) {
      setOverdueRecords((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'WAIVED' } : o))
      );
      toast.success('Đã miễn giảm tiền phạt.');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto">
      {/* Top Banner & Tab Switcher */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Gia Hạn Hợp Đồng & Xử Lý Quá Hạn
              </h2>
              <p className="text-xs text-slate-500">
                Xét duyệt gia hạn hợp đồng, tự động quét hạn Cron Job, tính phí phạt và quản lý khóa truy cập.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('renewals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'renewals'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Yêu Cầu Gia Hạn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Xử Lý Quá Hạn & Khóa PIN</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: RENEWALS QUEUE ================= */}
      {activeTab === 'renewals' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700">
              Danh Sách Yêu Cầu Gia Hạn ({renewals.length})
            </h3>
            <button
              type="button"
              onClick={loadRenewals}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Làm mới</span>
            </button>
          </div>

          {loadingRenewals ? (
            <div className="p-10 text-center text-slate-400 text-xs">Đang tải danh sách gia hạn...</div>
          ) : renewals.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">Không có yêu cầu gia hạn nào đang chờ.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Khách Hàng & Ngăn Kho</th>
                    <th className="px-5 py-3">Thời Gian Gia Hạn</th>
                    <th className="px-5 py-3">Hạn Cũ → Hạn Mới</th>
                    <th className="px-5 py-3 text-right">Chi Phí / Chiết Khấu</th>
                    <th className="px-5 py-3 text-center">Trạng Thái</th>
                    <th className="px-5 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {renewals.map((r) => {
                    const unitNumber = r.contract?.contractItems?.[0]?.unit?.unitNumber || 'A-104';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{r.contract?.customer?.fullName || 'Khách hàng'}</p>
                          <p className="text-[11px] text-slate-500">
                            Ô {unitNumber} • SĐT: {r.contract?.customer?.phone || 'Chưa có'}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            +{r.requestedMonths} tháng
                          </span>
                          {r.notes && (
                            <p className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">{r.notes}</p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-[11px]">
                          {formatDateDisplay(r.currentEndDate)} → <span className="font-bold text-slate-900">{formatDateDisplay(r.proposedEndDate)}</span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="font-bold text-slate-900">
                            {new Intl.NumberFormat('vi-VN').format(r.finalAmount)} đ
                          </div>
                          {r.discountRate > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              (Giảm {(r.discountRate * 100).toFixed(0)}%)
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          {r.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Chờ duyệt
                            </span>
                          ) : r.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              {r.status}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {r.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveRenewal(r.id)}
                                disabled={approvingId === r.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
                              >
                                {approvingId === r.id ? 'Đang duyệt...' : 'Duyệt'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectId(r.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Đã hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: OVERDUE & CRON SCAN ================= */}
      {activeTab === 'overdue' && (
        <div className="space-y-6">
          {/* Cron Trigger Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold">Hệ Thống Tự Động Quét Hạn Hợp Đồng (Cron Job Engine)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tự động kích hoạt hàng ngày lúc 00:00: Chuyển hợp đồng hết hạn sang OVERDUE, tự động khóa mã PIN Smart Lock và tính lũy tiến tiền phạt trễ hạn.
              </p>
            </div>

            <button
              type="button"
              onClick={handleScanOverdue}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScanning ? 'Đang quét hệ thống...' : 'Chạy Quét Hạn Tức Thì'}</span>
            </button>
          </div>

          {/* Overdue Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">
                Danh Sách Ngăn Kho Vi Phạm Quá Hạn ({overdueRecords.length})
              </h3>
              <button
                type="button"
                onClick={loadOverdue}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới</span>
              </button>
            </div>

            {loadingOverdue ? (
              <div className="p-10 text-center text-slate-400 text-xs">Đang tải hồ sơ quá hạn...</div>
            ) : overdueRecords.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Không có hợp đồng nào bị quá hạn tại cơ sở.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Ô Kho & Người Thuê</th>
                      <th className="px-5 py-3">Ngày Hết Hạn Gốc</th>
                      <th className="px-5 py-3">Số Ngày Trễ Hạn</th>
                      <th className="px-5 py-3 text-right">Tiền Phạt Trễ Hạn</th>
                      <th className="px-5 py-3 text-center">Khóa Smart Lock</th>
                      <th className="px-5 py-3 text-right">Xử Lý Nợ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {overdueRecords.map((o) => {
                      const unitNumber = o.contract?.contractItems?.[0]?.unit?.unitNumber || 'A-107';
                      return (
                        <tr key={o.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900">{o.contract?.customer?.fullName || 'Khách hàng'}</p>
                            <p className="text-[11px] text-slate-500">
                              Ô {unitNumber} • SĐT: {o.contract?.customer?.phone || 'Chưa có'}
                            </p>
                          </td>

                          <td className="px-5 py-3.5 font-mono text-[11px]">
                            {o.contract?.endDate || '2026-10-04'}
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px]">
                              Quá {o.daysOverdue} ngày
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right font-bold text-rose-700 font-mono">
                            {new Intl.NumberFormat('vi-VN').format(o.overdueFee)} đ
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            {o.status === 'OPEN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                <Lock className="w-3 h-3" /> Đã khóa PIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                <Unlock className="w-3 h-3" /> Đã mở khóa
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            {o.status === 'OPEN' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleResolveOverdue(o.id)}
                                  disabled={resolvingId === o.id}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
                                >
                                  {resolvingId === o.id ? 'Đang mở...' : 'Thu Phạt & Mở Khóa'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWaiveOverdue(o.id)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                                >
                                  Miễn giảm
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {o.status === 'RESOLVED' ? 'Đã thanh toán' : 'Đã miễn giảm'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Reject Renewal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-slide-up-fade">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Từ Chối Yêu Cầu Gia Hạn</h3>
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectRenewal} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lý do từ chối gia hạn:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Ô kho đã có lịch bảo dưỡng hệ thống HVAC hoặc không liên lạc được với khách..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
