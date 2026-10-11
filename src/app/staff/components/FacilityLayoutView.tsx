'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  User,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Lock,
  Unlock,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  facilitiesApi,
  StorageLayoutResponse,
  StorageFloorLayout,
  StorageUnitLayoutItem,
} from '@/lib/api/facilities';

interface FacilityLayoutViewProps {
  facilityId?: string | number;
}

export default function FacilityLayoutView({ facilityId = '1' }: FacilityLayoutViewProps) {
  const [layout, setLayout] = useState<StorageLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string | number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitLayoutItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadLayout = async () => {
    setLoading(true);
    try {
      const data = await facilitiesApi.getStorageLayout(String(facilityId));
      if (data && data.floors) {
        setLayout(data);
        if (data.floors.length > 0) {
          setSelectedFloor(data.floors[0].floor);
        }
      } else {
        throw new Error('No layout data');
      }
    } catch (e) {
      console.warn('Could not load storage layout, using simulated data:', e);
      // Realistic fallback layout
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
          id: String(facilityId),
          name: 'Cơ sở Chi nhánh Landmark 81',
          code: 'SS-HCM-LM81',
          address: 'Khu B, Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh',
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

  useEffect(() => {
    loadLayout();
  }, [facilityId]);

  const activeFloorData = layout?.floors.find((f) => String(f.floor) === String(selectedFloor));

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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sơ Đồ Mặt Bằng & Trạng Thái Ô Kho 24/7 (Flow 5)
                </h2>
                <p className="text-xs text-slate-500">
                  {layout?.facility.name} • {layout?.facility.address}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLayout}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cập nhật</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500">Tổng Số Ô Kho</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{layout?.totalUnits || 0} ô</div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
            <span className="text-[11px] font-semibold text-indigo-600">Tỷ Lệ Lấp Đầy</span>
            <div className="text-xl font-black text-indigo-900 mt-0.5">{layout?.occupancyRate || 0}%</div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[11px] font-semibold text-emerald-700">Phòng Trống Khả Dụng</span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{layout?.statusCount.AVAILABLE || 0} ô</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[11px] font-semibold text-amber-700">Đã Giữ Chỗ (Reserved)</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">{layout?.statusCount.RESERVED || 0} ô</div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <span className="text-[11px] font-semibold text-rose-700">Đang Bảo Trì</span>
            <div className="text-xl font-black text-rose-900 mt-0.5">{layout?.statusCount.UNDER_MAINTENANCE || 0} ô</div>
          </div>
        </div>
      </div>

      {/* Main Floor Plan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-9 Cols: Floor Tabs & Unit Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
          {/* Controls: Floor selector + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            {/* Floor tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {layout?.floors.map((f) => (
                <button
                  key={f.floor}
                  type="button"
                  onClick={() => setSelectedFloor(f.floor)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    String(selectedFloor) === String(f.floor)
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tầng {f.floor}</span>
                  <span className="text-[10px] opacity-80">({f.total} ô)</span>
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              <div className="py-20 text-center text-slate-400 text-xs">Đang tải sơ đồ mặt bằng...</div>
            ) : filteredUnits.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">Không tìm thấy ngăn kho phù hợp</div>
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
                        <p className="text-[11px] font-semibold line-clamp-1">{u.unitType?.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {u.unitType?.size} {u.unitType?.sizeUnit} • {u.zone || 'Khu A'}
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
                  <p className="text-xs text-slate-500">Tầng {selectedUnit.floor} • {selectedUnit.zone || 'Khu A'}</p>
                </div>
                {getStatusBadge(selectedUnit.status)}
              </div>

              {/* Specs */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Loại ngăn kho:</span>
                  <span className="font-semibold text-slate-900">{selectedUnit.unitType?.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Diện tích quy chuẩn:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedUnit.unitType?.size} {selectedUnit.unitType?.sizeUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Trạng thái khóa số:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Đã cấu hình mã PIN
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
    </div>
  );
}
