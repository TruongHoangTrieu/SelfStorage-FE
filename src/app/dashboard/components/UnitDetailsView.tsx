'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { customerUnitsApi } from '../../../lib/api/customerUnits';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Key,
  ShieldCheck,
  Clock,
  Thermometer,
  Droplets,
  AlertCircle,
  FileText,
  UserPlus,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  Lock,
  DoorOpen,
  Send,
  Trash2,
  HelpCircle,
  Download,
  KeyRound,
  Check,
  Boxes,
  History,
  Filter,
  Smartphone,
  Radio,
} from 'lucide-react';
import { CustomerUnit, AccessLog } from '../types';
import StoredItemsTab from './StoredItemsTab';
import ContractSignModal from './ContractSignModal';

interface UnitDetailsViewProps {
  unit: CustomerUnit;
  onBack: () => void;
  onOpenGuestPass: (unit: CustomerUnit) => void;
  onOpenExtendLease: (unit: CustomerUnit) => void;
  onOpenUpgradeUnit: (unit: CustomerUnit) => void;
  onOpenReportIncident: (unit: CustomerUnit) => void;
}

export default function UnitDetailsView({
  unit,
  onBack,
  onOpenGuestPass,
  onOpenExtendLease,
  onOpenUpgradeUnit,
  onOpenReportIncident,
}: UnitDetailsViewProps) {
  // Tabs: 'overview' | 'items' | 'access' | 'logs' | 'history' (Flow 3)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'items' | 'access' | 'logs' | 'history'>('overview');
  const [isContractSignOpen, setIsContractSignOpen] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<'idle' | 'unlocking' | 'unlocked'>('idle');
  const [fetchedPin, setFetchedPin] = useState<string>(unit.mainPin || '682914');
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Access Logs State (Flow 3)
  const [logs, setLogs] = useState<AccessLog[]>(unit.accessLogs || []);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'PIN_CODE' | 'RFID_CARD' | 'REMOTE_APP'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'DENIED'>('ALL');

  // Helper kiểm tra phương thức ra vào linh hoạt (hỗ trợ cả tiếng Anh lẫn tiếng Việt)
  const matchesMethod = useCallback(
    (accessMethod: string = '', filter: 'ALL' | 'PIN_CODE' | 'RFID_CARD' | 'REMOTE_APP'): boolean => {
      if (filter === 'ALL') return true;
      const m = String(accessMethod || '').toUpperCase();
      if (filter === 'REMOTE_APP') {
        return (
          m.includes('APP') ||
          m.includes('REMOTE') ||
          m.includes('SMART') ||
          m.includes('WEB') ||
          m.includes('TỪ XA') ||
          m.includes('TU XA') ||
          m.includes('ỨNG DỤNG') ||
          m.includes('UNG DUNG')
        );
      }
      if (filter === 'RFID_CARD') {
        return (
          m.includes('RFID') ||
          m.includes('THẺ') ||
          m.includes('THE') ||
          m.includes('QUẸT') ||
          m.includes('QUET')
        );
      }
      if (filter === 'PIN_CODE') {
        return (
          m.includes('PIN') ||
          m.includes('MÃ SỐ') ||
          m.includes('MA SO') ||
          m.includes('BÀN PHÍM') ||
          m.includes('BAN PHIM') ||
          m.includes('MÃ')
        );
      }
      return true;
    },
    []
  );

  const loadAccessLogs = useCallback(async () => {
    if (!unit.rawContractId || !unit.rawUnitId) return;
    setLoadingLogs(true);
    try {
      const data = await customerUnitsApi.getAccessLogs(unit.rawContractId, unit.rawUnitId);
      if (Array.isArray(data) && data.length > 0) {
        setLogs((prev) => {
          // Gộp các log vừa tạo local (nếu BE chưa kịp đồng bộ)
          const merged = [...data];
          for (const p of prev) {
            if (!merged.some((m) => m.id === p.id)) {
              merged.push(p);
            }
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Failed to load logs', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [unit.rawContractId, unit.rawUnitId]);

  useEffect(() => {
    loadAccessLogs();
  }, [loadAccessLogs]);

  useEffect(() => {
    async function fetchSmartLock() {
      if (!unit.rawContractId || !unit.rawUnitId) {
        setFetchedPin(unit.mainPin || '682914');
        return;
      }
      try {
        const data = await customerUnitsApi.getSmartLockInfo(unit.rawContractId, unit.rawUnitId);
        if (data?.accessCode) {
          setFetchedPin(data.accessCode);
        }
      } catch (e) {
        console.warn('Backend smart lock not reachable, using unit pin', e);
        setFetchedPin(unit.mainPin || '682914');
      }
    }
    fetchSmartLock();
  }, [unit.rawContractId, unit.rawUnitId, unit.mainPin]);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4 || newPin.length > 8) {
      setPinMessage({ type: 'error', text: 'Mã PIN phải từ 4 đến 8 chữ số' });
      return;
    }
    setIsChangingPin(true);
    setPinMessage(null);

    try {
      if (unit.rawContractId && unit.rawUnitId) {
        const res = await customerUnitsApi.changeSmartLockPin(unit.rawContractId, unit.rawUnitId, newPin.trim());
        setFetchedPin(res.accessCode || newPin.trim());
      } else {
        setFetchedPin(newPin.trim());
      }
      setPinMessage({ type: 'success', text: 'Đổi mã PIN Smart Lock thành công!' });
      setNewPin('');
      setTimeout(() => {
        setShowPinChange(false);
        setPinMessage(null);
      }, 2500);
    } catch (err: any) {
      setPinMessage({ type: 'error', text: err?.message || 'Không thể đổi mã PIN. Vui lòng thử lại.' });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleRemoteUnlock = async () => {
    if (unlockStatus === 'unlocking') return;
    setUnlockStatus('unlocking');

    // 1. Tạo bản ghi nhật ký mới ngay lập tức (Optimistic Update)
    const newLogRecord: AccessLog = {
      id: Date.now(),
      contractItemId: unit.rawContractItemId || 1,
      accessMethod: 'REMOTE_APP',
      status: 'SUCCESS',
      notes: `Mở khóa từ xa cho ${unit.unitNumber} qua ứng dụng thành công`,
      accessedAt: new Date().toISOString(),
    };

    // Đưa ngay vào state và mảng accessLogs của unit
    setLogs((prev) => [newLogRecord, ...prev]);
    if (!unit.accessLogs) unit.accessLogs = [];
    unit.accessLogs = [newLogRecord, ...unit.accessLogs];

    try {
      if (unit.rawContractId && unit.rawUnitId) {
        await customerUnitsApi.recordAccessLog(unit.rawContractId, unit.rawUnitId, {
          accessMethod: 'REMOTE_APP',
          status: 'SUCCESS',
          notes: 'Mở khóa từ xa qua Web Portal thành công',
        });
        await loadAccessLogs();
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }

      setUnlockStatus('unlocked');
      setTimeout(() => setUnlockStatus('idle'), 5000);
      toast.success(`Đã mở khóa ô ${unit.unitNumber} từ xa thành công! Lịch sử ra vào đã được cập nhật.`);
    } catch (e) {
      console.error('Unlock failed', e);
      setUnlockStatus('idle');
      toast.error('Không thể kết nối đến Smart Lock. Vui lòng thử lại sau.');
    }
  };

  // Filtered access logs
  const filteredLogs = logs.filter((log) => {
    if (!matchesMethod(log.accessMethod, methodFilter)) {
      return false;
    }
    if (statusFilter !== 'ALL') {
      const status = String(log.status || '').toUpperCase();
      if (status !== statusFilter) return false;
    }
    return true;
  });

  const countPin = logs.filter((l) => matchesMethod(l.accessMethod, 'PIN_CODE')).length;
  const countRfid = logs.filter((l) => matchesMethod(l.accessMethod, 'RFID_CARD')).length;
  const countRemote = logs.filter((l) => matchesMethod(l.accessMethod, 'REMOTE_APP')).length;

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 animate-slide-up-fade">
      {/* Top Header & Back Breadcrumb */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border border-slate-200"
            title="Quay lại danh sách ô kho"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Chi tiết Quản lý: {unit.unitNumber}
              </h1>
              {unit.status === 'active' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đang hoạt động
                </span>
              )}
              {unit.status === 'expiring' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                  Sắp hết hạn ({unit.daysRemaining} ngày)
                </span>
              )}
              {unit.status === 'overdue' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300">
                  Quá hạn thanh toán
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {unit.size} • {unit.floor}, {unit.zone} • {unit.facilityName}
            </p>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* [ Nút Xem & Ký Hợp Đồng ] */}
          <button
            onClick={() => setIsContractSignOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Hợp đồng điện tử</span>
            {unit.isSigned ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã ký" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Chờ ký" />
            )}
          </button>

          {/* [ Nút Báo cáo sự cố ] */}
          <button
            onClick={() => onOpenReportIncident(unit)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Báo cáo sự cố
          </button>

          {/* [ Nút Gia hạn hợp đồng ] */}
          <button
            onClick={() => onOpenExtendLease(unit)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Gia hạn hợp đồng</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-2 overflow-x-auto scrollbar-none pb-px">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Tổng quan hợp đồng</span>
        </button>

        <button
          onClick={() => setActiveSubTab('items')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'items'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Đồ đạc lưu kho (Inventory)</span>
          {unit.storedItems && unit.storedItems.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              {unit.storedItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('access')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'access'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Khóa & Mã PIN</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch sử ra vào</span>
          {logs.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              {logs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Lịch sử thanh toán & CSKH</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TỔNG QUAN HỢP ĐỒNG & Ô KHO */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 1. Hợp đồng & Tài chính */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Thời hạn hợp đồng</span>
              <div className="text-base font-bold text-slate-900">{unit.contractStartDate}</div>
              <div className="text-xs text-slate-500 mt-0.5">đến {unit.contractEndDate}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Giá thuê hàng tháng</span>
              <div className="text-base font-extrabold text-orange-600">{unit.monthlyRent}</div>
              <div className="text-xs text-slate-500 mt-0.5">Kỳ tới: {unit.nextBillingDate}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Tổng tiền đã thanh toán</span>
              <div className="text-base font-bold text-emerald-600">{unit.totalPaid}</div>
              <div className="text-xs text-slate-400 mt-0.5">Mã HĐ: {unit.contractId}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Số dư nợ hiện tại</span>
              <div className={`text-base font-bold ${unit.currentBalance.includes('0 đ') ? 'text-slate-900' : 'text-red-600'}`}>
                {unit.currentBalance}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Thanh toán tự động: Bật</div>
            </div>
          </div>

          {/* 2. Chi tiết kỹ thuật ô kho & Cảm biến IoT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Thông số môi trường & Cơ sở vật chất ô kho
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Nhiệt độ phòng kho</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{unit.temperature}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Độ ẩm không khí</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{unit.humidity}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">An ninh giám sát</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">Camera AI 24/7</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="font-bold text-slate-800">Địa chỉ & Thời gian ra vào cơ sở:</div>
              <p>• Địa chỉ: {unit.facilityAddress}</p>
              <p>• Giờ mở cửa cho khách hàng tự quản: <strong>24 giờ / 7 ngày trong tuần</strong></p>
              <p>• Quầy hỗ trợ kỹ thuật tại chỗ: 07:00 - 21:00 hàng ngày</p>
            </div>
          </div>

          {/* 3. Tương tác chính: [ Gia hạn hợp đồng ] & [ Nâng cấp/Hạ cấp ô kho ] */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Nhu cầu thay đổi thời hạn hoặc diện tích lưu kho?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gia hạn hợp đồng nhanh chóng trực tuyến, hoặc yêu cầu chuyển sang ô kho diện tích khác.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* [ Nâng cấp/Hạ cấp ô kho ] */}
              <button
                onClick={() => onOpenUpgradeUnit(unit)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <Sliders className="w-4 h-4 text-slate-600" />
                <span>Nâng/Hạ cấp ô kho</span>
              </button>

              {/* [ Gia hạn hợp đồng ] */}
              <button
                onClick={() => onOpenExtendLease(unit)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-95 uppercase tracking-wider"
              >
                <Clock className="w-4 h-4" />
                <span>Gia hạn hợp đồng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ĐỒ ĐẠC LƯU KHO (STORED ITEMS - FLOW 3) */}
      {/* ========================================================================= */}
      {activeSubTab === 'items' && (
        <StoredItemsTab unit={unit} />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRUY CẬP & KHÓA AN TOÀN */}
      {/* ========================================================================= */}
      {activeSubTab === 'access' && (
        <div className="space-y-6">
          {/* Smart Lock Remote Control */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-md">
                <span className="text-xs uppercase font-semibold tracking-wider text-blue-400">
                  Khóa Thông Minh (Smart Lock)
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  Mở Khóa Từ Xa Cho Ô {unit.unitNumber}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Khi bạn đứng gần cửa kho hoặc muốn mở cửa từ xa cho người thân, nhấn nút bên cạnh để truyền lệnh mở khóa.
                </p>

                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">
                      Mã PIN cá nhân: <span className="tabular-nums text-lg font-bold text-white ml-1 tracking-wider">{fetchedPin}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPinChange(!showPinChange)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{showPinChange ? 'Hủy' : 'Đổi mã PIN'}</span>
                    </button>
                  </div>

                  {/* Inline Change PIN Form */}
                  {showPinChange && (
                    <form onSubmit={handleChangePin} className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl space-y-2.5 animate-slide-up-fade">
                      <div className="text-xs font-semibold text-slate-300">
                        Nhập mã PIN mới (4 - 8 chữ số):
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          pattern="[0-9]{4,8}"
                          maxLength={8}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ví dụ: 123456"
                          className="px-3 py-1.5 text-xs tabular-nums tracking-widest bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={isChangingPin || !newPin}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {isChangingPin ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Lưu...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Xác nhận</span>
                            </>
                          )}
                        </button>
                      </div>

                      {pinMessage && (
                        <div className={`text-[11px] ${pinMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pinMessage.text}
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* Nút mở khóa từ xa */}
              <div className="flex flex-col items-center justify-center">
                <button
                  onClick={handleRemoteUnlock}
                  disabled={unlockStatus === 'unlocking'}
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all duration-300 shadow-2xl active:scale-95 ${
                    unlockStatus === 'unlocked'
                      ? 'bg-emerald-600 border-emerald-400 text-white scale-105'
                      : unlockStatus === 'unlocking'
                      ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40 hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg shadow-blue-900/50'
                  }`}
                >
                  {unlockStatus === 'unlocked' ? (
                    <>
                      <DoorOpen className="w-10 h-10" />
                      <span className="text-xs font-bold uppercase">ĐÃ MỞ KHÓA</span>
                    </>
                  ) : unlockStatus === 'unlocking' ? (
                    <>
                      <RefreshCw className="w-10 h-10 animate-spin" />
                      <span className="text-xs font-bold uppercase">ĐANG KẾT NỐI</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-10 h-10" />
                      <span className="text-xs font-bold uppercase">CHẠM ĐỂ MỞ</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400 mt-2">Phạm vi Bluetooth hoặc 4G/Wifi</span>
              </div>
            </div>
          </div>

          {/* Quản lý mã khách tạm thời (Guest Passes) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Danh Sách Mã Khách Tạm Thời (Guest Passes)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấp quyền truy cập có thời hạn cho bạn bè, gia đình hoặc đội ngũ chuyển nhà.
                </p>
              </div>

              {/* [ Nút Tạo mã cho khách tạm thời ] */}
              <button
                onClick={() => onOpenGuestPass(unit)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Tạo mã cho khách mới</span>
              </button>
            </div>

            {/* Danh sách các mã hiện có */}
            {unit.guestPasses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Chưa có mã khách nào được tạo cho ô kho này. Bạn có thể bấm nút &quot;+ Tạo mã cho khách mới&quot; ở trên.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {unit.guestPasses.map((pass) => (
                  <div key={pass.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{pass.guestName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Mục đích: {pass.purpose}</div>
                      <div className="text-[11px] text-slate-400">Hiệu lực: {pass.validFrom} → {pass.validTo}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Mã PIN khách:</span>
                        <span className="tabular-nums text-sm font-bold text-blue-600">{pass.pin}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lịch Sử Ra Vào Gần Nhất (Quick Preview) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  Nhật Ký Ra Vào Gần Nhất
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động lưu vết mỗi lần mở cửa khóa thông minh 24/7.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('logs')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem toàn bộ lịch sử ({logs.length})</span>
                <span>→</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có nhật ký ra vào nào được ghi nhận cho ô kho này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {logs.slice(0, 3).map((log) => {
                  const isSuccess = String(log.status).toUpperCase() === 'SUCCESS';
                  return (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSuccess ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                            <span>{log.accessMethod}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isSuccess ? 'Mở cửa thành công' : 'Từ chối'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {log.notes || 'Khách hàng thao tác tại ổ khóa'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 tabular-nums">
                        {new Date(log.accessedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LỊCH SỬ RA VÀO KHO (FLOW 3 - ACCESS LOGS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6">
          {/* Header & Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Tổng Lượt Truy Cập</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{logs.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Ghi nhận từ IoT Hub</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Mở Khóa Thành Công</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
                {logs.filter((l) => String(l.status).toUpperCase() === 'SUCCESS').length}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">Hợp lệ & an toàn</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Mã PIN & Thẻ RFID</span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 tabular-nums">
                {countPin + countRfid}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tại cửa ngăn kho</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Mở Từ Xa (Web/App)</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 tabular-nums">
                {countRemote}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Lệnh số bảo mật</div>
            </div>
          </div>

          {/* Main Logs Table / Card List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Toolbar: Filters & Refresh */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lọc phương thức:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setMethodFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    methodFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Tất cả ({logs.length})
                </button>

                <button
                  type="button"
                  onClick={() => setMethodFilter('PIN_CODE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    methodFilter === 'PIN_CODE'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Mã PIN ({countPin})
                </button>

                <button
                  type="button"
                  onClick={() => setMethodFilter('RFID_CARD')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    methodFilter === 'RFID_CARD'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Thẻ từ RFID ({countRfid})
                </button>

                <button
                  type="button"
                  onClick={() => setMethodFilter('REMOTE_APP')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                    methodFilter === 'REMOTE_APP'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Từ xa (App) ({countRemote})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  aria-label="Lọc theo trạng thái mở khóa"
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="DENIED">Từ chối / Sai mã</option>
                </select>

                <button
                  type="button"
                  onClick={loadAccessLogs}
                  disabled={loadingLogs}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Làm mới lịch sử từ IoT Hub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>
            </div>

            {/* Logs List Content */}
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Không có nhật ký ra vào phù hợp bộ lọc.</p>
                <p className="text-slate-400 mt-1">Mọi thao tác mở cửa ô kho thông minh sẽ được ghi nhận tự động tại đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isSuccess = String(log.status).toUpperCase() === 'SUCCESS';
                  const methodStr = String(log.accessMethod || '').toUpperCase();
                  
                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                            isSuccess
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}
                        >
                          {methodStr.includes('RFID') ? (
                            <Radio className="w-5 h-5" />
                          ) : methodStr.includes('APP') || methodStr.includes('REMOTE') ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <KeyRound className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {methodStr.includes('APP') || methodStr.includes('REMOTE') || methodStr.includes('WEB') || methodStr.includes('TỪ XA')
                                ? 'Mở từ xa qua Ứng dụng (App)'
                                : methodStr.includes('RFID')
                                ? 'Thẻ từ RFID cảm ứng'
                                : 'Bàn phím mã PIN cá nhân'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                isSuccess
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isSuccess ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Thành công</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Bị từ chối</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{log.notes || 'Thao tác trực tiếp tại ổ khóa thông minh'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 font-medium">{unit.unitNumber} ({unit.facilityName})</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-900 tabular-nums">
                          {new Date(log.accessedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          {new Date(log.accessedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LỊCH SỬ THANH TOÁN & HỖ TRỢ */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Lịch sử thanh toán */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Nhật Ký Thanh Toán Cho Ô {unit.unitNumber}
              </h3>
              <span className="text-xs text-slate-400">Tổng đã thanh toán: {unit.totalPaid}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Mã Hóa Đơn</th>
                    <th className="px-5 py-3 font-semibold">Ngày Giao Dịch</th>
                    <th className="px-5 py-3 font-semibold">Kỳ Thanh Toán</th>
                    <th className="px-5 py-3 font-semibold">Số Tiền</th>
                    <th className="px-5 py-3 font-semibold">Phương Thức</th>
                    <th className="px-5 py-3 font-semibold">Trạng Thái</th>
                    <th className="px-5 py-3 font-semibold text-right">Biên Lai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {unit.paymentHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 tabular-nums font-semibold text-slate-900">{rec.invoiceNumber}</td>
                      <td className="px-5 py-3.5">{rec.date}</td>
                      <td className="px-5 py-3.5">{rec.period}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{rec.amount}</td>
                      <td className="px-5 py-3.5">{rec.method}</td>
                      <td className="px-5 py-3.5">
                        {rec.status === 'paid' && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Đã thanh toán
                          </span>
                        )}
                        {rec.status === 'overdue' && (
                          <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                            Quá hạn
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => toast.info(`Đang tải hóa đơn điện tử VAT cho ${rec.invoiceNumber}...`)}
                          className="text-blue-600 hover:underline font-semibold flex items-center justify-end gap-1 ml-auto"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Các yêu cầu hỗ trợ trong quá khứ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Lịch Sử Yêu Cầu Hỗ Trợ Đã Gửi (Liên kết Luồng 7)
              </h3>
              <button
                onClick={() => onOpenReportIncident(unit)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                + Gửi yêu cầu mới
              </button>
            </div>

            {unit.supportTickets.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có yêu cầu hỗ trợ nào được gửi cho ô kho này.
              </div>
            ) : (
              <div className="space-y-3">
                {unit.supportTickets.map((tk) => (
                  <div key={tk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900">{tk.title}</div>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                        Đã xử lý xong
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Mã phiếu: #{tk.id} • Ngày tạo: {tk.createdAt} • Danh mục: {tk.category}
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <strong>Phản hồi từ CSKH:</strong> {tk.lastReply}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Sign Modal */}
      <ContractSignModal
        unit={unit}
        isOpen={isContractSignOpen}
        onClose={() => setIsContractSignOpen(false)}
        onSignedSuccess={() => {
          unit.isSigned = true;
          setIsContractSignOpen(false);
        }}
      />
    </div>
  );
}
