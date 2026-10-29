'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  PenTool,
  DoorClosed,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerUnit } from '../types';
import { api } from '@/lib/api';
import ContractSignModal from './ContractSignModal';

interface CustomerDocumentsViewProps {
  units: CustomerUnit[];
  customerUser?: any;
  onRefresh: () => void;
}

export default function CustomerDocumentsView({
  units,
  customerUser,
  onRefresh,
}: CustomerDocumentsViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<CustomerUnit | null>(units[0] || null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const handleSignContract = async (unit: CustomerUnit) => {
    if (!unit.rawContractId) {
      toast.info('Hợp đồng đã được ký số hoặc thông tin đang được cập nhật');
      return;
    }
    setIsSigning(true);
    try {
      await api.patch(`/contracts/${unit.rawContractId}/sign`);
      toast.success('Ký hợp đồng thuê điện tử thành công! Quyền truy cập kho đã được kích hoạt.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thực hiện ký số');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Kho Tài Liệu &amp; Hợp Đồng Thuê Kho</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các hợp đồng thuê kho tự quản, biên bản bàn giao thiết bị số và chứng từ có giá trị pháp lý.
          </p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <h3 className="text-xs font-bold text-slate-700">Danh Sách Hợp Đồng ({units.length})</h3>
        </div>

        {units.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Bạn chưa có hợp đồng thuê nào trong hệ thống.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {units.map((u) => {
              const isSigned = u.isSigned ?? true;
              const rentText = u.monthlyRent.includes('/tháng') ? u.monthlyRent : `${u.monthlyRent}/tháng`;
              return (
                <div key={u.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">
                          Hợp đồng thuê kho: #{u.contractId}
                        </h4>
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đã ký số điện tử
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Chờ ký số
                          </span>
                        )}
                        {u.status === 'checkout_pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <DoorClosed className="w-3 h-3 text-rose-600" /> Đang thanh lý / Trả kho
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span><strong>Ngăn kho:</strong> {u.unitNumber} ({u.dimensions})</span>
                        <span><strong>Cơ sở:</strong> {u.facilityName}</span>
                        <span><strong>Thời hạn:</strong> {u.contractStartDate} → {u.contractEndDate}</span>
                        <span><strong>Tiền thuê:</strong> {rentText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Chỉ xem nội dung hợp đồng, bỏ nút tải xuống) */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUnit(u);
                        setIsPreviewOpen(true);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem nội dung</span>
                    </button>

                    {!isSigned && (
                      <button
                        type="button"
                        onClick={() => handleSignContract(u)}
                        disabled={isSigning}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Ký số ngay</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Synchronized Contract Modal (Đồng bộ với Hợp đồng ký nhận kho) */}
      {selectedUnit && (
        <ContractSignModal
          unit={selectedUnit}
          customerUser={customerUser}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onSignedSuccess={() => {
            selectedUnit.isSigned = true;
            setIsPreviewOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
