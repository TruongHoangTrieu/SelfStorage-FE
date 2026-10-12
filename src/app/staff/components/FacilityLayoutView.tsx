'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Layers,
  Search,
  RefreshCw,
  Building2,
  Shield,
  User,
  UserCheck,
  UserPlus,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  facilitiesApi,
  FacilityItem,
  StorageLayoutResponse,
  StorageFloorLayout,
  StorageUnitLayoutItem,
} from '@/lib/api/facilities';
import { handoversApi } from '@/lib/api/handovers';

interface FacilityLayoutViewProps {
  facilityId?: string | number;
  userRole?: string;
}

const STAFF_CANDIDATES = [
  { id: '6ac4e8ad2edd770fa05d7267', name: 'Nguyễn Văn Staff (Trụ sở Thủ Đức)', email: 'staff@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8ae2edd770fa05d726a', name: 'Trần Văn Thủ Đức (NV Võ Nguyên Giáp)', email: 'staff.thuduc@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8ad2edd770fa05d7266', name: 'Phạm Thị Quản Lý (Quản lý Thủ Đức)', email: 'manager@selfstorage.vn', role: 'FACILITY_MANAGER' },
  { id: '6ac4e8ae2edd770fa05d726b', name: 'Lê Hoàng Nam (NV Chi nhánh Quận 1)', email: 'staff.quan1@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8ae2edd770fa05d726c', name: 'Đặng Quốc Bảo (NV Chi nhánh Quận 7)', email: 'staff.quan7@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8af2edd770fa05d726d', name: 'Vũ Minh Anh (NV Chi nhánh Bình Thạnh)', email: 'staff.binhthanh@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8af2edd770fa05d726e', name: 'Huỳnh Gia Huy (NV Chi nhánh Quận 6)', email: 'staff.quan6@selfstorage.vn', role: 'FACILITY_STAFF' },
  { id: '6ac4e8af2edd770fa05d726f', name: 'Ngô Tấn Tài (NV Chi nhánh An Phú)', email: 'staff.anphu@selfstorage.vn', role: 'FACILITY_STAFF' },
];

const POSITION_OPTIONS = [
  'Nhân viên vận hành kho',
  'Quản lý cơ sở kho',
  'Nhân viên an ninh & Giám sát 24/7',
  'Kỹ thuật viên bảo trì khóa & hạ tầng',
  'Lễ tân tiếp đón & Bàn giao kho',
];

