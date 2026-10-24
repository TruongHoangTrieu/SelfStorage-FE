'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  PlusCircle,
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

  // Chỉ các vai trò quản trị cấp cao toàn hệ thống mới được đổi cơ sở
  // Vai trò FACILITY_MANAGER bị cố định vào cơ sở được phân công quản lý
  const canSwitchFacility = Boolean(
    currentUser && (
      roleName === 'BUSINESS_OPERATIONS_MANAGER' ||
      roleName === 'SYSTEM_ADMINISTRATOR' ||
      roleName === 'ADMIN'
    )
  );

  const assignedFacilityId =
    currentUser?.facilityId ||
    currentUser?.assignedFacility?.id ||
    currentFacilityId ||
    null;

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | number | null>(
    assignedFacilityId,
  );
  const [unitTypes, setUnitTypes] = useState<UnitTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State (Create / Edit Unit Type)
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
    initialUnitsCount: 0,
    initialUnitsFloor: '1',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal State (Add Units Modal - Tăng số lượng ô kho trống)
  const [addUnitsItem, setAddUnitsItem] = useState<UnitTypeItem | null>(null);
  const [addUnitsCount, setAddUnitsCount] = useState<number>(2);
  const [addUnitsFloor, setAddUnitsFloor] = useState<string>('1');
  const [addUnitsPrefix, setAddUnitsPrefix] = useState<string>('');
  const [isSubmittingUnits, setIsSubmittingUnits] = useState<boolean>(false);

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

        if (!canSwitchFacility) {
          // Với Quản lý cơ sở: Luôn cố định cơ sở được giao, không cho chọn cơ sở khác
          const targetId = assignedFacilityId || (list.length > 0 ? list[0].id : null);
          if (targetId) {
            setSelectedFacilityId(targetId);
          }
        } else {
          // Với Quản trị viên cấp cao: Nếu chưa chọn thì mặc định cơ sở hiện tại hoặc cơ sở đầu tiên
          if (list.length > 0 && !selectedFacilityId) {
            const defaultFac =
              list.find((f: any) => String(f.id) === String(currentFacilityId)) || list[0];
            setSelectedFacilityId(defaultFac.id);
          }
        }
      } catch (err) {
        console.error('Failed to load facilities', err);
        toast.error('Không thể tải danh sách cơ sở');
      }
    }
    fetchFacilities();
  }, [assignedFacilityId, canSwitchFacility, currentFacilityId]);

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
        'Chỉ có vai trò Quản lý cơ sở, Business Operations Manager hoặc Admin mới có quyền tạo loại kho & bảng giá.',
      );
      return;
    }
    const targetFacilityId = !canSwitchFacility ? assignedFacilityId : selectedFacilityId;
    if (!targetFacilityId) {
      toast.error('Không tìm thấy cơ sở phân công để thiết lập loại kho.');
      return;
    }
    if (!canSwitchFacility && selectedFacilityId !== targetFacilityId) {
      setSelectedFacilityId(targetFacilityId);
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
      initialUnitsCount: 2, // Gợi ý khởi tạo sẵn 2 ô trống khi tạo loại kho mới
      initialUnitsFloor: '1',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: UnitTypeItem) => {
    if (!canEditPricing) {
      toast.error(
        'Chỉ có vai trò Quản lý cơ sở, Business Operations Manager hoặc Admin mới có quyền chỉnh sửa giá thuê & tiền cọc.',
      );
      return;
    }
    // Nếu là Facility Manager, chỉ được phép sửa loại kho thuộc đúng cơ sở mình quản lý
    if (
      !canSwitchFacility &&
      assignedFacilityId &&
      item.facilityId &&
      String(item.facilityId) !== String(assignedFacilityId)
    ) {
      toast.error('Bạn chỉ có quyền chỉnh sửa loại kho thuộc cơ sở được giao quản lý.');
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
      initialUnitsCount: 0,
      initialUnitsFloor: '1',
    });
    setIsModalOpen(true);
  };

  // Mở modal tăng số lượng ô kho trống cho một loại kho
  const openAddUnitsModal = (item: UnitTypeItem) => {
    if (!canEditPricing) {
      toast.error('Chỉ có vai trò Quản lý cơ sở hoặc Admin mới có quyền tăng số lượng ô kho.');
      return;
    }
    setAddUnitsItem(item);
    setAddUnitsCount(2);
    setAddUnitsFloor('1');
    const cleanPrefix = (item.code || '').replace(/^TYPE_/i, '').trim();
    setAddUnitsPrefix(cleanPrefix || item.code || 'UNIT');
  };

  // Thực thi tạo thêm ô kho trống qua API /storage-units
  const handleCreateUnitsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUnitsItem) return;
    if (addUnitsCount <= 0) {
      toast.error('Số lượng ô kho cần tạo phải lớn hơn 0');
      return;
    }

    const targetFacilityId = addUnitsItem.facilityId || selectedFacilityId;
    if (!targetFacilityId) {
      toast.error('Không tìm thấy cơ sở phân công để thêm ô kho.');
      return;
    }

    setIsSubmittingUnits(true);
    let successCount = 0;
    const prefix = (addUnitsPrefix.trim() || addUnitsItem.code || 'UNIT').toUpperCase();
    const startIndex = (addUnitsItem.totalUnits || 0) + 1;

    try {
      for (let i = 0; i < addUnitsCount; i++) {
        const numIndex = startIndex + i;
        const unitNumber = `${prefix}-${String(numIndex).padStart(2, '0')}`;

        try {
          await api.post('/storage-units', {
            facilityId: String(targetFacilityId),
            unitTypeId: String(addUnitsItem.id),
            unitNumber,
            floor: addUnitsFloor.trim() || '1',
            status: 'AVAILABLE',
            condition: 'Mới 100%, sạch sẽ, sẵn sàng bàn giao',
          });
          successCount++;
        } catch (err: any) {
          console.warn(`Lỗi tạo ô ${unitNumber}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Đã tạo thành công ${successCount} ô kho trống mới cho loại kho "${addUnitsItem.name}"!`,
        );
        // Cập nhật ngay trên bảng (Optimistic)
        setUnitTypes((prev) =>
          prev.map((u) => {
            if (String(u.id) === String(addUnitsItem.id)) {
              return {
                ...u,
                availableUnits: (u.availableUnits || 0) + successCount,
                totalUnits: (u.totalUnits || 0) + successCount,
              };
            }
            return u;
          }),
        );
        loadUnitTypes();
        setAddUnitsItem(null);
      } else {
        toast.error('Không thể tạo ô kho mới. Vui lòng kiểm tra lại quyền hạn hoặc mã phòng.');
      }
    } finally {
      setIsSubmittingUnits(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditPricing) {
      toast.error('Bạn không có quyền điều chỉnh giá thuê hoặc tiền cọc.');
      return;
    }
    const targetFacilityId = !canSwitchFacility ? assignedFacilityId : selectedFacilityId;
    if (!targetFacilityId) {
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
      let unitTypeId = editingItem ? editingItem.id : null;

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
        const createRes = await api.post('/storage-unit-types', {
          facilityId: targetFacilityId,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          size: Number(formData.size),
          sizeUnit: formData.sizeUnit.trim(),
          price: Number(formData.price),
          depositAmount: Number(formData.depositAmount),
          status: formData.status,
        });
        unitTypeId = createRes?.id || createRes?.data?.id;
        toast.success(`Đã tạo loại ngăn kho mới "${formData.name}" thành công!`);
      }

      // Khởi tạo thêm các ô kho trống nếu người dùng có nhập initialUnitsCount > 0
      if (unitTypeId && formData.initialUnitsCount > 0) {
        const count = Number(formData.initialUnitsCount);
        const prefix = (formData.code.trim() || 'UNIT').toUpperCase();
        const floor = formData.initialUnitsFloor.trim() || '1';
        let createdUnits = 0;

        for (let i = 1; i <= count; i++) {
          const unitNumber = `${prefix}-${String(i).padStart(2, '0')}`;
          try {
            await api.post('/storage-units', {
              facilityId: String(targetFacilityId),
              unitTypeId: String(unitTypeId),
              unitNumber,
              floor,
              status: 'AVAILABLE',
              condition: 'Mới 100%, sẵn sàng cho thuê',
            });
            createdUnits++;
          } catch (unitErr) {
            console.warn(`Lỗi tạo ô ${unitNumber}:`, unitErr);
          }
        }
        if (createdUnits > 0) {
          toast.success(`Đã khởi tạo ${createdUnits} ô kho trống sẵn sàng cho thuê!`);
        }
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
    if (
      !canSwitchFacility &&
      assignedFacilityId &&
      deletingItem.facilityId &&
      String(deletingItem.facilityId) !== String(assignedFacilityId)
    ) {
      toast.error('Bạn chỉ có quyền xóa loại kho thuộc cơ sở được giao quản lý.');
      return;
    }
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

  const selectedFacility = facilities.find(
    (f) => String(f.id) === String(selectedFacilityId),
  );

  const currentFacilityDisplayName =
    selectedFacility?.name ||
    currentUser?.assignedFacility?.name ||
    currentUser?.facilityName ||
    'Cơ sở quản lý';

  const currentFacilityCode =
    selectedFacility?.code ||
    currentUser?.assignedFacility?.code ||
    '';

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto">
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
            {/* Facility Selector: Chỉ hiển thị dropdown cho Quản trị viên cấp cao */}
            {canSwitchFacility && (
              <div className="relative min-w-[220px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Chọn Cơ Sở Quản Lý
                </label>
                <div className="relative">
                  <select
                    value={selectedFacilityId || ''}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
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
            )}

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

        {/* Search bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
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
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6 min-w-[320px]">Loại Ngăn Kho &amp; Mã</th>
                  <th className="py-4 px-4 whitespace-nowrap">Quy Cách</th>
                  <th className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <Coins className="w-3.5 h-3.5 text-blue-500" />
                      <span>Giá Thuê / Tháng</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tiền Cọc Tiêu Chuẩn</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 whitespace-nowrap min-w-[240px]">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ô Kho (Trống / Tổng)</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 whitespace-nowrap text-center">Trạng Thái</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap">Thao Tác</th>
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
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Code */}
                      <td className="py-4 px-6 min-w-[320px]">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0 shadow-2xs">
                            <Boxes className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm leading-snug">
                                {item.name}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-md bg-slate-100 text-slate-600 uppercase border border-slate-200 shrink-0">
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
                      <td className="py-4 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/80 text-xs text-slate-700">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>
                            {item.size} {item.sizeUnit === 'm2' ? 'm²' : item.sizeUnit === 'm3' ? 'm³' : item.sizeUnit}
                          </span>
                        </span>
                      </td>

                      {/* Rental Price */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-black text-blue-600 tabular-nums text-sm sm:text-base">
                          {rentalPrice.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          / tháng
                        </div>
                      </td>

                      {/* Deposit Amount */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 tabular-nums text-sm sm:text-base">
                          {deposit.toLocaleString('vi-VN')} ₫
                        </div>
                        {isPriceDifferent ? (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                            <span>Khác giá thuê</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Bằng giá thuê
                          </div>
                        )}
                      </td>

                      {/* Availability Count (Refined Pill Layout with Progress Bar) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.availableUnits > 0
                                  ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                                  : 'bg-rose-500 ring-4 ring-rose-500/20'
                              }`}
                            />
                            <div className="flex items-baseline gap-1 whitespace-nowrap">
                              <span
                                className={`font-black tabular-nums text-sm ${
                                  item.availableUnits > 0
                                    ? 'text-emerald-600'
                                    : 'text-rose-500'
                                }`}
                              >
                                {item.availableUnits}
                              </span>
                              <span className="text-slate-400 font-medium text-xs">
                                /{item.totalUnits} ô trống
                              </span>
                            </div>
                          </div>

                          {canEditPricing && (
                            <button
                              type="button"
                              onClick={() => openAddUnitsModal(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-300/80 rounded-xl shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                              title="Tăng số lượng ô kho trống"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Thêm ô</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm ngưng
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {canEditPricing ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition shadow-2xs cursor-pointer"
                              title="Chỉnh sửa loại kho & bảng giá"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition shadow-2xs cursor-pointer"
                              title="Xóa loại kho"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
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
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="text-xs min-w-0">
                    <span className="text-slate-500 font-medium">Cơ sở áp dụng: </span>
                    <strong className="text-slate-900 font-bold">
                      {currentFacilityDisplayName} {currentFacilityCode ? `(${currentFacilityCode})` : ''}
                    </strong>
                  </div>
                </div>
                {!canSwitchFacility && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-white text-slate-700 border border-slate-200 rounded-lg shrink-0">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Cơ sở phân công
                  </span>
                )}
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

              {/* KHỞI TẠO / TĂNG SỐ LƯỢNG Ô KHO TRỐNG VẬT LÝ */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>
                      {editingItem
                        ? 'Tạo thêm ô kho trống mới ngay (Tùy chọn)'
                        : 'Khởi tạo số lượng ô kho trống ban đầu'}
                    </span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    Trạng thái: AVAILABLE (Sẵn sàng)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Số lượng ô kho muốn tạo:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.initialUnitsCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            initialUnitsCount: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-emerald-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex gap-1 shrink-0">
                        {[1, 2, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                initialUnitsCount: prev.initialUnitsCount + num,
                              }))
                            }
                            className="px-2 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 transition cursor-pointer"
                          >
                            +{num}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {formData.initialUnitsCount > 0
                        ? `Sẽ tự động tạo ${formData.initialUnitsCount} ô kho dạng [${formData.code || 'MÃ'}-01, ...] ngay sau khi lưu`
                        : 'Để 0 nếu chưa muốn tạo thêm ô kho vật lý'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Vị trí Tầng (Floor):
                    </span>
                    <input
                      type="text"
                      placeholder="VD: 1, 2, Tầng Trệt..."
                      value={formData.initialUnitsFloor}
                      onChange={(e) =>
                        setFormData({ ...formData, initialUnitsFloor: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
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

      {/* ========================================================================= */}
      {/* MODAL: TĂNG SỐ LƯỢNG Ô KHO TRỐNG VẬT LÝ CHO LOẠI KHO */}
      {/* ========================================================================= */}
      {addUnitsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-slide-up-fade">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <Boxes className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Tăng Số Lượng Ô Kho Trống
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Cho loại: <strong className="text-white">{addUnitsItem.name}</strong> ({addUnitsItem.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddUnitsItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUnitsSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              {/* Thẻ tóm tắt thông tin loại kho */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Cơ sở phân công:</span>
                  <span className="font-bold text-slate-800">
                    {facilities.find((f) => String(f.id) === String(addUnitsItem.facilityId || selectedFacilityId))?.name || 'Cơ sở hiện tại'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1.5 border-t border-slate-200/60">
                  <span>Hiện có trong cơ sở:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-rose-500 tabular-nums">
                      {addUnitsItem.availableUnits} ô trống
                    </span>
                    <span className="text-slate-400">/ {addUnitsItem.totalUnits} tổng ô</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1.5 border-t border-slate-200/60">
                  <span>Kích thước quy cách:</span>
                  <span className="font-semibold text-slate-800">
                    {addUnitsItem.size} {addUnitsItem.sizeUnit}
                  </span>
                </div>
              </div>

              {/* 1. Số lượng ô kho cần tạo thêm */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Số lượng ô kho muốn tạo thêm: <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddUnitsCount((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-base text-slate-700 flex items-center justify-center transition cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={addUnitsCount}
                    onChange={(e) => setAddUnitsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-emerald-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAddUnitsCount((prev) => Math.min(100, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-base text-slate-700 flex items-center justify-center transition cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Nút chọn nhanh */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Chọn nhanh:</span>
                  {[1, 2, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAddUnitsCount(num)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        addUnitsCount === num
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      +{num} ô
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Cấu hình tiền tố mã ô và Tầng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tiền tố mã ô kho:
                  </label>
                  <input
                    type="text"
                    required
                    value={addUnitsPrefix}
                    onChange={(e) => setAddUnitsPrefix(e.target.value.toUpperCase())}
                    placeholder="VD: F035, MINI..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vị trí Tầng (Floor):
                  </label>
                  <input
                    type="text"
                    required
                    value={addUnitsFloor}
                    onChange={(e) => setAddUnitsFloor(e.target.value)}
                    placeholder="VD: 1, 2, Tầng Trệt..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 3. Live Preview danh sách các mã ô kho sẽ sinh tự động */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span>Xem trước danh sách ô kho sẽ tạo ({addUnitsCount} ô):</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    Trạng thái: AVAILABLE
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {Array.from({ length: Math.min(addUnitsCount, 12) }).map((_, idx) => {
                    const numIndex = (addUnitsItem.totalUnits || 0) + 1 + idx;
                    const code = `${(addUnitsPrefix || 'UNIT').trim()}-${String(numIndex).padStart(2, '0')}`;
                    return (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800 shadow-2xs"
                      >
                        {code}
                      </span>
                    );
                  })}
                  {addUnitsCount > 12 && (
                    <span className="px-2 py-1 text-xs font-bold text-emerald-600 self-center">
                      ... và thêm {addUnitsCount - 12} ô nữa
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-emerald-700 mt-1">
                  ✓ Các ô kho sau khi tạo sẽ lập tức xuất hiện trên sơ đồ mặt bằng và sẵn sàng cho khách hàng thuê 24/7.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddUnitsItem(null)}
                  disabled={isSubmittingUnits}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUnits}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingUnits && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>+ Xác Nhận Tạo {addUnitsCount} Ô Kho Trống</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
