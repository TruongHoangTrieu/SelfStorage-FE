'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  PenTool,
  ShieldCheck,
  AlertCircle,
  Building2,
  Calendar,
  Lock,
  DoorClosed,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerUnit } from '../types';
import { api } from '@/lib/api';

interface CustomerDocumentsViewProps {
  units: CustomerUnit[];
  onRefresh: () => void;
}

export default function CustomerDocumentsView({
  units,
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

  const handleDownloadPdf = (contractCode: string) => {
    toast.success(`Đang tải file PDF hợp đồng ${contractCode}...`);
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
            <h2 className="text-lg font-bold text-slate-900">Kho Tài Liệu & Hợp Đồng Thuê Kho</h2>
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
                        <span><strong>Tiền thuê:</strong> {u.monthlyRent}/tháng</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUnit(u);
                        setIsPreviewOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem nội dung</span>
                    </button>

                    {!isSigned && (
                      <button
                        type="button"
                        onClick={() => handleSignContract(u)}
                        disabled={isSigning}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Ký số ngay</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(u.contractId)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                      title="Tải PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contract Preview Modal */}
      {isPreviewOpen && selectedUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-slide-up-fade flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hợp Đồng Dịch Vụ Thuê Kho Tự Quản #{selectedUnit.contractId}
                </h3>
                <p className="text-xs text-slate-500">Mẫu điện tử tiêu chuẩn có giá trị pháp lý</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Bên Cho Thuê:</strong> Công ty Hệ Thống Kho Tự Quản Thông Minh</div>
                  <div><strong>Bên Thuê:</strong> Khách hàng cá nhân / doanh nghiệp</div>
                  <div><strong>Vị trí kho:</strong> {selectedUnit.facilityName} - Ô {selectedUnit.unitNumber}</div>
                  <div><strong>Kích thước & Thể tích:</strong> {selectedUnit.dimensions} ({selectedUnit.area})</div>
                  <div><strong>Thời hạn hợp đồng:</strong> {selectedUnit.contractStartDate} đến {selectedUnit.contractEndDate}</div>
                  <div><strong>Giá thuê mỗi tháng:</strong> {selectedUnit.monthlyRent}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Điều 1: Mục Đích Sử Dụng & Quy Định Hàng Hóa</h4>
                <p>
                  Bên Thuê chỉ sử dụng ngăn kho vào mục đích lưu trữ đồ đạc cá nhân, thiết bị văn phòng, hành lý hợp pháp. Tuyệt đối nghiêm cấm tàng trữ chất nổ, hóa chất nguy hiểm, ma túy, sinh vật sống, chất dễ cháy hoặc hàng hóa bị pháp luật cấm.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Điều 2: Quản Lý Khóa Thông Minh & Truy Cập 24/7</h4>
                <p>
                  Ngăn kho được trang bị ổ khóa số điện tử thông minh. Bên Cho Thuê cấp phát mã PIN ban đầu và thẻ từ RFID tại thời điểm bàn giao. Bên Thuê có quyền tự thay đổi mã PIN cá nhân qua hệ thống và chịu trách nhiệm bảo mật mã số.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Điều 3: Gia Hạn & Xử Lý Quá Hạn Hợp Đồng</h4>
                <p>
                  Hợp đồng có thể được gia hạn trực tuyến trước ngày đáo hạn ít nhất 03 ngày. Trường hợp quá hạn thanh toán mà không gia hạn, hệ thống sẽ tự động khóa quyền truy cập mã PIN và áp dụng biểu phí phạt trễ hạn theo quy chế vận hành.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Mã chứng thực số: SHA256-SS-{selectedUnit.contractId}</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