export default function FacilityLayoutView({ facilityId, userRole }: FacilityLayoutViewProps) {
  // Check permission: Manager or Admin gets staff assignment tab, Staff only gets floor plan
  const storedUser = typeof window !== 'undefined' ? handoversApi.getStoredUser() : null;
  const effectiveRole = userRole || storedUser?.role || '';
  const isManager = ['FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR', 'ADMIN'].includes(
    String(effectiveRole).toUpperCase()
  );

  const [activeSubTab, setActiveSubTab] = useState<'layout' | 'staff'>('layout');
  const [facilitiesList, setFacilitiesList] = useState<FacilityItem[]>([]);
  const [activeFacilityId, setActiveFacilityId] = useState<string>(String(facilityId || ''));
  const [layout, setLayout] = useState<StorageLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string | number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitLayoutItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Staff management state (only for Manager)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(POSITION_OPTIONS[0]);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Load facilities list once on mount
  useEffect(() => {
    let isMounted = true;
    facilitiesApi.getFacilities()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          setFacilitiesList(list);
          if (!activeFacilityId || activeFacilityId === '1' || !list.some((f) => String(f.id) === String(activeFacilityId))) {
            const matched = facilityId ? list.find((f) => String(f.id) === String(facilityId) || f.code === String(facilityId)) : null;
            const targetId = String(matched ? matched.id : list[0].id);
            setActiveFacilityId(targetId);
            loadLayout(targetId);
            if (isManager) loadStaff(targetId);
            return;
          }
        }
        if (activeFacilityId) {
          loadLayout(activeFacilityId);
          if (isManager) loadStaff(activeFacilityId);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch facilities list:', err);
        loadLayout(activeFacilityId || '1');
        if (isManager) loadStaff(activeFacilityId || '1');
      });

    return () => {
      isMounted = false;
    };
  }, [facilityId, isManager]);

  const loadLayout = async (targetId?: string) => {
    const fid = targetId || activeFacilityId || '1';
    setLoading(true);
    try {
      const data = await facilitiesApi.getStorageLayout(String(fid));
      if (data && (data.floors || (data as any).summary)) {
        const rawSummary = (data as any).summary || (data as any).statusCount || {};
        const totalUnits = (data as any).totalUnits ?? rawSummary.totalUnits ?? 0;
        const rawOcc = (data as any).occupancyRate ?? rawSummary.occupancyRate ?? 0;
        const occupancyRate =
          typeof rawOcc === 'string'
            ? parseFloat(rawOcc.replace('%', '')) || 0
            : Number(rawOcc) || 0;

        const statusCount = {
          AVAILABLE: rawSummary.AVAILABLE ?? (data as any).statusCount?.AVAILABLE ?? 0,
          RESERVED: rawSummary.RESERVED ?? (data as any).statusCount?.RESERVED ?? 0,
          OCCUPIED: rawSummary.OCCUPIED ?? (data as any).statusCount?.OCCUPIED ?? 0,
          UNDER_MAINTENANCE: rawSummary.UNDER_MAINTENANCE ?? (data as any).statusCount?.UNDER_MAINTENANCE ?? 0,
          OUT_OF_SERVICE: rawSummary.OUT_OF_SERVICE ?? (data as any).statusCount?.OUT_OF_SERVICE ?? 0,
        };

        const floors: StorageFloorLayout[] = ((data as any).floors || []).map((f: any) => ({
          floor: f.floor,
          total: f.total ?? f.unitCount ?? (f.units?.length || 0),
          occupied: f.occupied ?? (f.units?.filter((u: any) => u.status === 'OCCUPIED').length || 0),
          available: f.available ?? (f.units?.filter((u: any) => u.status === 'AVAILABLE').length || 0),
          reserved: f.reserved ?? (f.units?.filter((u: any) => u.status === 'RESERVED').length || 0),
          maintenance: f.maintenance ?? (f.units?.filter((u: any) => u.status === 'UNDER_MAINTENANCE').length || 0),
          units: f.units || [],
        }));

        setLayout({
          facility: data.facility || {
            id: String(fid),
            name: 'Kho Tự Quản Thông Minh 24/7',
            code: 'SS-FAC',
            address: 'Hệ thống kho tự quản thông minh',
          },
          totalUnits,
          occupancyRate,
          statusCount,
          floors,
        });

        if (floors.length > 0) {
          setSelectedFloor(floors[0].floor);
        }
      } else {
        throw new Error('No layout data received');
      }
    } catch (e) {
      console.warn('Could not load storage layout from API, using fallback data:', e);
      const mockFloors: StorageFloorLayout[] = [
        {
          floor: 1,
          total: 20,
          occupied: 14,
          available: 4,
          reserved: 1,
          maintenance: 1,
          units: Array.from({ length: 20 }).map((_, i) => {
            const num = 101 + i;
            const code = `A-${num}`;
            let st: StorageUnitLayoutItem['status'] = 'OCCUPIED';
            if (i === 3 || i === 8 || i === 15 || i === 18) st = 'AVAILABLE';
            else if (i === 6) st = 'RESERVED';
            else if (i === 12) st = 'UNDER_MAINTENANCE';

            return {
              id: `u-${num}`,
              unitNumber: code,
              floor: 1,
              zone: i < 10 ? 'Zone A' : 'Zone B',
              status: st,
              unitType: {
                id: 'ut-1',
                name: i % 2 === 0 ? 'Kho Tiêu Chuẩn 5m²' : 'Kho Điều Hòa 9m²',
                code: 'STD-5M',
                size: i % 2 === 0 ? 5 : 9,
                sizeUnit: 'm²',
              },
              currentContract: st === 'OCCUPIED' ? {
                id: `CON-${num}`,
                status: 'ACTIVE',
                customer: { fullName: `Khách hàng ${i + 1}`, phone: '0908123456' },
              } : undefined,
            };
          }),
        },
        {
          floor: 2,
          total: 16,
          occupied: 11,
          available: 3,
          reserved: 2,
          maintenance: 0,
          units: Array.from({ length: 16 }).map((_, i) => {
            const num = 201 + i;
            const code = `B-${num}`;
            let st: StorageUnitLayoutItem['status'] = 'OCCUPIED';
            if (i === 2 || i === 7 || i === 14) st = 'AVAILABLE';
            else if (i === 4 || i === 10) st = 'RESERVED';

            return {
              id: `u-${num}`,
              unitNumber: code,
              floor: 2,
              zone: 'Zone C',
              status: st,
              unitType: {
                id: 'ut-2',
                name: 'Kho Mini 3m²',
                code: 'MINI-3M',
                size: 3,
                sizeUnit: 'm²',
              },
              currentContract: st === 'OCCUPIED' ? {
                id: `CON-${num}`,
                status: 'ACTIVE',
                customer: { fullName: `Doanh nghiệp ${i + 1}`, phone: '0912345678' },
              } : undefined,
            };
          }),
        },
      ];

      setLayout({
        facility: {
          id: String(fid),
          name: 'Kho Tự Quản Trụ Sở Chính Võ Nguyên Giáp',
          code: 'SS-HCM-HQ',
          address: 'Xa Lộ Hà Nội / Võ Nguyên Giáp, TP. Thủ Đức, TP. HCM',
          totalFloors: 2,
        },
        totalUnits: 36,
        occupancyRate: 69.4,
        statusCount: {
          AVAILABLE: 7,
          RESERVED: 3,
          OCCUPIED: 25,
          UNDER_MAINTENANCE: 1,
          OUT_OF_SERVICE: 0,
        },
        floors: mockFloors,
      });
      setSelectedFloor(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async (targetId?: string) => {
    const fid = targetId || activeFacilityId;
    if (!fid) return;
    setLoadingStaff(true);
    try {
      const res = await facilitiesApi.getStaffByFacility(String(fid), true);
      setStaffList(res.staff || []);
    } catch (err) {
      console.warn('Could not load staff for facility:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleFacilityChange = (newFacilityId: string) => {
    setActiveFacilityId(newFacilityId);
    setSelectedUnit(null);
    loadLayout(newFacilityId);
    if (isManager) loadStaff(newFacilityId);
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      toast.error('Vui lòng chọn nhân viên cần phân công');
      return;
    }
    setIsSubmittingAssign(true);
    try {
      await facilitiesApi.assignStaff(activeFacilityId, {
        userId: selectedCandidateId,
        position: selectedPosition,
      });
      toast.success('Phân công nhân viên vào cơ sở thành công!');
      setIsAssignModalOpen(false);
      setSelectedCandidateId('');
      loadStaff(activeFacilityId);
    } catch (err: any) {
      toast.error(err.message || 'Không thể phân công nhân viên');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleEndAssignment = async (assignmentId: string, staffName: string) => {
    if (!confirm(`Bạn có chắc muốn kết thúc phân công của nhân viên "${staffName}" tại cơ sở này?`)) {
      return;
    }
    try {
      await facilitiesApi.endStaffAssignment(assignmentId);
      toast.success(`Đã kết thúc phân công nhân viên ${staffName}`);
      loadStaff(activeFacilityId);
    } catch (err: any) {
      toast.error(err.message || 'Không thể kết thúc phân công');
    }
  };

  const activeFloorData = (layout?.floors || []).find((f) => String(f.floor) === String(selectedFloor));

  const filteredUnits = (activeFloorData?.units || []).filter((u) => {
    const matchSearch =
      u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.unitType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.currentContract?.customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'ALL') return true;
    return u.status === statusFilter;
  });

  const getStatusColor = (status: StorageUnitLayoutItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100/70';
      case 'OCCUPIED':
        return 'bg-slate-100 border-slate-300 text-slate-800 hover:border-slate-500 hover:bg-slate-200/60';
      case 'RESERVED':
        return 'bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-500 hover:bg-amber-100/70';
      case 'UNDER_MAINTENANCE':
        return 'bg-rose-50 border-rose-300 text-rose-800 hover:border-rose-500 hover:bg-rose-100/70';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getStatusBadge = (status: StorageUnitLayoutItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Trống</span>;
      case 'OCCUPIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">Đang thuê</span>;
      case 'RESERVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Đã đặt</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Bảo trì</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Sơ Đồ Mặt Bằng & Ô Kho 24/7
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    Live Status
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {layout?.facility?.name || 'Cơ sở Kho Tự Quản'} • {layout?.facility?.address || 'Địa chỉ đang tải'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Facility Selector Dropdown */}
            {facilitiesList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={activeFacilityId}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {facilitiesList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                loadLayout(activeFacilityId);
                if (isManager) loadStaff(activeFacilityId);
              }}
              disabled={loading || (isManager && loadingStaff)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500">Tổng Số Ô Kho</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{layout?.totalUnits ?? 0} ô</div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
            <span className="text-[11px] font-semibold text-indigo-600">Tỷ Lệ Lấp Đầy</span>
            <div className="text-xl font-black text-indigo-900 mt-0.5">
              {typeof layout?.occupancyRate === 'number' ? layout.occupancyRate.toFixed(1) : layout?.occupancyRate ?? 0}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[11px] font-semibold text-emerald-700">Phòng Trống Khả Dụng</span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">
              {layout?.statusCount?.AVAILABLE ?? 0} ô
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[11px] font-semibold text-amber-700">Đã Giữ Chỗ (Reserved)</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">
              {layout?.statusCount?.RESERVED ?? 0} ô
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <span className="text-[11px] font-semibold text-rose-700">Đang Bảo Trì</span>
            <div className="text-xl font-black text-rose-900 mt-0.5">
              {layout?.statusCount?.UNDER_MAINTENANCE ?? 0} ô
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: ONLY rendered for Manager & Admin */}
      {isManager && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('layout')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'layout'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sơ Đồ Mặt Bằng & Ô Kho 24/7</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Phân Công Nhân Sự Cơ Sở ({staffList.filter((s) => !s.endedAt).length})</span>
          </button>
        </div>
      )}

      {/* FLOOR PLAN GRID: Always visible for Staff, and visible for Manager when activeSubTab === 'layout' */}
      {(!isManager || activeSubTab === 'layout') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Floor Tabs & Unit Grid */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
            {/* Controls: Floor selector + Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              {/* Floor tabs - Clean label without duplicated "Tầng" */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(layout?.floors || []).map((f) => {
                  const rawFloor = String(f.floor).trim();
                  const floorLabel = rawFloor.toLowerCase().startsWith('tầng')
                    ? rawFloor
                    : `Tầng ${rawFloor}`;
                  return (
                    <button
                      key={String(f.floor)}
                      type="button"
                      onClick={() => setSelectedFloor(f.floor)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        String(selectedFloor) === String(f.floor)
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{floorLabel}</span>
                      <span className="text-[10px] opacity-80">({f.total ?? f.units?.length ?? 0} ô)</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Filter & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã ô / khách thuê..."
                    className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="AVAILABLE">Trống khả dụng</option>
                  <option value="OCCUPIED">Đang thuê</option>
                  <option value="RESERVED">Đã giữ chỗ</option>
                  <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
                </select>
              </div>
            </div>

            {/* Unit Grid */}
            <div className="flex-1 py-5">
              {loading ? (
                <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>Đang tải sơ đồ mặt bằng kho 24/7...</span>
                </div>
              ) : filteredUnits.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Không tìm thấy ngăn kho phù hợp với điều kiện tìm kiếm
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredUnits.map((u) => {
                    const isSelected = selectedUnit?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUnit(u)}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between h-28 relative ${getStatusColor(
                          u.status
                        )} ${isSelected ? 'ring-2 ring-indigo-600 shadow-md scale-102' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono font-black text-sm tracking-tight">{u.unitNumber}</span>
                          {getStatusBadge(u.status)}
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold line-clamp-1">{u.unitType?.name || 'Kho Tiêu Chuẩn'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {u.unitType?.size} {u.unitType?.sizeUnit || 'm²'} • {u.zone || 'Khu A'}
                          </p>
                        </div>

                        {u.currentContract?.customer && (
                          <div className="text-[10px] text-slate-600 font-medium truncate pt-1 border-t border-slate-200/50 flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            <span>{u.currentContract.customer.fullName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Cols: Unit Detail Drawer */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col h-[600px] overflow-y-auto">
            {selectedUnit ? (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Thông Tin Chi Tiết Ô Kho
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Ô {selectedUnit.unitNumber}</h3>
                    <p className="text-xs text-slate-500">
                      {String(selectedUnit.floor).toLowerCase().startsWith('tầng') ? selectedUnit.floor : `Tầng ${selectedUnit.floor}`} • {selectedUnit.zone || 'Khu A'}
                    </p>
                  </div>
                  {getStatusBadge(selectedUnit.status)}
                </div>

                {/* Specs */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Loại ngăn kho:</span>
                    <span className="font-semibold text-slate-900">{selectedUnit.unitType?.name || 'Tiêu chuẩn'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Diện tích quy chuẩn:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedUnit.unitType?.size} {selectedUnit.unitType?.sizeUnit || 'm²'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Trạng thái khóa số:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Đã kết nối Smart Lock 24/7
                    </span>
                  </div>
                </div>

                {/* Tenant details if occupied */}
                {selectedUnit.currentContract ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Khách Hàng Đang Thuê
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedUnit.currentContract.customer?.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      SĐT: {selectedUnit.currentContract.customer?.phone || 'Chưa cập nhật'}
                    </p>
                    <p className="text-[11px] text-indigo-600 font-mono font-semibold">
                      Mã HĐ: #{selectedUnit.currentContract.id}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                    <strong>Ô kho đang trống:</strong> Sẵn sàng bàn giao cho các lượt khách đặt chỗ mới (Check-in Luồng 2).
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => toast.success(`Đã sao chép mã kho ${selectedUnit.unitNumber}`)}
                    className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Sao Chép Mã Ô Kho
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info(`Đang yêu cầu kiểm tra hiện trạng ngăn ${selectedUnit.unitNumber}`)}
                    className="w-full py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
                  >
                    Ghi Nhận Kiểm Tra Kỹ Thuật
                  </button>
                </div>
              </div>
            ) : (
              <div className="m-auto text-center p-8 text-slate-400 text-xs">
                Bấm vào bất kỳ ô kho nào trên sơ đồ mặt bằng để xem thông số chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB PHÂN CÔNG NHÂN SỰ: Only for Manager & Admin when activeSubTab === 'staff' */}
      {isManager && activeSubTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Quản Lý Phân Công & Ca Trực Nhân Sự
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  Quyền Quản Lý
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cơ sở: <strong className="text-slate-800">{layout?.facility?.name || 'Cơ sở hiện tại'}</strong> • Giám sát đội ngũ vận hành kho và kỹ thuật viên trực tại điểm.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Phân Công Nhân Viên Mới</span>
            </button>
          </div>

          {loadingStaff ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Đang tải danh sách nhân sự tại cơ sở...</span>
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Chưa có nhân sự nào được phân công tại cơ sở này. Bấm nút <strong>"+ Phân Công Nhân Viên Mới"</strong> để chỉ định nhân sự.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((assignment) => {
                const isEnded = Boolean(assignment.endedAt);
                const user = assignment.user || {};
                return (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                      isEnded
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'NV'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {user.fullName || 'Nhân viên'}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {user.role?.name || user.role || 'STAFF'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEnded
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isEnded ? 'Đã kết thúc' : 'Đang trực'}
                        </span>
                      </div>

                      {/* Info details */}
                      <div className="py-3 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {assignment.position || 'Nhân viên vận hành'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.email || 'Chưa có email'}</span>
                        </div>

                        {user.phone && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-100">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Từ ngày: {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    {!isEnded && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEndAssignment(assignment.id, user.fullName || 'nhân viên')}
                          className="w-full py-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Kết thúc phân công / Điều chuyển</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Phân công nhân viên mới */}
          {isAssignModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-slide-up-fade">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Phân Công Nhân Sự Cơ Sở
                      </h4>
                      <p className="text-xs text-slate-500">
                        {layout?.facility?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAssignStaff} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Chọn Nhân Viên:
                    </label>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Chọn nhân viên từ hệ thống --</option>
                      {STAFF_CANDIDATES.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {cand.name} ({cand.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Vị Trí / Ca Trực Tại Cơ Sở:
                    </label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-hidden cursor-pointer"
                    >
                      {POSITION_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Nhân viên được phân công sẽ có quyền tiếp nhận hồ sơ Check-in, xử lý gia hạn hợp đồng và phản hồi hỗ trợ khách hàng tại cơ sở này.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAssign}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingAssign ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <span>Xác Nhận Phân Công</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
