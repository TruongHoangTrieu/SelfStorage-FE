'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  DoorOpen,
  Send,
  Trash2,
  HelpCircle,
  Download,
  KeyRound,
  Check
} from 'lucide-react';
import { CustomerUnit } from '../types';

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
  // Tabs: 'overview' (Tab 1), 'access' (Tab 2), 'history' (Tab 3)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'access' | 'history'>('overview');
  const [unlockStatus, setUnlockStatus] = useState<'idle' | 'unlocking' | 'unlocked'>('idle');
  const [fetchedPin, setFetchedPin] = useState<string>(unit.mainPin || '682914');
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    try {
      // Simulate or send signal to smart lock
      await new Promise(r => setTimeout(r, 1200));
      setUnlockStatus('unlocked');
      setTimeout(() => setUnlockStatus('idle'), 5000);
    } catch (e) {
      console.error('Unlock failed', e);
      setUnlockStatus('idle');
      alert('Không thể kết nối đến Smart Lock. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up-fade">
      {/* Top Header & Back Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Quay lại danh sách ô kho"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
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
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* [ Nút Báo cáo sự cố ] */}
          <button
            onClick={() => onOpenReportIncident(unit)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all"
          >
            Báo cáo sự cố
          </button>

          {/* [ Nút Gia hạn hợp đồng ] */}
          <button
            onClick={() => onOpenExtendLease(unit)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25 transition-all active:scale-95"
          >
            Gia hạn hợp đồng
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeSubTab === 'overview'
              ? 'text-[#4f39f6]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Tab 1: Tổng quan hợp đồng & Ô kho
          {activeSubTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4f39f6] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('access')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeSubTab === 'access'
              ? 'text-[#4f39f6]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Tab 2: Truy cập & Khóa an toàn
          {activeSubTab === 'access' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4f39f6] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${
            activeSubTab === 'history'
              ? 'text-[#4f39f6]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Tab 3: Lịch sử thanh toán & Hỗ trợ
          {activeSubTab === 'history' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4f39f6] rounded-t-full" />
          )}
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
              <div className="text-base font-bold text-[#4f39f6]">{unit.monthlyRent}</div>
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
                <div className="p-2.5 rounded-xl bg-indigo-100 text-[#4f39f6]">
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
                Gia hạn hợp đồng để nhận ưu đãi lên đến 15%, hoặc yêu cầu chuyển sang ô kho diện tích khác.
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
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25 transition-all active:scale-95"
              >
                <Clock className="w-4 h-4" />
                <span>Gia hạn hợp đồng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TRUY CẬP & KHÓA AN TOÀN */}
      {/* ========================================================================= */}
      {activeSubTab === 'access' && (
        <div className="space-y-6">
          {/* Smart Lock Remote Control */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-md">
                <span className="text-xs uppercase font-bold tracking-wider text-[#818cf8]">
                  Khóa Thông Minh Trực Tuyến (IoT Smart Lock)
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
                      Mã PIN cá nhân: <span className="font-mono text-lg font-bold text-white ml-1 tracking-wider">{fetchedPin}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPinChange(!showPinChange)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#818cf8] hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
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
                          className="px-3 py-1.5 text-xs font-mono tracking-widest bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#818cf8]"
                        />
                        <button
                          type="submit"
                          disabled={isChangingPin || !newPin}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
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
                      : 'bg-[#4f39f6] border-[#818cf8]/40 hover:bg-[#432fe0] text-white'
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
                  <UserPlus className="w-4 h-4 text-[#4f39f6]" />
                  Danh Sách Mã Khách Tạm Thời (Guest Passes)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấp quyền truy cập có thời hạn cho bạn bè, gia đình hoặc đội ngũ chuyển nhà.
                </p>
              </div>

              {/* [ Nút Tạo mã cho khách tạm thời ] */}
              <button
                onClick={() => onOpenGuestPass(unit)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-xs transition-all active:scale-95"
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
                        <span className="font-mono text-sm font-bold text-[#4f39f6]">{pass.pin}</span>
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
                <CreditCard className="w-4 h-4 text-[#4f39f6]" />
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
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{rec.invoiceNumber}</td>
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
                          onClick={() => alert(`Đang tải hóa đơn điện tử VAT cho ${rec.invoiceNumber}`)}
                          className="text-[#4f39f6] hover:underline font-semibold flex items-center justify-end gap-1 ml-auto"
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
                <HelpCircle className="w-4 h-4 text-[#4f39f6]" />
                Lịch Sử Yêu Cầu Hỗ Trợ Đã Gửi (Liên kết Luồng 7)
              </h3>
              <button
                onClick={() => onOpenReportIncident(unit)}
                className="text-xs font-semibold text-[#4f39f6] hover:underline"
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
    </div>
  );
}
