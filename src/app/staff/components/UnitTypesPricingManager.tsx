'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Pencil,
  Trash2,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Coins,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Maximize2,
  Layers,
  ChevronDown,
  Loader2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { StaffUser } from '../types';

interface Facility {
  id: string | number;
  name: string;
  code: string;
  address?: string;
}

export interface UnitTypeItem {
  id: string | number;
  facilityId: string | number;
  name: string;
  code: string;
  description: string | null;
  size: number | string;
  sizeUnit: string;
  price: number;
  depositAmount: number | string;
  status: 'ACTIVE' | 'INACTIVE';
  totalUnits: number;
  availableUnits: number;
  facility?: {
    id: string | number;
    name: string;
    code: string;
  };
}

interface UnitTypesPricingManagerProps {
  currentFacilityId?: string | number;
  currentUser?: StaffUser | null;
}

export default function UnitTypesPricingManager({
  currentFacilityId,
  currentUser,
}: UnitTypesPricingManagerProps) {
  const roleName = (currentUser?.role || '').toUpperCase();
  const canEditPricing = Boolean(
    currentUser && (
      roleName === 'FACILITY_MANAGER' ||
      roleName === 'BUSINESS_OPERATIONS_MANAGER' ||
      roleName === 'SYSTEM_ADMINISTRATOR' ||
      roleName === 'ADMIN'
    )
  );

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | number | null>(
    currentFacilityId || null,
  );
  const [unitTypes, setUnitTypes] = useState<UnitTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnitTypeItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    size: 5,
    sizeUnit: 'm2',
    price: 1500000,
    depositAmount: 1500000,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deletingItem, setDeletingItem] = useState<UnitTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load facilities list
  useEffect(() => {
    async function fetchFacilities() {
      try {
        const data = await api.get('/facilities');
        const list = Array.isArray(data) ? data : data?.data || [];
        setFacilities(list);
        if (list.length > 0 && !selectedFacilityId) {
          const defaultFac =
            list.find((f: any) => f.id === currentFacilityId) || list[0];
          setSelectedFacilityId(defaultFac.id);
        }
      } catch (err) {
        console.error('Failed to load facilities', err);
        toast.error('Không thể tải danh sách cơ sở');
      }
    }
    fetchFacilities();
  }, [currentFacilityId]);

  // Load Unit Types for selected facility
  const loadUnitTypes = useCallback(async () => {
    if (!selectedFacilityId) return;
    setLoading(true);
    try {
      const data = await api.get(
        `/storage-unit-types?facilityId=${selectedFacilityId}`,
      );
      const list = Array.isArray(data) ? data : data?.data || [];
      setUnitTypes(list);
    } catch (err: any) {
      console.error('Failed to load unit types', err);
      toast.error('Không thể tải danh sách loại kho: ' + (err?.message || 'Lỗi server'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFacilityId]);

  useEffect(() => {
    loadUnitTypes();
  }, [loadUnitTypes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUnitTypes();
  };

  const openCreateModal = () => {
    if (!canEditPricing) {
      toast.error(
        'Chỉ có 3 vai trò: Facility Manager, Business Operations Manager và System Administrator mới được quyền tạo loại kho & chỉnh giá.',
      );
      return;
    }
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      size: 5,
      sizeUnit: 'm2',
      price: 1600000,
      depositAmount: 1500000,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: UnitTypeItem) => {
    if (!canEditPricing) {
      toast.error(
        'Chỉ có 3 vai trò: Facility Manager, Business Operations Manager và System Administrator mới được quyền chỉnh sửa giá thuê & tiền cọc.',
      );
      return;
    }
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      size: Number(item.size),
      sizeUnit: item.sizeUnit || 'm2',
      price: Number(item.price || item.depositAmount),
      depositAmount: Number(item.depositAmount),
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditPricing) {
      toast.error('Bạn không có quyền điều chỉnh giá thuê hoặc tiền cọc.');
      return;
    }
    if (!selectedFacilityId) {
      toast.error('Vui lòng chọn cơ sở kho');
      return;
    }

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng điền tên loại kho và mã kho');
      return;
    }

    if (formData.price < 0 || formData.depositAmount < 0) {
      toast.error('Giá thuê và tiền cọc không được nhỏ hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        // UPDATE PATCH
        await api.patch(`/storage-unit-types/${editingItem.id}`, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          size: Number(formData.size),
          sizeUnit: formData.sizeUnit.trim(),
          price: Number(formData.price),
          depositAmount: Number(formData.depositAmount),
          status: formData.status,
        });
        toast.success(`Đã cập nhật bảng giá loại kho "${formData.name}" thành công!`);
      } else {
        // CREATE POST
        await api.post('/storage-unit-types', {
          facilityId: selectedFacilityId,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          size: Number(formData.size),
          sizeUnit: formData.sizeUnit.trim(),
          price: Number(formData.price),
          depositAmount: Number(formData.depositAmount),
          status: formData.status,
        });
        toast.success(`Đã tạo loại ngăn kho mới "${formData.name}" thành công!`);
      }

      setIsModalOpen(false);
      loadUnitTypes();
    } catch (err: any) {
      toast.error('Lỗi lưu loại kho: ' + (err?.message || 'Không thể thực hiện'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canEditPricing) {
      toast.error('Bạn không có quyền xóa loại kho.');
      return;
    }
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await api.delete(`/storage-unit-types/${deletingItem.id}`);
      toast.success(`Đã xóa loại ngăn kho "${deletingItem.name}" thành công`);
      setDeletingItem(null);
      loadUnitTypes();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa loại kho');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUnitTypes = unitTypes.filter((ut) => {
    const q = searchTerm.toLowerCase();
    return (
      ut.name.toLowerCase().includes(q) ||
      ut.code.toLowerCase().includes(q) ||
      (ut.description && ut.description.toLowerCase().includes(q))
    );
  });

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Quản Lý Loại Kho &amp; Bảng Giá
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {unitTypes.length} loại ngăn kho
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Thiết lập riêng biệt <strong>Giá thuê hàng tháng</strong> và <strong>Tiền cọc giữ chỗ</strong> phù hợp cho từng cơ sở kho trong hệ thống.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Facility Selector */}
            <div className="relative min-w-[220px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Chọn Cơ Sở Quản Lý
              </label>
              <div className="relative">
                <select
                  value={selectedFacilityId || ''}
                  onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.code})
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Reload button */}
            <div className="self-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`}
                />
              </button>
            </div>

            {/* Create new Unit Type */}
            <div className="self-end">
              {canEditPricing ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Thêm Loại Kho</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 text-xs sm:text-sm font-bold rounded-xl cursor-not-allowed border border-slate-200"
                  title="Chỉ Facility Manager, Business Ops Manager hoặc Admin mới có quyền tạo loại kho & đặt giá"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Thêm Loại Kho</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cảnh báo quyền hạn chế cho Facility Staff */}
        {!canEditPricing && (
          <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-900">Chế độ phân quyền (Chỉ xem): </span>
              Tài khoản của bạn ({currentUser?.fullName || 'Nhân viên'} - <span className="font-bold">{roleName || 'FACILITY_STAFF'}</span>) có quyền tra cứu số lượng ô kho trống và bảng giá niêm yết. Quyền <strong>Thêm loại kho</strong>, <strong>Chỉnh sửa giá thuê &amp; tiền cọc</strong> và <strong>Xóa loại kho</strong> được giới hạn nghiêm ngặt chỉ dành cho 3 vai trò: <strong>Facility Manager</strong>, <strong>Business Operations Manager</strong> và <strong>System Administrator</strong>.
            </div>
          </div>
        )}

        {/* Search bar & quick filter */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên loại kho, mã code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Đang hiển thị tại cơ sở:{' '}
            <strong className="text-slate-800 font-bold">
              {selectedFacility?.name || 'Chưa chọn'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Table / Grid View */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Đang tải danh sách loại ngăn kho...</p>
            <p className="text-xs text-slate-400 mt-1">Đồng bộ giá thuê và tiền cọc từ hệ thống cơ sở</p>
          </div>
        ) : filteredUnitTypes.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Boxes className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Chưa có loại ngăn kho nào
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
              Cơ sở này hiện chưa được cấu hình loại ngăn kho và biểu phí. Bạn có thể nhấn nút bên dưới để tạo loại kho đầu tiên.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thêm Loại Kho Mới Ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Loại Ngăn Kho &amp; Mã</th>
                  <th className="py-4 px-4">Quy Cách (Diện Tích)</th>
                  <th className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Giá Thuê / Tháng</span>
                    </div>
                  </th>
                  <th className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Tiền Cọc Tiêu Chuẩn</span>
                    </div>
                  </th>
                  <th className="py-4 px-4">Ô Kho (Trống / Tổng)</th>
                  <th className="py-4 px-4">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredUnitTypes.map((item) => {
                  const rentalPrice = Number(item.price || item.depositAmount);
                  const deposit = Number(item.depositAmount);
                  const isPriceDifferent = rentalPrice !== deposit;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name & Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                            <Boxes className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {item.name}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                {item.code}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{item.size} {item.sizeUnit}</span>
                        </span>
                      </td>

                      {/* Rental Price */}
                      <td className="py-4 px-4">
                        <div className="font-black text-blue-600 tabular-nums text-sm sm:text-base">
                          {rentalPrice.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          / tháng
                        </div>
                      </td>

                      {/* Deposit Amount */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-amber-700 tabular-nums">
                          {deposit.toLocaleString('vi-VN')} đ
                        </div>
                        {isPriceDifferent && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Khác giá thuê
                          </div>
                        )}
                      </td>

                      {/* Availability Count */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black tabular-nums ${
                              item.availableUnits > 0
                                ? 'text-emerald-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {item.availableUnits}
                          </span>
                          <span className="text-slate-400 text-xs">
                            / {item.totalUnits} ô
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm ngưng
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {canEditPricing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Chỉnh sửa loại kho & bảng giá"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa loại kho"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold px-2 py-1 rounded bg-slate-100 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Chỉ xem</span>
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

      {/* MODAL: CREATE / EDIT UNIT TYPE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-slide-up-fade">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                  {editingItem ? 'CẬP NHẬT LOẠI KHO' : 'TẠO MỚI LOẠI KHO'}
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  {editingItem
                    ? `Chỉnh Sửa: ${editingItem.name}`
                    : 'Thêm Loại Ngăn Kho & Thiết Lập Bảng Giá'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-500 font-medium">Cơ sở áp dụng: </span>
                  <strong className="text-slate-900 font-bold">
                    {selectedFacility?.name} ({selectedFacility?.code})
                  </strong>
                </div>
              </div>

              {/* Tên & Mã Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tên Loại Kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kho Tiêu Chuẩn 5m²"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Mã Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: M05, MINI, XL10..."
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Kích thước & Đơn vị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Kích Thước (Diện tích) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Đơn Vị Đo
                  </label>
                  <input
                    type="text"
                    value={formData.sizeUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, sizeUnit: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GIÁ THUÊ & TIỀN CỌC (TRỌNG TÂM) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                {/* Giá Thuê Niêm Yết */}
                <div>
                  <label className="text-xs font-black text-blue-900 block mb-1 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-blue-600" />
                    <span>Giá Thuê Niêm Yết (VNĐ/tháng) *</span>
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-blue-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    = {Number(formData.price || 0).toLocaleString('vi-VN')} đ / tháng
                  </span>
                </div>

                {/* Tiền Cọc Tiêu Chuẩn */}
                <div>
                  <label className="text-xs font-black text-amber-950 block mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tiền Cọc Tiêu Chuẩn (VNĐ) *</span>
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    required
                    value={formData.depositAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        depositAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-amber-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    = {Number(formData.depositAmount || 0).toLocaleString('vi-VN')} đ (cọc)
                  </span>
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Mô Tả &amp; Trang Bị Kèm Theo
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Cửa cuốn tự động, kiểm soát độ ẩm, camera giám sát..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Trạng Thái Kinh Doanh
                </label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() =>
                        setFormData({ ...formData, status: 'ACTIVE' })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Đang hoạt động (ACTIVE)
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="INACTIVE"
                      checked={formData.status === 'INACTIVE'}
                      onChange={() =>
                        setFormData({ ...formData, status: 'INACTIVE' })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Tạm ngưng cung cấp (INACTIVE)
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Lưu Thay Đổi' : 'Tạo Loại Kho Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center animate-slide-up-fade">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">
              Xác Nhận Xóa Loại Ngăn Kho?
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa loại ngăn kho <strong>{deletingItem.name}</strong> ({deletingItem.code})?
            </p>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lưu ý an toàn hệ thống:</p>
                  <p className="mt-0.5 text-amber-800">
                    Nếu loại kho đã có ô kho vật lý hoặc khách hàng đang đặt chỗ, hệ thống sẽ ngăn chặn việc xóa. Trong trường hợp đó, vui lòng chuyển trạng thái sang <strong>Tạm ngưng (INACTIVE)</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xóa Loại Kho Này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
