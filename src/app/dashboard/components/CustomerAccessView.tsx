'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Battery,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Clock,
  History,
  Lock,
  Unlock,
  AlertTriangle,
  Smartphone,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerUnit, GuestPass, AccessLog } from '../types';
import { customerUnitsApi } from '@/lib/api/customerUnits';

interface CustomerAccessViewProps {
  units: CustomerUnit[];
  selectedUnit: CustomerUnit | null;
  onSelectUnit: (unit: CustomerUnit) => void;
  onOpenGuestPassModal: () => void;
}

export default function CustomerAccessView({
  units,
  selectedUnit,
  onSelectUnit,
  onOpenGuestPassModal,
}: CustomerAccessViewProps) {
  const currentUnit = selectedUnit || units[0];

  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Change PIN modal state
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  // Access logs state (sample fallback if not yet from BE)
  const defaultLogs: AccessLog[] = [
    {
      id: 1,
      contractItemId: currentUnit?.rawContractItemId || 1,
      accessMethod: 'PIN_CODE',
      status: 'SUCCESS',
      notes: 'Mở cửa qua bàn phím mã số',
      accessedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 2,
      contractItemId: currentUnit?.rawContractItemId || 1,
      accessMethod: 'RFID_CARD',
      status: 'SUCCESS',
      notes: 'Quẹt thẻ từ tại sảnh tầng',
      accessedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      contractItemId: currentUnit?.rawContractItemId || 1,
      accessMethod: 'REMOTE_APP',
      status: 'SUCCESS',
      notes: 'Mở khóa từ xa qua ứng dụng',
      accessedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const logs = currentUnit?.accessLogs && currentUnit.accessLogs.length > 0
    ? currentUnit.accessLogs
    : defaultLogs;

  const handleCopyPin = () => {
    if (!currentUnit?.mainPin) return;
    navigator.clipboard.writeText(currentUnit.mainPin);
    setCopiedPin(true);
    toast.success('Đã sao chép mã PIN vào bộ nhớ tạm');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(newPin)) {
      toast.error('Mã PIN mới phải gồm 4 đến 8 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('Mã PIN xác nhận không trùng khớp');
      return;
    }

    setIsSubmittingPin(true);
    try {
      if (currentUnit?.rawContractId && currentUnit?.rawUnitId) {
        await customerUnitsApi.changeSmartLockPin(
          currentUnit.rawContractId,
          currentUnit.rawUnitId,
          newPin
        );
      }
      toast.success('Đã cập nhật mã PIN khóa thông minh thành công!');
      setIsChangePinOpen(false);
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật mã PIN');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  if (!currentUnit) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
        Bạn chưa có ngăn kho nào đang hoạt động để quản lý quyền truy cập.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unit Switcher */}
      {units.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Đang chọn quản lý khóa ngăn:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onSelectUnit(u)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  u.id === currentUnit.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u.unitNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Lock Panel & Security Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Smart Lock Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                Smart Digital Lock
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Ổ Khóa Điện Tử - {currentUnit.unitNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUnit.facilityName} ({currentUnit.zone}, {currentUnit.floor})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Đang bảo vệ
              </span>
            </div>
          </div>

          {/* Key PIN Display Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Mã PIN Mở Cửa Chính</span>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <Battery className="w-3.5 h-3.5" />
                <span>Pin khóa: 94%</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="text-3xl font-mono font-bold tracking-widest">
                {showPin ? currentUnit.mainPin || '883921' : '••••••••'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title={showPin ? 'Ẩn mã' : 'Hiện mã'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Sao chép"
                >
                  {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chạm bàn phím cảm ứng trên cửa kho để kích hoạt đèn LED trước khi nhập mã PIN.</span>
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsChangePinOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đổi Mã PIN Cá Nhân</span>
            </button>

            <button
              type="button"
              onClick={onOpenGuestPassModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cấp Mã Cho Khách / Người Thân</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: RFID & Lock Device Specifications */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3">Thông Số Thiết Bị An Ninh</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Loại khóa:</span>
                <span className="font-semibold text-slate-800">Smart Motorized Latch</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Mã thẻ từ RFID:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {currentUnit.rfidCard || 'SS-RFID-99214'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Cảm biến nhiệt độ:</span>
                <span className="font-semibold text-slate-800">{currentUnit.temperature}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Cảm biến độ ẩm:</span>
                <span className="font-semibold text-slate-800">{currentUnit.humidity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tự động khóa:</span>
                <span className="font-semibold text-emerald-600">Bật (sau 5 giây)</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
            <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã PIN chính cho người lạ. Để ủy quyền tạm thời, hãy sử dụng tính năng <em>Mã Cho Khách</em> có thời hạn.
          </div>
        </div>
      </div>

      {/* Guest Passes & Access Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest Passes List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Mã Khách Tạm Thời ({currentUnit.guestPasses?.length || 0})
            </h4>
            <button
              type="button"
              onClick={onOpenGuestPassModal}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              + Tạo mã mới
            </button>
          </div>

          {(!currentUnit.guestPasses || currentUnit.guestPasses.length === 0) ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Chưa có mã khách nào được tạo.</p>
          ) : (
            <div className="space-y-2.5">
              {currentUnit.guestPasses.map((pass) => (
                <div
                  key={pass.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{pass.guestName}</p>
                    <p className="text-[11px] text-slate-500">{pass.purpose}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Hiệu lực: {pass.validFrom} - {pass.validTo}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {pass.pin}
                    </span>
                    <div className="mt-1">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          pass.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {pass.status === 'active' ? 'Đang hiệu lực' : 'Đã hết hạn'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Access History Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Lịch Sử Ra Vào Gần Nhất
            </h4>
            <span className="text-xs text-slate-400">Ghi nhận 24/7</span>
          </div>

          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{log.notes || 'Mở cửa thành công'}</p>
                    <p className="text-[11px] text-slate-400">
                      Phương thức:{' '}
                      {String(log.accessMethod || '').toUpperCase().includes('APP') ||
                      String(log.accessMethod || '').toUpperCase().includes('REMOTE') ||
                      String(log.accessMethod || '').toUpperCase().includes('WEB')
                        ? 'Mở từ xa (App)'
                        : String(log.accessMethod || '').toUpperCase().includes('RFID')
                        ? 'Thẻ từ RFID'
                        : 'Bàn phím PIN'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(log.accessedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Change PIN */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-slide-up-fade">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Đổi Mã PIN Cá Nhân</h3>
              <button
                type="button"
                onClick={() => setIsChangePinOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePin} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mã PIN mới (4 - 8 chữ số):
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ví dụ: 123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Xác nhận lại mã PIN:
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập lại mã PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPin}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  {isSubmittingPin ? 'Đang lưu...' : 'Lưu Mã PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
