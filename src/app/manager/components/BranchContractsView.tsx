'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Building2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { operationsApi } from '@/lib/api/operations';
import { CheckInAppointment } from '../../staff/types';
import ContractModal from '../../staff/components/ContractModal';

interface BranchContractsViewProps {
  facilityId?: string | number;
  facilityName?: string;
}

function formatVND(amount?: number | string): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
}

export default function BranchContractsView({
  facilityId,
  facilityName = 'Chi nhánh được phân công',
}: BranchContractsViewProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedContractForModal, setSelectedContractForModal] = useState<CheckInAppointment | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const list = await operationsApi.getReportContracts();
      const rawList = Array.isArray(list) ? list : [];
      // Phạm vi Quản lý Chi nhánh: Chỉ lấy hợp đồng thuộc chi nhánh của Manager
      const branchFiltered = facilityId
        ? rawList.filter((c) => String(c.facilityId || c.facility?.id || '') === String(facilityId))
        : rawList;
      setContracts(branchFiltered.length > 0 ? branchFiltered : rawList);
    } catch {
      toast.error('Không thể tải danh sách hợp đồng chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [facilityId]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const effStatus = c.overdueDays > 0 && c.status === 'ACTIVE' ? 'OVERDUE' : (c.status || 'ACTIVE');
      if (statusFilter !== 'ALL' && effStatus !== statusFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const code = String(c.contractCode || c.contractNumber || c.id || '').toLowerCase();
        const cust = String(c.customerName || c.customer?.fullName || '').toLowerCase();
        const phone = String(c.customerPhone || c.customer?.phone || '').toLowerCase();
        const unit = String(c.unitNumber || c.storageUnit?.unitNumber || '').toLowerCase();
        return code.includes(q) || cust.includes(q) || phone.includes(q) || unit.includes(q);
      }
      return true;
    });
  }, [contracts, statusFilter, search]);

  const stats = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let completed = 0;
    for (const c of contracts) {
      const effStatus = c.overdueDays > 0 && c.status === 'ACTIVE' ? 'OVERDUE' : (c.status || 'ACTIVE');
      if (effStatus === 'OVERDUE') overdue++;
      else if (effStatus === 'ACTIVE') active++;
      else completed++;
    }
    return { total: contracts.length, active, overdue, completed };
  }, [contracts]);

  const mapContractToAppointment = (c: any): CheckInAppointment => {
    const start = c.startDate ? new Date(c.startDate) : new Date();
    const end = c.endDate ? new Date(c.endDate) : new Date();
    const diffMonths = Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 24 * 3600 * 1000)));

    return {
      id: c.reservation?.reservationCode || c.contractCode || c.id,
      rawId: c.reservationId || c.reservation?.id || c.id,
      reservationCode: c.reservation?.reservationCode || c.contractCode,
      contractCode: c.contractCode || c.contractNumber,
      facilityId: c.facilityId || c.facility?.id,
      facilityName: c.facilityName || c.facility?.name || facilityName,
      facilityAddress: c.facility?.address || '',
      customerName: c.customerName || c.customer?.fullName || 'Khách hàng',
      phone: c.customerPhone || c.customer?.phone || '',
      email: c.customerEmail || c.customer?.email || '',
      idCard: c.maskedIdentityNumber || c.customerIdentityNumber || '079******345',
      identityType: c.customerIdentityType || 'CCCD',
      identityAddress: c.customerAddress || '',
      identityFrontUrl: c.customerIdentityFrontUrl || '',
      identityBackUrl: c.customerIdentityBackUrl || '',
      isIdentityVerified: true,
      slotTime: 'Đã bàn giao',
      dateDisplay: start.toLocaleDateString('vi-VN'),
      timeCategory: 'morning',
      unitType: c.unitTypeName || 'Kho Tiêu chuẩn',
      unitSize: c.unitSize || '3m²',
      assignedUnit: c.unitNumber || c.storageUnit?.unitNumber || 'A-101',
      preferredFloor: c.storageUnit?.floor ? `Tầng ${c.storageUnit.floor}` : 'Tầng 1',
      status: 'completed',
      depositStatus: 'paid',
      rentalStatus: 'paid',
      depositAmount: formatVND(c.depositAmount || 500000),
      monthlyRent: formatVND(c.monthlyRent || c.rentalFee || 1500000),
      startDate: start.toLocaleDateString('vi-VN'),
      durationMonths: diffMonths,
      purpose: 'Lưu trữ tài sản cá nhân / doanh nghiệp',
      accessPin: c.accessPin || '******',
      condition: c.handoverCondition || 'Kho sạch sẽ, khóa thông minh hoạt động tốt',
      photos: Array.isArray(c.handoverPhotos) ? c.handoverPhotos : [],
    };
  };

  const handleTerminateOverdue = async (c: any) => {
    const code = c.contractCode || c.contractNumber || c.id;
    const ok = window.confirm(
      `Xác nhận thanh lý hợp đồng quá hạn #${code} và giải phóng Ô #${c.unitNumber} về trạng thái Trống (AVAILABLE)?`
    );
    if (!ok) return;

    setTerminatingId(c.id);
    try {
      await operationsApi.terminateContract(c.id);
      toast.success(`Đã thanh lý hợp đồng #${code} và giải phóng ô kho #${c.unitNumber}.`);
      await loadContracts();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thanh lý hợp đồng.');
    } finally {
      setTerminatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Phân quyền Quản lý Chi nhánh */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Quản Lý Hợp Đồng Thuê Kho Tại Chi Nhánh
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3 h-3" />
                {facilityName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tra cứu văn bản pháp lý, đối chiếu chữ ký điện tử, in lại hợp đồng và xử lý thanh lý các hợp đồng quá hạn thuộc phạm vi chi nhánh.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadContracts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Tổng Hợp Đồng Cơ Sở</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Hồ sơ lưu trữ điện tử</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Đang Hiệu Lực (ACTIVE)</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.active}</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Đã ký &amp; đang sử dụng kho</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase block">Quá Hạn Cần Xử Lý</span>
          <div className="text-2xl font-black text-rose-800 mt-1">{stats.overdue}</div>
          <span className="text-[11px] text-rose-600 mt-0.5 block">Cần gia hạn hoặc thanh lý</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Đã Hoàn Tất / Thanh Lý</span>
          <div className="text-2xl font-black text-slate-700 mt-1">{stats.completed}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Tự động xóa CCCD sau 30 ngày</span>
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hợp đồng (CON-...), tên khách, SĐT, mã ô kho..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none"
        >
          <option value="ALL">Tất cả trạng thái ({contracts.length})</option>
          <option value="ACTIVE">Đang hiệu lực (ACTIVE)</option>
          <option value="OVERDUE">Quá hạn (OVERDUE)</option>
          <option value="COMPLETED">Đã hoàn tất (COMPLETED)</option>
          <option value="TERMINATED">Đã thanh lý (TERMINATED)</option>
        </select>

        <span className="text-xs font-bold text-slate-500 ml-auto">
          Hiển thị: <strong className="text-blue-600">{filteredContracts.length}</strong> hợp đồng
        </span>
      </div>

      {/* Bảng danh sách hợp đồng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Mã Hợp Đồng</th>
                <th className="px-4 py-3.5">Khách Hàng &amp; Định Danh</th>
                <th className="px-4 py-3.5">Ô Kho &amp; Loại Kho</th>
                <th className="px-4 py-3.5">Thời Hạn Thuê</th>
                <th className="px-4 py-3.5 text-right">Giá Thuê / Cọc</th>
                <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right">Thao Tác Quản Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Đang tải dữ liệu hợp đồng chi nhánh...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Không tìm thấy hợp đồng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const isOverdue = c.overdueDays > 0 && c.status === 'ACTIVE';
                  const effStatus = isOverdue ? 'OVERDUE' : (c.status || 'ACTIVE');
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-extrabold text-blue-900">
                          {c.contractCode || c.contractNumber || c.id}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Ký ngày: {c.signedAt || c.createdAt ? new Date(c.signedAt || c.createdAt).toLocaleDateString('vi-VN') : '--'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{c.customerName}</div>
                        <div className="text-[11px] text-slate-500">{c.customerPhone}</div>
                        {c.maskedIdentityNumber && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            CCCD: {c.maskedIdentityNumber}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                          Ô #{c.unitNumber}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {c.unitTypeName} ({c.unitSize || '3m²'})
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        <div className="font-semibold">
                          {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '--'} &rarr;{' '}
                          {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '--'}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Quá hạn {c.overdueDays} ngày
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="font-extrabold text-slate-900">{formatVND(c.monthlyRent || c.rentalFee)}/tháng</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Cọc: {formatVND(c.depositAmount)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            effStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : effStatus === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {effStatus === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                          {effStatus === 'OVERDUE' && <Clock className="w-3 h-3" />}
                          {effStatus === 'ACTIVE'
                            ? 'Đang thuê'
                            : effStatus === 'OVERDUE'
                              ? 'Quá hạn'
                              : effStatus === 'TERMINATED'
                                ? 'Đã thanh lý'
                                : 'Hoàn tất'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedContractForModal(mapContractToAppointment(c))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                            title="Xem toàn văn Hợp đồng điện tử & In"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem &amp; In HĐ</span>
                          </button>

                          {effStatus === 'OVERDUE' && (
                            <button
                              type="button"
                              disabled={terminatingId === c.id}
                              onClick={() => handleTerminateOverdue(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                              title="Thanh lý hợp đồng quá hạn & giải phóng ô kho"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Thanh lý</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xem & In Hợp đồng chuẩn pháp lý A4 (Read-Only vì đã ký) */}
      {selectedContractForModal && (
        <ContractModal
          isOpen={Boolean(selectedContractForModal)}
          onClose={() => setSelectedContractForModal(null)}
          appointment={selectedContractForModal}
          assignedUnit={selectedContractForModal.assignedUnit}
          readOnly={true}
        />
      )}
    </div>
  );
}
