'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  Play,
  Search,
  DoorClosed,
  Camera,
  Eye,
  KeyRound,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { supportApi } from '@/lib/api/support';
import { operationsApi } from '@/lib/api/operations';
import {
  renewalsApi,
  RenewalRecord,
  OverdueRecord,
} from '@/lib/api/renewals';
import {
  handoversApi,
  HandoverCheckOutContract,
  CheckOutResponse,
} from '@/lib/api/handovers';

type SubTab = 'checkout' | 'renewals' | 'overdue' | 'liquidation';

interface ManagerRentalOperationsViewProps {
  facilityId?: string | number;
  initialTab?: SubTab;
}

const formatVND = (amount?: number | string) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)} đ`;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
};

export default function ManagerRentalOperationsView({
  facilityId,
  initialTab = 'checkout',
}: ManagerRentalOperationsViewProps) {
  const [activeTab, setActiveTab] = useState<SubTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Tab 1: Check-out
  const [pendingCheckouts, setPendingCheckouts] = useState<any[]>([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(false);
  const [searchContractId, setSearchContractId] = useState('');
  const [isSearchingContract, setIsSearchingContract] = useState(false);
  const [contractCheckoutData, setContractCheckoutData] =
    useState<HandoverCheckOutContract | null>(null);
  const [selectedCheckoutReq, setSelectedCheckoutReq] = useState<any | null>(null);
  const [checkOutCondition, setCheckOutCondition] = useState(
    'Kho sạch sẽ, tường và sàn nguyên vẹn',
  );
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [damageFee, setDamageFee] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [feeTypes, setFeeTypes] = useState<Array<{ id: string; label: string; price: number }>>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [customSurcharge, setCustomSurcharge] = useState(0);
  const [unitCondition, setUnitCondition] = useState<'AVAILABLE' | 'UNDER_MAINTENANCE'>('AVAILABLE');
  const [newSmartPin, setNewSmartPin] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [refundDeposit, setRefundDeposit] = useState(true);
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
  const [checkOutResult, setCheckOutResult] = useState<CheckOutResponse | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Tab 2: Renewals
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Tab 3: Overdue
  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);
  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueFilter, setOverdueFilter] = useState<'ALL' | 'OPEN' | 'REQUESTED' | 'CLOSED'>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [requestingLiqId, setRequestingLiqId] = useState<string | null>(null);

  // Tab 4: Liquidation
  const [liquidations, setLiquidations] = useState<OverdueRecord[]>([]);
  const [loadingLiquidations, setLoadingLiquidations] = useState(false);
  const [selectedLiq, setSelectedLiq] = useState<OverdueRecord | null>(null);
  const [liqCondition, setLiqCondition] = useState('Đã kiểm kê, đóng gói đồ tồn và niêm phong thu hồi kho');
  const [liqNotes, setLiqNotes] = useState('');
  const [liqPhotos, setLiqPhotos] = useState<string[]>([]);
  const [liqUploadingPhoto, setLiqUploadingPhoto] = useState(false);
  const [liqNewPin, setLiqNewPin] = useState('');
  const [liqUnitCondition, setLiqUnitCondition] = useState<'AVAILABLE' | 'UNDER_MAINTENANCE'>('AVAILABLE');
  const [isSubmittingLiq, setIsSubmittingLiq] = useState(false);

  const facStr = facilityId ? String(facilityId) : undefined;

  useEffect(() => {
    operationsApi
      .getFeeTypes()
      .then((types) => {
        if (Array.isArray(types)) {
          const active = types
            .filter(
              (t: any) =>
                t.status !== 'INACTIVE' &&
                t.code !== 'LATE_FEE' &&
                t.code !== 'LATE_RETURN' &&
                t.code !== 'OTHER',
            )
            .map((t: any) => ({
              id: String(t.code || t.id || t.name),
              label: String(t.name || t.code),
              price: Number(t.defaultAmount || 0),
            }));
          setFeeTypes(active);
        }
      })
      .catch(() => setFeeTypes([]));
  }, []);

  const resetInspectionForm = () => {
    setDamageFee(0);
    setCleaningFee(0);
    setSelectedFeeIds([]);
    setCustomSurcharge(0);
    setNewSmartPin('');
    setRefundMethod('CASH');
    setRefundDeposit(true);
    setUnitCondition('AVAILABLE');
  };

  const generatePin = (oldPin?: string) => {
    let candidate = '';
    for (let i = 0; i < 10; i++) {
      candidate = String(100000 + Math.floor(Math.random() * 900000));
      if (candidate !== String(oldPin || '').trim()) break;
    }
    return candidate;
  };

  const loadPendingCheckouts = useCallback(async () => {
    setLoadingCheckouts(true);
    try {
      const contractsRes: any = await api.get('/contracts');
      const list = Array.isArray(contractsRes) ? contractsRes : contractsRes?.data || [];
      const rows = list
        .filter((c: any) => {
          const cFac = String(
            c.contractItems?.[0]?.unit?.facility?.id ||
              c.contractItems?.[0]?.unit?.facilityId ||
              c.reservation?.facilityId ||
              '',
          );
          if (facStr && cFac && cFac !== facStr) return false;
          if (c.status === 'COMPLETED' || c.status === 'TERMINATED') return false;
          return Boolean(
            c.returnRequestedAt ||
              c.returnDate ||
              c.status === 'CHECKOUT_REQUESTED' ||
              c.status === 'TERMINATING',
          );
        })
        .map((c: any) => ({
          contractId: String(c.id || c._id),
          contractCode: c.contractCode || '--',
          unitNumber: c.contractItems?.[0]?.unit?.unitNumber || '--',
          customerName: c.customer?.fullName || '--',
          customerPhone: c.customer?.phone || '--',
          requestedMoveOutDate: c.returnDate || null,
          returnTimeSlot: c.returnTimeSlot || null,
          depositAmount: Number(c.contractItems?.[0]?.depositAmount ?? c.depositAmount ?? 0),
          status: c.status,
          isOverdue:
            c.status === 'OVERDUE' ||
            (c.endDate ? new Date(c.endDate).getTime() < Date.now() : false),
          photos: Array.isArray(c.contractItems?.[0]?.handoverRecords?.[0]?.photos)
            ? c.contractItems[0].handoverRecords[0].photos
            : [],
        }));
      setPendingCheckouts(rows);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách trả kho');
      setPendingCheckouts([]);
    } finally {
      setLoadingCheckouts(false);
    }
  }, [facStr]);

  const loadRenewals = useCallback(async () => {
    setLoadingRenewals(true);
    try {
      const res = await renewalsApi.getRenewals({ facilityId: facStr, limit: 50 });
      const rawItems = Array.isArray(res) ? res : res?.data || [];
      const normalized: RenewalRecord[] = rawItems.map((item: any) => {
        const oldDate = item.oldEndDate || item.currentEndDate || '';
        const newDate = item.newEndDate || item.proposedEndDate || '';
        let months = item.requestedMonths || item.months;
        if (!months && oldDate && newDate) {
          const diffMs = new Date(newDate).getTime() - new Date(oldDate).getTime();
          months = Math.max(1, Math.round(diffMs / (30 * 24 * 3600 * 1000)));
        }
        return {
          id: item.id || item._id,
          contractId: item.contractId,
          customerId: item.customerId || item.requestedBy || '',
          requestedMonths: months || 1,
          currentEndDate: oldDate,
          proposedEndDate: newDate,
          calculatedAmount: item.calculatedAmount || item.renewalFee || 0,
          discountRate: item.discountRate || 0,
          finalAmount: item.renewalFee ?? item.finalAmount ?? 0,
          status: item.status || 'PENDING',
          notes: item.notes,
          rejectionReason: item.rejectionReason,
          createdAt: item.createdAt,
          contract: item.contract,
        };
      });
      setRenewals(normalized);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách gia hạn');
      setRenewals([]);
    } finally {
      setLoadingRenewals(false);
    }
  }, [facStr]);

  const loadOverdue = useCallback(async () => {
    setLoadingOverdue(true);
    try {
      const res = await renewalsApi.getOverdueRecords({ facilityId: facStr, limit: 100 });
      const items = Array.isArray(res) ? res : res?.data || [];
      setOverdueRecords(items);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách kho quá hạn');
      setOverdueRecords([]);
    } finally {
      setLoadingOverdue(false);
    }
  }, [facStr]);

  const loadLiquidations = useCallback(async () => {
    setLoadingLiquidations(true);
    try {
      const res = await renewalsApi.getLiquidations({ facilityId: facStr });
      const list = Array.isArray(res) ? res : [];
      setLiquidations(list);
      setSelectedLiq((prev) => (prev ? list.find((l) => l.id === prev.id) || null : null));
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách thanh lý');
      setLiquidations([]);
    } finally {
      setLoadingLiquidations(false);
    }
  }, [facStr]);

  const refreshActiveTab = () => {
    if (activeTab === 'checkout') loadPendingCheckouts();
    else if (activeTab === 'renewals') loadRenewals();
    else if (activeTab === 'overdue') loadOverdue();
    else loadLiquidations();
  };

  useEffect(() => {
    refreshActiveTab();
  }, [activeTab, facStr]);

  // Preload badge counts cleanly once
  useEffect(() => {
    loadPendingCheckouts();
    loadRenewals();
    loadOverdue();
    loadLiquidations();
  }, [facStr]);

  // Check-out handlers
  const handleLookupContract = async (targetId: string, reqRow?: any) => {
    const cleanId = targetId.trim();
    if (!cleanId) {
      toast.error('Nhập ID hoặc mã hợp đồng để tra cứu');
      return;
    }
    setIsSearchingContract(true);
    setCheckOutResult(null);
    setSelectedCheckoutReq(reqRow || null);
    resetInspectionForm();
    setCheckOutNotes(reqRow?.returnTimeSlot ? `Khung giờ trả: ${reqRow.returnTimeSlot}` : '');
    try {
      const data = await handoversApi.getContractForCheckOut(cleanId);
      setContractCheckoutData(data);
    } catch (err: any) {
      toast.error(err?.message || 'Không tìm thấy hợp đồng trả kho');
      setContractCheckoutData(null);
    } finally {
      setIsSearchingContract(false);
    }
  };

  const settlement = useMemo(() => {
    const fin = contractCheckoutData?.financialSummary;
    const totalDeposit = Number(fin?.totalDepositAmount || 0);
    const unpaidExtra = Number(fin?.unpaidExtraChargesAmount || 0);
    const overdueFine = Number(fin?.overdueFineAmount ?? fin?.overdueInfo?.calculatedOverdueFine ?? 0);
    const checklistTotal = selectedFeeIds.reduce((sum, id) => {
      const f = feeTypes.find((item) => item.id === id);
      return sum + (f ? f.price : 0);
    }, 0);
    const totalDeductions =
      unpaidExtra +
      overdueFine +
      Math.max(0, Number(damageFee) || 0) +
      Math.max(0, Number(cleaningFee) || 0) +
      Math.max(0, Number(customSurcharge) || 0) +
      checklistTotal;
    const netRefund = Math.max(0, totalDeposit - totalDeductions);
    const extraPayable = Math.max(0, totalDeductions - totalDeposit);
    return { totalDeposit, unpaidExtra, overdueFine, totalDeductions, netRefund, extraPayable };
  }, [contractCheckoutData, selectedFeeIds, feeTypes, damageFee, cleaningFee, customSurcharge]);

  const handleSubmitCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractCheckoutData) return;
    if (!/^\d{6}$/.test(newSmartPin.trim())) {
      toast.error('Nhập hoặc tạo mã PIN Smart Lock mới gồm 6 chữ số');
      return;
    }
    setIsSubmittingCheckOut(true);
    try {
      const checklistTotal = selectedFeeIds.reduce((sum, id) => {
        const f = feeTypes.find((item) => item.id === id);
        return sum + (f ? f.price : 0);
      }, 0);
      const noteWithRefund = [
        checkOutNotes.trim(),
        refundDeposit
          ? `Hoàn cọc: ${refundMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}`
          : null,
      ]
        .filter(Boolean)
        .join(' | ');
      const res = await handoversApi.checkOut({
        contractId: contractCheckoutData.contract.id,
        condition: checkOutCondition.trim() || 'Đã nghiệm thu trả kho',
        notes: noteWithRefund || undefined,
        damageFee: Number(damageFee) + Number(customSurcharge) + checklistTotal,
        cleaningFee: Number(cleaningFee),
        refundDeposit,
        unitCondition,
        newAccessCode: newSmartPin.trim(),
      });
      setCheckOutResult(res);
      toast.success('Hoàn tất bàn giao trả kho');
      loadPendingCheckouts();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hoàn tất Check-out');
    } finally {
      setIsSubmittingCheckOut(false);
    }
  };

  // Renewal handlers
  const handleApproveRenewal = async (id: string) => {
    setApprovingId(id);
    try {
      await renewalsApi.approveRenewal(id, { notes: 'Quản lý chi nhánh phê duyệt gia hạn' });
      toast.success('Đã phê duyệt gia hạn');
      await loadRenewals();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể phê duyệt gia hạn');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;
    try {
      await renewalsApi.rejectRenewal(rejectId, {
        reason: rejectReason.trim() || 'Không đủ điều kiện gia hạn',
      });
      toast.success('Đã từ chối yêu cầu gia hạn');
      setRejectId(null);
      setRejectReason('');
      await loadRenewals();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể từ chối yêu cầu gia hạn');
    }
  };

  // Overdue handlers
  const handleScanOverdue = async () => {
    setIsScanning(true);
    try {
      const res = await renewalsApi.scanOverdue();
      toast.success(res?.message || 'Đã quét hợp đồng quá hạn');
      await loadOverdue();
    } catch (err: any) {
      toast.error(err?.message || 'Quét quá hạn thất bại');
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolveOverdue = async (id: string) => {
    setResolvingId(id);
    try {
      await renewalsApi.resolveOverdue(id, {
        notes: 'Đã thu tiền phạt trễ hạn và khôi phục quyền truy cập',
      });
      toast.success('Đã xác nhận thu phạt & mở lại PIN');
      await loadOverdue();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xử lý bản ghi quá hạn');
    } finally {
      setResolvingId(null);
    }
  };

  const handleWaiveOverdue = async (id: string) => {
    try {
      await renewalsApi.waiveOverdue(id, 'Quản lý chi nhánh miễn giảm phí phạt');
      toast.success('Đã miễn giảm phí phạt');
      await loadOverdue();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể miễn giảm phí phạt');
    }
  };

  const handleRequestLiquidation = async (o: OverdueRecord) => {
    setRequestingLiqId(o.id);
    try {
      const res = await renewalsApi.requestLiquidation(o.id);
      toast.success(res?.message || 'Đã khóa PIN và gửi lệnh thanh lý cho nhân viên');
      await Promise.all([loadOverdue(), loadLiquidations()]);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi yêu cầu thanh lý');
    } finally {
      setRequestingLiqId(null);
    }
  };

  // Liquidation handlers
  const handleUploadLiqPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setLiqUploadingPhoto(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const res = await supportApi.uploadPhoto(f);
        if (res?.url) urls.push(res.url);
      }
      if (urls.length > 0) {
        setLiqPhotos((prev) => [...prev, ...urls]);
        toast.success(`Đã tải lên ${urls.length} ảnh`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải ảnh');
    } finally {
      setLiqUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleCompleteLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiq) return;
    const cleanPin = liqNewPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      toast.error('Nhập hoặc tạo mã PIN Smart Lock mới gồm 6 chữ số');
      return;
    }
    const oldPin = selectedLiq.contract?.contractItems?.[0]?.accessCode;
    if (oldPin && cleanPin === oldPin) {
      toast.error(`Mã PIN mới phải khác mã PIN cũ (${oldPin})`);
      return;
    }
    if (!liqCondition.trim()) {
      toast.error('Nhập hiện trạng kiểm kê đồ đạc tồn kho');
      return;
    }
    setIsSubmittingLiq(true);
    try {
      const res = await renewalsApi.completeLiquidation(selectedLiq.id, {
        condition: liqCondition.trim(),
        notes: liqNotes.trim() || undefined,
        photos: liqPhotos,
        newAccessCode: cleanPin,
        unitCondition: liqUnitCondition,
      });
      toast.success(res?.message || 'Đã hoàn tất thanh lý kho');
      setLiqNotes('');
      setLiqPhotos([]);
      setLiqNewPin('');
      await Promise.all([loadLiquidations(), loadOverdue()]);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hoàn tất thanh lý');
    } finally {
      setIsSubmittingLiq(false);
    }
  };

  const filteredOverdue = useMemo(() => {
    return overdueRecords.filter((o) => {
      const st = String(o.status || 'OPEN').toUpperCase();
      const liqSt = String(o.liquidationStatus || '').toUpperCase();
      if (overdueFilter === 'OPEN' && (st === 'RESOLVED' || st === 'WAIVED' || liqSt === 'REQUESTED' || liqSt === 'COMPLETED')) {
        return false;
      }
      if (overdueFilter === 'REQUESTED' && liqSt !== 'REQUESTED') return false;
      if (overdueFilter === 'CLOSED' && st !== 'RESOLVED' && st !== 'WAIVED' && liqSt !== 'COMPLETED') {
        return false;
      }
      if (overdueSearch.trim()) {
        const q = overdueSearch.trim().toLowerCase();
        const name = String(o.contract?.customer?.fullName || '').toLowerCase();
        const phone = String(o.contract?.customer?.phone || '').toLowerCase();
        const unit = String(o.contract?.contractItems?.[0]?.unit?.unitNumber || '').toLowerCase();
        const code = String(o.contract?.contractCode || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || unit.includes(q) || code.includes(q);
      }
      return true;
    });
  }, [overdueRecords, overdueFilter, overdueSearch]);

  const pendingRenewalsCount = renewals.filter((r) => r.status === 'PENDING').length;
  const openOverdueCount = overdueRecords.filter(
    (o) => o.status !== 'RESOLVED' && o.status !== 'WAIVED' && o.liquidationStatus !== 'COMPLETED',
  ).length;
  const pendingLiqCount = liquidations.filter((l) => l.liquidationStatus !== 'COMPLETED').length;

  return (
    <div className="space-y-4 w-full">
      {/* Compact Header & Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <DoorClosed className="w-4 h-4" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Quản lí kho thuê</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            {[
              { id: 'checkout' as SubTab, label: 'Trả kho', count: pendingCheckouts.length },
              { id: 'renewals' as SubTab, label: 'Gia hạn', count: pendingRenewalsCount },
              { id: 'overdue' as SubTab, label: 'Kho quá hạn', count: openOverdueCount },
              { id: 'liquidation' as SubTab, label: 'Thanh lý', count: pendingLiqCount },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overdue' && (
            <button
              type="button"
              onClick={handleScanOverdue}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScanning ? 'Đang quét...' : 'Quét quá hạn'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshActiveTab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TRẢ KHO */}
      {activeTab === 'checkout' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupContract(searchContractId);
            }}
            className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchContractId}
                onChange={(e) => setSearchContractId(e.target.value)}
                placeholder="Nhập ID hoặc mã hợp đồng để kiểm tra trả kho..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingContract}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {isSearchingContract ? 'Đang tải...' : 'Tra cứu'}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loadingCheckouts ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách trả kho...</div>
            ) : pendingCheckouts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Không có yêu cầu trả kho nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Hợp đồng / Ô kho</th>
                      <th className="px-4 py-2.5">Khách hàng</th>
                      <th className="px-4 py-2.5">Lịch trả</th>
                      <th className="px-4 py-2.5 text-right">Tiền cọc</th>
                      <th className="px-4 py-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingCheckouts.map((row) => (
                      <tr key={row.contractId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-900">{row.contractCode}</div>
                          <div className="text-[11px] text-blue-700 font-semibold">Ô {row.unitNumber}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-800">{row.customerName}</div>
                          <div className="text-[11px] text-slate-500">{row.customerPhone}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-slate-700">
                            {formatDate(row.requestedMoveOutDate)}
                            {row.returnTimeSlot ? ` • ${row.returnTimeSlot}` : ''}
                          </div>
                          {row.isOverdue && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                              Quá hạn
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          {formatVND(row.depositAmount)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchContractId(row.contractId);
                              handleLookupContract(row.contractId, row);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Nghiệm thu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {contractCheckoutData && !checkOutResult && (
            <form
              onSubmit={handleSubmitCheckOut}
              className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Hồ sơ: {contractCheckoutData.contract.contractCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setContractCheckoutData(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Khách hàng</span>
                    <span className="font-bold text-slate-900">{contractCheckoutData.customer?.fullName || '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại</span>
                    <span className="font-bold text-slate-900">{contractCheckoutData.customer?.phone || '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ô kho</span>
                    <span className="font-bold text-blue-700">
                      {contractCheckoutData.units?.map((u) => u.unitNumber).join(', ') || '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Hạn hợp đồng</span>
                    <span className="font-bold text-slate-900">
                      {formatDate(contractCheckoutData.contract.endDate)}
                    </span>
                  </div>
                </div>

                {selectedCheckoutReq?.photos?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCheckoutReq.photos.map((url: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                      >
                        <img src={url} alt={`checkout-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 block">Hiện trạng bàn giao</label>
                  <input
                    type="text"
                    value={checkOutCondition}
                    onChange={(e) => setCheckOutCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                  />
                  <label className="font-bold text-slate-700 block">Ghi chú</label>
                  <input
                    type="text"
                    value={checkOutNotes}
                    onChange={(e) => setCheckOutNotes(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phí hư hại (đ)</label>
                    <input
                      type="number"
                      min={0}
                      value={damageFee}
                      onChange={(e) => setDamageFee(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phí vệ sinh (đ)</label>
                    <input
                      type="number"
                      min={0}
                      value={cleaningFee}
                      onChange={(e) => setCleaningFee(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                {feeTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {feeTypes.map((ft) => {
                      const active = selectedFeeIds.includes(ft.id);
                      return (
                        <button
                          key={ft.id}
                          type="button"
                          onClick={() =>
                            setSelectedFeeIds((prev) =>
                              prev.includes(ft.id) ? prev.filter((x) => x !== ft.id) : [...prev, ft.id],
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            active
                              ? 'bg-blue-50 border-blue-400 text-blue-800'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {ft.label} (+{formatVND(ft.price)})
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Trạng thái ô kho sau trả</label>
                    <select
                      value={unitCondition}
                      onChange={(e) => setUnitCondition(e.target.value as 'AVAILABLE' | 'UNDER_MAINTENANCE')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
                      <option value="UNDER_MAINTENANCE">Bảo trì (MAINTENANCE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mã PIN mới (6 số)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={newSmartPin}
                        onChange={(e) => setNewSmartPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6 chữ số"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setNewSmartPin(generatePin())}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tiền cọc giữ</span>
                    <span className="font-bold">{formatVND(settlement.totalDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phạt trễ + phụ phí khấu trừ</span>
                    <span className="font-bold text-rose-600">-{formatVND(settlement.totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-sm">
                    <span className="font-extrabold text-slate-900">Hoàn cọc ròng</span>
                    <span className="font-extrabold text-emerald-700">{formatVND(settlement.netRefund)}</span>
                  </div>
                  {settlement.extraPayable > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Khách cần đóng thêm</span>
                      <span>{formatVND(settlement.extraPayable)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundDeposit}
                      onChange={(e) => setRefundDeposit(e.target.checked)}
                    />
                    <span>Hoàn cọc ({refundMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'})</span>
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as 'CASH' | 'BANK_TRANSFER')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <option value="CASH">Tiền mặt</option>
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCheckOut}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {isSubmittingCheckOut ? 'Đang xử lý...' : 'Xác nhận hoàn tất Check-out'}
                </button>
              </div>
            </form>
          )}

          {checkOutResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Đã hoàn tất trả kho {checkOutResult.contract?.contractCode} • Hoàn cọc:{' '}
                  {formatVND(checkOutResult.financialSettlement?.refundDepositAmount)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckOutResult(null);
                  setContractCheckoutData(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GIA HẠN */}
      {activeTab === 'renewals' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loadingRenewals ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang tải yêu cầu gia hạn...</div>
          ) : renewals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Không có yêu cầu gia hạn nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Hợp đồng / Ô kho</th>
                    <th className="px-4 py-2.5">Khách hàng</th>
                    <th className="px-4 py-2.5">Gia hạn</th>
                    <th className="px-4 py-2.5 text-right">Phí gia hạn</th>
                    <th className="px-4 py-2.5 text-center">Trạng thái</th>
                    <th className="px-4 py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {renewals.map((r) => {
                    const unit = r.contract?.contractItems?.[0]?.unit?.unitNumber || '--';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-900">{r.contract?.contractCode || r.contractId}</div>
                          <div className="text-[11px] text-blue-700 font-semibold">Ô {unit}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-800">{r.contract?.customer?.fullName || '--'}</div>
                          <div className="text-[11px] text-slate-500">{r.contract?.customer?.phone || '--'}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold">+{r.requestedMonths} tháng</div>
                          <div className="text-[11px] text-slate-500">
                            {formatDate(r.currentEndDate)} → {formatDate(r.proposedEndDate)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          {formatVND(r.finalAmount)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : r.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {r.status === 'PENDING' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                disabled={approvingId === r.id}
                                onClick={() => handleApproveRenewal(r.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectId(r.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">--</span>
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

      {/* TAB 3: KHO QUÁ HẠN */}
      {activeTab === 'overdue' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={overdueSearch}
                onChange={(e) => setOverdueSearch(e.target.value)}
                placeholder="Tìm theo ô kho, mã HĐ, tên khách, SĐT..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={overdueFilter}
              onChange={(e) => setOverdueFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              <option value="ALL">Tất cả ({overdueRecords.length})</option>
              <option value="OPEN">Chờ xử lý</option>
              <option value="REQUESTED">Đã gửi lệnh thanh lý</option>
              <option value="CLOSED">Đã xử lý / Đã thanh lý</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loadingOverdue ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách kho quá hạn...</div>
            ) : filteredOverdue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Không có hợp đồng quá hạn phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Ô kho & Khách hàng</th>
                      <th className="px-4 py-2.5">Hết hạn</th>
                      <th className="px-4 py-2.5">Trễ</th>
                      <th className="px-4 py-2.5 text-right">Phạt</th>
                      <th className="px-4 py-2.5 text-center">Smart Lock</th>
                      <th className="px-4 py-2.5 text-right">Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOverdue.map((o) => {
                      const unitNumber = o.contract?.contractItems?.[0]?.unit?.unitNumber || '--';
                      const overdueDays = o.overdueDays ?? o.daysOverdue ?? 0;
                      const thresholdDays = o.liquidationThresholdDays ?? 7;
                      const isEligibleLiq = overdueDays > thresholdDays;
                      const pinRevoked =
                        o.liquidationStatus === 'REQUESTED' ||
                        o.contract?.contractItems?.[0]?.accessCodeStatus === 'REVOKED';
                      const isClosed =
                        o.status === 'RESOLVED' ||
                        o.status === 'WAIVED' ||
                        o.liquidationStatus === 'COMPLETED';

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-900">
                              {o.contract?.customer?.fullName || '--'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Ô {unitNumber} • {o.contract?.customer?.phone || '--'}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{formatDate(o.contract?.endDate)}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                              {overdueDays} ngày
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-rose-600">
                            {formatVND(o.overdueFee)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {pinRevoked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                                <Lock className="w-3 h-3" /> Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                <Unlock className="w-3 h-3" /> Mở
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {o.liquidationStatus === 'COMPLETED' ? (
                              <span className="text-[11px] font-bold text-emerald-700">Đã thanh lý</span>
                            ) : o.liquidationStatus === 'REQUESTED' ? (
                              <span className="text-[11px] font-bold text-amber-700">Chờ NV thanh lý</span>
                            ) : isClosed ? (
                              <span className="text-[11px] font-bold text-slate-500">{o.status}</span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                {isEligibleLiq && (
                                  <button
                                    type="button"
                                    disabled={requestingLiqId === o.id}
                                    onClick={() => handleRequestLiquidation(o)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    {requestingLiqId === o.id ? 'Đang gửi...' : 'Yêu cầu thanh lý'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={resolvingId === o.id}
                                  onClick={() => handleResolveOverdue(o.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                                >
                                  Đã thu phạt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWaiveOverdue(o.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                                >
                                  Miễn phạt
                                </button>
                              </div>
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

      {/* TAB 4: THANH LÝ */}
      {activeTab === 'liquidation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`${selectedLiq ? 'lg:col-span-6' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200 overflow-hidden`}>
            {loadingLiquidations ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách thanh lý...</div>
            ) : liquidations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Không có đơn thanh lý kho nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Ô kho / Khách hàng</th>
                      <th className="px-4 py-2.5">Quá hạn</th>
                      <th className="px-4 py-2.5 text-center">Trạng thái</th>
                      <th className="px-4 py-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liquidations.map((liq) => {
                      const unit = liq.contract?.contractItems?.[0]?.unit?.unitNumber || '--';
                      const done = liq.liquidationStatus === 'COMPLETED';
                      return (
                        <tr
                          key={liq.id}
                          className={`hover:bg-slate-50/70 ${selectedLiq?.id === liq.id ? 'bg-rose-50/40' : ''}`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-900">
                              Ô {unit} • {liq.contract?.customer?.fullName || '--'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {liq.contract?.contractCode || liq.contractId}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-bold text-rose-600">
                            {liq.overdueDays ?? liq.daysOverdue ?? 0} ngày
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                done ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {done ? 'Đã thanh lý' : 'Chờ xử lý'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLiq(liq);
                                setLiqNewPin(generatePin(liq.contract?.contractItems?.[0]?.accessCode));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer"
                            >
                              {done ? 'Xem' : 'Xử lý'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedLiq && (
            <form
              onSubmit={handleCompleteLiquidation}
              className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-extrabold text-slate-900">
                  Thanh lý Ô {selectedLiq.contract?.contractItems?.[0]?.unit?.unitNumber || '--'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLiq(null)}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              {selectedLiq.liquidationStatus === 'COMPLETED' ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                  Kho đã được thanh lý lúc {formatDate(selectedLiq.updatedAt)}.
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hiện trạng kiểm kê</label>
                    <input
                      type="text"
                      value={liqCondition}
                      onChange={(e) => setLiqCondition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={liqNotes}
                      onChange={(e) => setLiqNotes(e.target.value)}
                      placeholder="Ghi chú biên bản thanh lý..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Trạng thái ô kho</label>
                      <select
                        value={liqUnitCondition}
                        onChange={(e) =>
                          setLiqUnitCondition(e.target.value as 'AVAILABLE' | 'UNDER_MAINTENANCE')
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
                        <option value="UNDER_MAINTENANCE">Bảo trì (MAINTENANCE)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mã PIN mới (6 số)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          maxLength={6}
                          value={liqNewPin}
                          onChange={(e) => setLiqNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLiqNewPin(generatePin(selectedLiq.contract?.contractItems?.[0]?.accessCode))
                          }
                          className="px-2.5 py-2 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{liqUploadingPhoto ? 'Đang tải ảnh...' : 'Tải ảnh kiểm kê'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUploadLiqPhotos}
                        className="hidden"
                      />
                    </label>
                    {liqPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {liqPhotos.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`liq-${idx}`}
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLiq}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {isSubmittingLiq ? 'Đang xử lý...' : 'Hoàn tất thanh lý & mở lại kho'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}

      {/* Reject Renewal Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectRenewal}
            className="bg-white rounded-2xl border border-slate-200 p-4 w-full max-w-md space-y-3 text-xs"
          >
            <h3 className="text-sm font-extrabold text-slate-900">Từ chối yêu cầu gia hạn</h3>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="preview"
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
