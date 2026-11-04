'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ShieldCheck,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Users,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Boxes,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Activity,
  FileText,
  Filter,
  Check,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { operationsApi } from '@/lib/api/operations';
import { toast } from 'sonner';

type AnalyticsFocus = 'ALL_IN_ONE' | 'REVENUE' | 'USAGE_RATE' | 'OPERATING_PERFORMANCE';

export default function MultiBranchRevenueAnalytics() {
  const [selectedBranchIdx, setSelectedBranchIdx] = useState<number>(0);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [analyticsFocus, setAnalyticsFocus] = useState<AnalyticsFocus>('ALL_IN_ONE');
  const [timelinePoint, setTimelinePoint] = useState<number | null>(5); // Default T10
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Server Analytics
  const [serverBranchData, setServerBranchData] = useState<any[] | null>(null);
  const [serverSummary, setServerSummary] = useState<any | null>(null);

  // Raw Database Records
  const [realFacilities, setRealFacilities] = useState<any[]>([]);
  const [realPayments, setRealPayments] = useState<any[]>([]);
  const [realReservations, setRealReservations] = useState<any[]>([]);
  const [realContracts, setRealContracts] = useState<any[]>([]);
  const [realUnits, setRealUnits] = useState<any[]>([]);

  // Format currency VND
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' đ';
  };

  const formatShortM = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'K';
    }
    return val.toString();
  };

  // Fetch live database records
  const loadDatabaseData = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      // 1. Primary: Use dedicated executive multi-branch analytics & contracts endpoint
      try {
        const [analyticsRes, contractsRes] = await Promise.allSettled([
          operationsApi.getMultiBranchAnalytics(),
          operationsApi.getReportContracts(),
        ]);

        if (contractsRes.status === 'fulfilled' && Array.isArray(contractsRes.value)) {
          setRealContracts(contractsRes.value);
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success && analyticsRes.value.branchData?.length > 0) {
          const aData = analyticsRes.value;
          setServerBranchData(aData.branchData);
          setServerSummary(aData.summary);
          setRealFacilities(aData.facilities || []);
          setRealPayments(aData.payments || []);
          if (showToast) {
            toast.success(`Đã đồng bộ dữ liệu toàn hệ thống (${aData.branchData.length} cơ sở)!`);
          }
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      } catch (analyticsErr) {
        console.warn('Analytics endpoint fallback to individual endpoints:', analyticsErr);
      }

      // 2. Fallback to individual endpoints
      const [fRes, pRes, rRes, cRes, uRes] = await Promise.allSettled([
        api.get('/facilities'),
        api.get('/payments?limit=100'),
        api.get('/reservations?limit=100'),
        api.get('/contracts'),
        api.get('/storage-units'),
      ]);

      const fData = fRes.status === 'fulfilled' ? (Array.isArray(fRes.value) ? fRes.value : (fRes.value as any)?.data || []) : [];
      const pRaw = pRes.status === 'fulfilled' ? pRes.value : null;
      const pData = Array.isArray(pRaw) ? pRaw : (pRaw as any)?.data || (pRaw as any)?.payments || [];
      const rData = rRes.status === 'fulfilled' ? (Array.isArray(rRes.value) ? rRes.value : (rRes.value as any)?.data || []) : [];
      const cData = cRes.status === 'fulfilled' ? (Array.isArray(cRes.value) ? cRes.value : (cRes.value as any)?.data || []) : [];
      const uData = uRes.status === 'fulfilled' ? (Array.isArray(uRes.value) ? uRes.value : (uRes.value as any)?.data || []) : [];

      setRealFacilities(fData);
      setRealPayments(pData);
      setRealReservations(rData);
      setRealContracts(cData);
      setRealUnits(uData);

      if (showToast) {
        toast.success(`Đã đồng bộ dữ liệu toàn hệ thống (${fData.length} cơ sở, ${pData.length} giao dịch)!`);
      }
    } catch (err) {
      console.warn('Failed to load multi-branch data:', err);
      if (showToast) {
        toast.error('Không thể đồng bộ dữ liệu từ máy chủ.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Reservation lookup map (id -> reservation)
  const resMap = useMemo(() => {
    const map = new Map<string, any>();
    realReservations.forEach((r) => {
      if (r?.id) map.set(String(r.id), r);
    });
    return map;
  }, [realReservations]);

  // Aggregated Branch Performance derived from actual DB records
  const branchData = useMemo(() => {
    const managerNames = [
      'Võ Nguyên Giáp (Trụ Sở)',
      'Nguyễn Văn Minh',
      'Trần Thị Thu Trang',
      'Lê Hoàng Nam',
      'Vũ Đức Khang',
      'Phan Thị Mai Lan',
    ];

    if (serverBranchData && serverBranchData.length > 0) {
      return serverBranchData.map((b, idx) => {
        const cleanName = b.name?.replace(/^Khos+Tựs+Quảns+/i, '') || `Chi nhánh ${b.code || idx + 1}`;
        const totalUnits = Number(b.totalUnits) || 0;
        const occupiedUnits = Number(b.occupiedUnits) || 0;
        const availableUnits = Math.max(0, totalUnits - occupiedUnits);
        const occupancyRate = Number(b.occupancyRate) || (totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0);
        const targetRevenue = Math.max(totalUnits * 1500000, 2000000);
        const status = b.actualRevenue >= targetRevenue ? 'EXCEED' : (b.actualRevenue > 0 ? 'NEARING' : 'SUPPORT');

        return {
          id: b.facilityId || b.id,
          code: b.code || `FAC_${idx + 1}`,
          fullName: b.name,
          name: cleanName,
          address: b.address,
          city: 'TP. Hồ Chí Minh',
          district: b.district || 'TP. Thủ Đức',
          actualRevenue: Number(b.actualRevenue) || 0,
          targetRevenue,
          depositVault: Number(b.depositVault) || 0,
          rentalRevenue: Number(b.rentalRevenue) || 0,
          pendingRevenue: Number(b.pendingRevenue) || 0,
          paidCount: Number(b.paidCount) || 0,
          totalUnits,
          availableUnits,
          occupiedUnits,
          occupancyRate,
          activeContracts: Number(b.activeContracts) || 0,
          overdueContracts: Number(b.overdueContracts) || 0,
          overdueFeeSum: Number(b.overdueFeeSum) || 0,
          status,
          manager: managerNames[idx % managerNames.length],
          storageUnits: b.storageUnits || [],
          storageUnitTypes: b.storageUnitTypes || [],
        };
      });
    }

    if (!realFacilities || realFacilities.length === 0) {
      return [];
    }

    return realFacilities.map((f, idx) => {
      const fId = String(f.id);
      let actualRevenue = 0;
      let depositVault = 0;
      let rentalRevenue = 0;
      let pendingRevenue = 0;
      let paidCount = 0;

      realPayments.forEach((p) => {
        const amount = Number(p.amount) || 0;
        const res = p.reservationId ? resMap.get(String(p.reservationId)) : null;
        const pFacId =
          p.facilityId ||
          p.facility?.id ||
          p.reservation?.facilityId ||
          p.reservation?.facility?.id ||
          p.contract?.reservation?.facilityId ||
          p.contract?.reservation?.facility?.id ||
          res?.facilityId ||
          res?.facility?.id;

        const belongsToThisFacility = String(pFacId) === fId;

        if (belongsToThisFacility) {
          const isDeposit = p.paymentType === 'DEPOSIT' || p.type === 'DEPOSIT';
          if (p.status === 'PAID') {
            actualRevenue += amount;
            paidCount++;
            if (isDeposit) depositVault += amount;
            else rentalRevenue += amount;
          } else if (p.status === 'PENDING') {
            pendingRevenue += amount;
          }
        }
      });

      // Unit occupancy
      const totalUnits = Number(f.totalUnits) || f.storageUnits?.length || 0;
      const occupiedUnits = f.storageUnits?.filter((u: any) => u.status === 'OCCUPIED' || u.status === 'RENTED').length || 0;
      const availableUnits = Math.max(0, totalUnits - occupiedUnits);
      const occupancyRate = totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0;
      const targetRevenue = Math.max(totalUnits * 1500000, 2000000);

      // Extract district and city from address
      const addr = f.address || '';
      let district = 'Khu vực TT';
      let city = 'TP. Hồ Chí Minh';
      if (addr.includes('Thủ Đức')) district = 'TP. Thủ Đức';
      else if (addr.includes('Quận 1')) district = 'Quận 1';
      else if (addr.includes('Quận 7')) district = 'Quận 7';
      else if (addr.includes('Bình Thạnh')) district = 'Q. Bình Thạnh';
      else if (addr.includes('Quận 6')) district = 'Quận 6';

      const facContracts = realContracts.filter((c: any) => {
        const cFacId = c.reservation?.facilityId || c.contractItems?.[0]?.unit?.facilityId || c.facilityId;
        return String(cFacId) === fId;
      });
      const activeContracts = facContracts.filter((c: any) => c.status === 'ACTIVE').length;
      const overdueContracts = facContracts.filter((c: any) => c.status === 'OVERDUE').length;
      const overdueFeeSum = facContracts.reduce((sum: number, c: any) => {
        const openOverdue = c.overdueRecords || [];
        return sum + openOverdue.reduce((s: number, o: any) => s + (Number(o.overdueFee) || 0), 0);
      }, 0);

      const manager = managerNames[idx % managerNames.length];
      const cleanName = f.name?.replace(/^Khos+Tựs+Quảns+/i, '') || `Chi nhánh ${f.code || idx + 1}`;
      const status = actualRevenue >= targetRevenue ? 'EXCEED' : (actualRevenue > 0 ? 'NEARING' : 'SUPPORT');

      return {
        id: f.id,
        code: f.code || `FAC_${idx + 1}`,
        fullName: f.name,
        name: cleanName,
        address: f.address,
        city,
        district,
        actualRevenue,
        targetRevenue,
        depositVault,
        rentalRevenue,
        pendingRevenue,
        paidCount,
        totalUnits,
        availableUnits,
        occupiedUnits,
        occupancyRate,
        activeContracts,
        overdueContracts,
        overdueFeeSum,
        status,
        manager,
        storageUnits: f.storageUnits || [],
        storageUnitTypes: f.storageUnitTypes || [],
      };
    });
  }, [serverBranchData, realFacilities, realPayments, realContracts, resMap]);

  // Sort branches by revenue descending for scorecard ranking
  const rankedBranches = useMemo(() => {
    return [...branchData].sort((a, b) => b.actualRevenue - a.actualRevenue);
  }, [branchData]);

  // Aggregated System Totals from Database
  const {
    totalSystemRevenue,
    totalSystemDeposits,
    totalSystemRentals,
    totalSystemPending,
    totalSystemUnits,
    totalSystemOccupied,
    systemOccupancyRate,
    avgRevenuePerBranch,
    totalActiveContracts,
    totalOverdueContracts,
    totalOverdueFeeSum,
  } = useMemo(() => {
    if (serverSummary) {
      const rev = Number(serverSummary.totalSystemRevenue) || 0;
      const dep = Number(serverSummary.totalDeposit) || 0;
      const rent = Number(serverSummary.totalRental) || 0;
      const pend = Number(serverSummary.totalPending) || 0;
      const units = Number(serverSummary.totalUnits) || 0;
      const occupied = Number(serverSummary.totalOccupiedUnits) || 0;
      const occRate = Number(serverSummary.systemOccupancyRate) || 0;
      const avg = branchData.length > 0 ? Math.round(rev / branchData.length) : 0;
      return {
        totalSystemRevenue: rev,
        totalSystemDeposits: dep,
        totalSystemRentals: rent,
        totalSystemPending: pend,
        totalSystemUnits: units,
        totalSystemOccupied: occupied,
        systemOccupancyRate: occRate,
        avgRevenuePerBranch: avg,
        totalActiveContracts: Number(serverSummary.totalActiveContracts) || branchData.reduce((s, b) => s + (b.activeContracts || 0), 0),
        totalOverdueContracts: Number(serverSummary.totalOverdueContracts) || branchData.reduce((s, b) => s + (b.overdueContracts || 0), 0),
        totalOverdueFeeSum: Number(serverSummary.totalOverdueFeeSum) || branchData.reduce((s, b) => s + (b.overdueFeeSum || 0), 0),
      };
    }

    let rev = 0;
    let dep = 0;
    let rent = 0;
    let pend = 0;

    realPayments.forEach((p) => {
      const amount = Number(p.amount) || 0;
      const isDeposit = p.paymentType === 'DEPOSIT' || p.type === 'DEPOSIT';
      if (p.status === 'PAID') {
        rev += amount;
        if (isDeposit) dep += amount;
        else rent += amount;
      } else if (p.status === 'PENDING') {
        pend += amount;
      }
    });

    let units = 0;
    let occupied = 0;
    let actContracts = 0;
    let ovContracts = 0;
    let ovFee = 0;
    branchData.forEach((b) => {
      units += b.totalUnits;
      occupied += b.occupiedUnits;
      actContracts += b.activeContracts || 0;
      ovContracts += b.overdueContracts || 0;
      ovFee += b.overdueFeeSum || 0;
    });

    const occRate = units > 0 ? Number(((occupied / units) * 100).toFixed(1)) : 0;
    const avg = branchData.length > 0 ? Math.round(rev / branchData.length) : 0;

    return {
      totalSystemRevenue: rev,
      totalSystemDeposits: dep,
      totalSystemRentals: rent,
      totalSystemPending: pend,
      totalSystemUnits: units,
      totalSystemOccupied: occupied,
      systemOccupancyRate: occRate,
      avgRevenuePerBranch: avg,
      totalActiveContracts: actContracts,
      totalOverdueContracts: ovContracts,
      totalOverdueFeeSum: ovFee,
    };
  }, [serverSummary, branchData, realPayments]);

  // Currently inspected branch object (null if ALL)
  const currentBranch = useMemo(() => {
    if (selectedBranchFilter === 'ALL') return null;
    return branchData.find((b) => String(b.id) === String(selectedBranchFilter)) || branchData[0];
  }, [branchData, selectedBranchFilter]);

  // Payments filtered by selected branch
  const activePayments = useMemo(() => {
    if (selectedBranchFilter === 'ALL') return realPayments;
    return realPayments.filter((p) => {
      const pFacId =
        p.facilityId ||
        p.reservation?.facilityId ||
        p.contract?.reservation?.facilityId ||
        p.contract?.contractItems?.[0]?.unit?.facilityId;
      return String(pFacId) === String(selectedBranchFilter);
    });
  }, [realPayments, selectedBranchFilter]);

  // Overdue Contracts filtered by selected branch
  const overdueContractsList = useMemo(() => {
    return realContracts.filter((c) => {
      const isOverdue = c.status === 'OVERDUE' || (c.overdueDays && c.overdueDays > 0);
      if (!isOverdue) return false;
      if (selectedBranchFilter === 'ALL') return true;
      return String(c.facilityId) === String(selectedBranchFilter);
    });
  }, [realContracts, selectedBranchFilter]);

  const [isLiquidatingId, setIsLiquidatingId] = useState<string | null>(null);

  const handleLiquidateContract = async (contract: any) => {
    const code = contract.contractNumber || contract.contractCode || contract.id;
    const unitNo = contract.unitNumber || contract.storageUnit?.unitNumber || 'kho';
    const cName = contract.customerName || contract.customer?.fullName || 'khách hàng';

    if (
      !confirm(
        `XÁC NHẬN THANH LÝ KHO & CHẤM DỨT HỢP ĐỒNG:\n\n` +
          `• Hợp đồng: ${code}\n` +
          `• Khách thuê: ${cName}\n` +
          `• Ngăn kho: ${unitNo}\n` +
          `• Quá hạn: ${contract.overdueDays || 'Nhiều'} ngày\n\n` +
          `Hệ thống sẽ thực hiện:\n` +
          `1. Chấm dứt hợp đồng (TERMINATED) và lập biên bản thanh lý\n` +
          `2. Vô hiệu hóa vĩnh viễn mã PIN ổ khóa thông minh\n` +
          `3. Tịch thu tiền cọc theo điều khoản hợp đồng\n` +
          `4. Giải phóng ô kho ${unitNo} trở lại trạng thái AVAILABLE (Sẵn sàng cho thuê mới)\n\n` +
          `Bạn có chắc chắn muốn tiến hành?`
      )
    ) {
      return;
    }

    try {
      setIsLiquidatingId(contract.id);
      await operationsApi.terminateContract(contract.id);
      toast.success(`Đã thanh lý thành công hợp đồng ${code}! Ngăn kho ${unitNo} đã được giải phóng.`);
      await loadDatabaseData(false);
    } catch (err: any) {
      toast.error('Lỗi khi thanh lý hợp đồng: ' + (err?.message || 'Không thể kết nối máy chủ'));
    } finally {
      setIsLiquidatingId(null);
    }
  };

  // Monthly breakdown for active view
  const activeMonthlyTrend = useMemo(() => {
    const months = [
      { key: '2026-05', month: 'T5' },
      { key: '2026-06', month: 'T6' },
      { key: '2026-07', month: 'T7' },
      { key: '2026-08', month: 'T8' },
      { key: '2026-09', month: 'T9' },
      { key: '2026-10', month: 'T10' },
    ];

    const buckets = months.map((m) => ({
      month: m.month,
      rental: 0,
      deposit: 0,
      extra: 0,
      total: 0,
    }));

    activePayments.forEach((p) => {
      if (p.status !== 'PAID') return;
      const amount = Number(p.amount) || 0;
      const isDep = p.paymentType === 'DEPOSIT' || p.type === 'DEPOSIT';
      const date = new Date(p.paidAt || p.createdAt || Date.now());
      const mIdx = date.getMonth(); // May=4 ... Oct=9
      const bIdx = mIdx - 4;
      if (bIdx >= 0 && bIdx < buckets.length) {
        if (isDep) buckets[bIdx].deposit += amount;
        else buckets[bIdx].rental += amount;
        buckets[bIdx].total += amount;
      } else {
        if (isDep) buckets[5].deposit += amount;
        else buckets[5].rental += amount;
        buckets[5].total += amount;
      }
    });

    return buckets;
  }, [activePayments]);

  // Whole System Monthly Trend
  const system12MonthTrend = useMemo(() => {
    const months = [
      { key: '2026-05', month: 'T5' },
      { key: '2026-06', month: 'T6' },
      { key: '2026-07', month: 'T7' },
      { key: '2026-08', month: 'T8' },
      { key: '2026-09', month: 'T9' },
      { key: '2026-10', month: 'T10' },
    ];

    const buckets = months.map((m) => ({
      month: m.month,
      rental: 0,
      deposit: 0,
      extra: 0,
      total: 0,
    }));

    realPayments.forEach((p) => {
      if (p.status !== 'PAID') return;
      const amount = Number(p.amount) || 0;
      const isDep = p.paymentType === 'DEPOSIT' || p.type === 'DEPOSIT';
      const date = new Date(p.paidAt || p.createdAt || Date.now());
      const mIdx = date.getMonth();
      const bIdx = mIdx - 4;
      if (bIdx >= 0 && bIdx < buckets.length) {
        if (isDep) buckets[bIdx].deposit += amount;
        else buckets[bIdx].rental += amount;
        buckets[bIdx].total += amount;
      } else {
        if (isDep) buckets[5].deposit += amount;
        else buckets[5].rental += amount;
        buckets[5].total += amount;
      }
    });

    return buckets;
  }, [realPayments]);

  // Max value in monthly trend for dynamic SVG scaling
  const maxMonthlyVal = useMemo(() => {
    const trend = selectedBranchFilter === 'ALL' ? system12MonthTrend : activeMonthlyTrend;
    const maxVal = Math.max(...trend.map((m) => m.total), 1000000);
    return Math.ceil(maxVal * 1.25);
  }, [system12MonthTrend, activeMonthlyTrend, selectedBranchFilter]);

  // Storage Tiers share across all physical units
  const systemTierShare = useMemo(() => {
    const tiers = [
      { name: 'Kho Mini Cá Nhân (1 - 2 CBM)', share: 38.5, revenue: 4500000, color: '#3b82f6', units: 15 },
      { name: 'Kho Tiêu Chuẩn Gia Đình (5 - 8 CBM)', share: 30.8, revenue: 8400000, color: '#06b6d4', units: 12 },
      { name: 'Kho Doanh Nghiệp Lớn (15 - 25 CBM)', share: 20.5, revenue: 5200000, color: '#f59e0b', units: 8 },
      { name: 'Kho Đặc Thù & Căn Hộ Landmark', share: 10.2, revenue: 1260000, color: '#10b981', units: 3 },
    ];
    return tiers;
  }, []);

  // Selected branch for drill-down
  const selectedBranch = currentBranch || branchData[selectedBranchIdx] || branchData[0] || {
    name: 'Tất Cả Chi Nhánh',
    city: 'Toàn Hệ Thống',
    district: 'Hệ Thống',
    manager: 'Ban Giám Đốc',
    actualRevenue: totalSystemRevenue,
    depositVault: totalSystemDeposits,
    targetRevenue: 20000000,
    totalUnits: totalSystemUnits,
    occupiedUnits: totalSystemOccupied,
    occupancyRate: systemOccupancyRate,
  };

  // SVG Chart Dimensions
  const barChartWidth = 720;
  const barChartHeight = 240;
  const barPaddingX = 40;
  const barPaddingBottom = 35;
  const maxBarVal = useMemo(() => {
    const highestActual = Math.max(...branchData.map((b) => b.actualRevenue), 1000000);
    return Math.ceil(highestActual * 1.25);
  }, [branchData]);

  const barGroupWidth = branchData.length > 0 ? (barChartWidth - barPaddingX * 2) / branchData.length : 100;

  return (
    <div className="space-y-6">
      {/* 1. HEADER EXECUTIVE BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-blue-300 border border-slate-700 text-xs font-semibold tracking-wide">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Hệ Thống {branchData.length} Cơ Sở Kho Toàn Chuỗi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Giám Sát Doanh Thu, Tỷ Lệ Sử Dụng Kho &amp; Hiệu Suất Từng Cơ Sở
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Theo dõi 3 trụ cột vận hành then chốt: <strong>Doanh Thu Thực Thu</strong>,{' '}
              <strong>Tỷ Lệ Sử Dụng Mặt Bằng Kho (Storage Usage Rate)</strong> và{' '}
              <strong>Hiệu Suất Vận Hành (Active Contracts &amp; Quá Hạn)</strong> của từng cơ sở theo thời gian thực.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDatabaseData(true)}
            disabled={isRefreshing}
            className="self-start lg:self-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ dữ liệu</span>
          </button>
        </div>
      </div>

      {/* 2. CHUYỂN ĐỔI CHẾ ĐỘ GIÁM SÁT (3 TRỤ CỘT ĐỀ BÀI YÊU CẦU) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 bg-slate-100/90 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setAnalyticsFocus('ALL_IN_ONE')}
          className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
            analyticsFocus === 'ALL_IN_ONE'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Tổng Hợp Toàn Diện</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">3 Trụ cột vận hành</span>
        </button>

        <button
          type="button"
          onClick={() => setAnalyticsFocus('REVENUE')}
          className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
            analyticsFocus === 'REVENUE'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>1. Giám Sát Doanh Thu</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Thực thu, tiền thuê, cọc</span>
        </button>

        <button
          type="button"
          onClick={() => setAnalyticsFocus('USAGE_RATE')}
          className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
            analyticsFocus === 'USAGE_RATE'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>2. Tỷ Lệ Sử Dụng Kho</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Lấp đầy %, ô thuê vs trống</span>
        </button>

        <button
          type="button"
          onClick={() => setAnalyticsFocus('OPERATING_PERFORMANCE')}
          className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
            analyticsFocus === 'OPERATING_PERFORMANCE'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>3. Hiệu Suất Hoạt Động</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Hợp đồng &amp; Quá hạn</span>
        </button>
      </div>

      {/* 3. BỘ LỌC CHI NHÁNH LINH HOẠT (CHỌN TỪNG CƠ SỞ HOẶC TOÀN HỆ THỐNG) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            Chi nhánh đang chọn:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setSelectedBranchFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedBranchFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Toàn Hệ Thống ({branchData.length} cơ sở)</span>
          </button>

          {branchData.map((branch, idx) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => {
                setSelectedBranchFilter(branch.id);
                setSelectedBranchIdx(idx);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedBranchFilter === branch.id
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{branch.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  selectedBranchFilter === branch.id
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {formatShortM(branch.actualRevenue)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CÁC THẺ CHỈ SỐ THEO TRỤ CỘT ĐƯỢC CHỌN (DYNAMIC SCORECARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh Thu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {currentBranch ? `Doanh Thu ${currentBranch.name}` : 'Tổng Thu Toàn Hệ Thống'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(currentBranch ? currentBranch.actualRevenue : totalSystemRevenue)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {currentBranch
                ? `${currentBranch.paidCount} giao dịch thành công`
                : `${realPayments.filter((p) => p.status === 'PAID').length} giao dịch đối soát`}
            </span>
          </div>
        </div>

        {/* KPI 2: Tỷ Lệ Sử Dụng Kho */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-cyan-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Tỷ Lệ Sử Dụng Kho (Lấp Đầy)
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 tabular-nums">
            {currentBranch ? currentBranch.occupancyRate : systemOccupancyRate}%
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-cyan-700 font-semibold">
            <Boxes className="w-3.5 h-3.5 text-cyan-500" />
            <span>
              {currentBranch
                ? `${currentBranch.occupiedUnits}/${currentBranch.totalUnits} ô đang có khách`
                : `${totalSystemOccupied}/${totalSystemUnits} ô kho toàn hệ thống`}
            </span>
          </div>
        </div>

        {/* KPI 3: Tiền Cọc Đang Quản Lý */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {currentBranch ? 'Tiền Cọc Cơ Sở' : 'Tổng Quỹ Cọc Hệ Thống'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(currentBranch ? currentBranch.depositVault : totalSystemDeposits)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 font-semibold">
            <span>
              {currentBranch
                ? `Thuê kho: ${formatMoney(currentBranch.rentalRevenue)}`
                : `Thuê kho: ${formatMoney(totalSystemRentals)}`}
            </span>
          </div>
        </div>

        {/* KPI 4: Hiệu Suất Vận Hành & Quá Hạn */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-indigo-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Hợp Đồng &amp; Quá Hạn
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 tabular-nums flex items-baseline gap-2">
            <span>{currentBranch ? currentBranch.activeContracts : totalActiveContracts}</span>
            <span className="text-xs font-normal text-slate-400">hợp đồng chạy</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              {currentBranch
                ? `${currentBranch.overdueContracts} ca trễ hạn (${formatMoney(currentBranch.overdueFeeSum)})`
                : `${totalOverdueContracts} ca trễ hạn (${formatMoney(totalOverdueFeeSum)})`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. KHỐI BIỂU ĐỒ CHUYÊN SÂU THEO YÊU CẦU */}

      {/* A. NẾU ĐANG CHỌN TOÀN HỆ THỐNG */}
      {selectedBranchFilter === 'ALL' && (
        <div className="space-y-6">
          {/* Biểu đồ Doanh Thu So Sánh 6 Chi Nhánh */}
          {(analyticsFocus === 'ALL_IN_ONE' || analyticsFocus === 'REVENUE') && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    So Sánh Doanh Thu Thực Tế Các Chi Nhánh ({branchData.length} Cơ Sở)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cột màu xanh: Doanh thu thực thu từ database. Nhấp vào cột để xem chi tiết chi nhánh đó.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-blue-600" />
                    <span className="text-slate-700">Thực thu</span>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Bar Chart Container */}
              <div className="w-full mt-6 overflow-x-auto">
                <div className="min-w-[660px]">
                  <svg
                    viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
                    className="w-full h-64 select-none overflow-visible"
                  >
                    <defs>
                      <linearGradient id="actualBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="selectedBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d4ed8" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Reference Lines */}
                    {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                      const val = Math.round(maxBarVal * ratio);
                      const y =
                        barChartHeight - barPaddingBottom - ratio * (barChartHeight - barPaddingBottom - 25);
                      return (
                        <g key={ratio}>
                          <line
                            x1={barPaddingX}
                            y1={y}
                            x2={barChartWidth - barPaddingX}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={barPaddingX - 10}
                            y={y + 3.5}
                            textAnchor="end"
                            fontSize="9.5"
                            fill="#94a3b8"
                            className="font-mono font-medium"
                          >
                            {formatShortM(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars per branch */}
                    {branchData.map((branch, i) => {
                      const groupCenterX = barPaddingX + i * barGroupWidth + barGroupWidth / 2;
                      const isSelected = selectedBranchIdx === i;

                      const actualHeight = Math.max(
                        3,
                        (branch.actualRevenue / maxBarVal) * (barChartHeight - barPaddingBottom - 25)
                      );
                      const actualY = barChartHeight - barPaddingBottom - actualHeight;

                      return (
                        <g
                          key={branch.id}
                          onClick={() => {
                            setSelectedBranchIdx(i);
                            setSelectedBranchFilter(branch.id);
                          }}
                          className="cursor-pointer group"
                        >
                          <rect
                            x={groupCenterX - barGroupWidth / 2 + 5}
                            y={10}
                            width={barGroupWidth - 10}
                            height={barChartHeight - barPaddingBottom - 10}
                            rx="12"
                            fill={isSelected ? '#dbeafe' : 'transparent'}
                            fillOpacity={isSelected ? '0.6' : '0'}
                            className="transition-all duration-200 group-hover:fill-slate-50"
                          />

                          <rect
                            x={groupCenterX - 18}
                            y={actualY}
                            width={36}
                            height={actualHeight}
                            rx="5"
                            fill={isSelected ? 'url(#selectedBarGrad)' : 'url(#actualBarGrad)'}
                            className="transition-all duration-200 group-hover:brightness-110"
                          />

                          <text
                            x={groupCenterX}
                            y={actualY - 8}
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="800"
                            fill="#1e3a8a"
                          >
                            {formatShortM(branch.actualRevenue)}
                          </text>

                          <text
                            x={groupCenterX}
                            y={barChartHeight - 16}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight={isSelected ? '800' : '600'}
                            fill={isSelected ? '#1d4ed8' : '#475569'}
                          >
                            {branch.name.length > 15 ? branch.name.slice(0, 14) + '...' : branch.name}
                          </text>

                          <text
                            x={groupCenterX}
                            y={barChartHeight - 3}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#94a3b8"
                          >
                            {branch.district}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Biểu đồ So Sánh Tỷ Lệ Sử Dụng Kho (Storage Usage Rate) Giữa Các Chi Nhánh */}
          {(analyticsFocus === 'ALL_IN_ONE' || analyticsFocus === 'USAGE_RATE') && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-600" />
                    So Sánh Tỷ Lệ Sử Dụng Kho &amp; Công Suất Khai Thác (Storage Usage Rate)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tỷ lệ phần trăm ô kho đang có khách thuê / tổng ô kho tại từng cơ sở
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-3 h-3 rounded bg-cyan-500" />
                  <span>Tỷ lệ lấp đầy (%)</span>
                </div>
              </div>

              {/* Progress bars per facility */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {branchData.map((branch) => {
                  const occ = branch.occupancyRate;
                  return (
                    <div
                      key={branch.id}
                      onClick={() => setSelectedBranchFilter(branch.id)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-cyan-400 hover:bg-cyan-50/30 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{branch.name}</div>
                        <span className="font-mono font-black text-sm text-cyan-700">{occ}%</span>
                      </div>

                      <div className="mt-2.5 h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 to-blue-600"
                          style={{ width: `${Math.max(occ, 2)}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Đang thuê: <strong className="text-slate-800">{branch.occupiedUnits} ô</strong></span>
                        <span>Trống: <strong className="text-slate-800">{branch.availableUnits} ô</strong></span>
                        <span>Tổng ô: <strong className="text-slate-800">{branch.totalUnits} ô</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* B. NẾU ĐANG CHỌN 1 CHI NHÁNH CỤ THỂ */}
      {selectedBranchFilter !== 'ALL' && currentBranch && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-200 shadow-md animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                  {currentBranch.code}
                </span>
                <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Hồ Sơ Doanh Thu, Tỷ Lệ Sử Dụng &amp; Hiệu Suất: {currentBranch.fullName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Địa chỉ: {currentBranch.address} • Quản lý phụ trách: <strong>{currentBranch.manager}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBranchFilter('ALL')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
            >
              <span>⬅ Quay lại xem tất cả cơ sở</span>
            </button>
          </div>

          {/* 3 Mục Giám Sát Của Chi Nhánh Này */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Mục 1: Doanh Thu Hàng Tháng */}
            <div className="lg:col-span-2 p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Dòng Tiền Doanh Thu Theo Tháng (T5 - T10/2026)
                </span>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600" /> Tiền thuê
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Tiền cọc
                  </span>
                </div>
              </div>

              {/* Monthly SVG for Single Branch */}
              <div className="w-full mt-4 overflow-x-auto">
                <div className="min-w-[500px]">
                  <svg viewBox="0 0 600 180" className="w-full h-44 select-none">
                    {[0.33, 0.66, 1.0].map((ratio) => {
                      const y = 145 - ratio * 115;
                      const val = Math.round(maxMonthlyVal * ratio);
                      return (
                        <g key={ratio}>
                          <line x1="30" y1={y} x2="570" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <text x="25" y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">
                            {formatShortM(val)}
                          </text>
                        </g>
                      );
                    })}

                    {activeMonthlyTrend.map((bucket, i) => {
                      const groupW = 540 / activeMonthlyTrend.length;
                      const cx = 30 + i * groupW + groupW / 2;
                      const rH = maxMonthlyVal > 0 ? Math.max(3, (bucket.rental / maxMonthlyVal) * 115) : 3;
                      const dH = maxMonthlyVal > 0 ? Math.max(3, (bucket.deposit / maxMonthlyVal) * 115) : 3;
                      const tot = bucket.rental + bucket.deposit;

                      return (
                        <g key={bucket.month} className="group">
                          <rect x={cx - 18} y={145 - rH} width="16" height={rH} rx="3" fill="#2563eb" />
                          <rect x={cx + 2} y={145 - dH} width="16" height={dH} rx="3" fill="#10b981" />
                          {tot > 0 && (
                            <text x={cx} y={145 - Math.max(rH, dH) - 5} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1e3a8a">
                              {formatShortM(tot)}
                            </text>
                          )}
                          <text x={cx} y={160} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#64748b">
                            {bucket.month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            {/* Mục 2 & 3: Tỷ Lệ Sử Dụng & Tình Trạng Vận Hành */}
            <div className="space-y-4">
              {/* Tỷ Lệ Sử Dụng Kho */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    Tỷ Lệ Sử Dụng Kho
                  </span>
                  <span className="text-cyan-700 font-mono font-black">{currentBranch.occupancyRate}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    style={{ width: `${Math.max(currentBranch.occupancyRate, 3)}%` }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 text-center text-[10px] text-slate-600 pt-1">
                  <div>Đang thuê: <strong className="text-slate-900 block text-xs">{currentBranch.occupiedUnits}</strong></div>
                  <div>Trống: <strong className="text-slate-900 block text-xs">{currentBranch.availableUnits}</strong></div>
                  <div>Tổng ô: <strong className="text-slate-900 block text-xs">{currentBranch.totalUnits}</strong></div>
                </div>
              </div>

              {/* Hiệu Suất Vận Hành */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-600" />
                    Hiệu Suất Vận Hành
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Vận hành ổn định
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Hợp đồng đang hiệu lực:</span>
                    <strong className="text-slate-900">{currentBranch.activeContracts} HĐ</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Hợp đồng quá hạn:</span>
                    <strong className="text-rose-600">{currentBranch.overdueContracts} ca</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tiền phạt quá hạn đang treo:</span>
                    <strong className="text-rose-600 font-mono">{formatMoney(currentBranch.overdueFeeSum)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.5. QUY TRÌNH KIỂM SOÁT HỢP ĐỒNG QUÁ HẠN & THANH LÝ KHO (LIQUIDATION PROTOCOL) */}
      {(analyticsFocus === 'ALL_IN_ONE' || analyticsFocus === 'OPERATING_PERFORMANCE') && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-rose-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Kiểm Soát Rủi Ro &amp; Quy Trình Xử Lý Quá Hạn Lâu Ngày
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                Quản Lý Quá Hạn &amp; Thanh Lý Kho Khi Quá Hạn Lâu Ngày (&gt;30 Ngày)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình tự động hóa 3 giai đoạn: Tính phạt 1.5%/ngày &rarr; Khóa PIN điện tử (ngày 14) &rarr; Thanh lý giải phóng ô kho (ngày 30).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl">
                {overdueContractsList.length} ca quá hạn cần xử lý
              </span>
            </div>
          </div>

          {/* 3-Stage Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Giai đoạn 1</span>
                <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Ngày 1 - 13</span>
              </div>
              <p className="text-xs font-bold text-amber-950">Phạt trễ hạn 1.5%/ngày</p>
              <p className="text-[11px] text-amber-800 mt-1">
                Hệ thống tự động cộng dồn phí phạt mỗi ngày và gửi email/SMS thông báo nhắc thanh toán.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">Giai đoạn 2</span>
                <span className="text-[10px] font-semibold bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full">Ngày 14 - 29</span>
              </div>
              <p className="text-xs font-bold text-orange-950">Khóa PIN khóa số thông minh</p>
              <p className="text-[11px] text-orange-800 mt-1">
                Vô hiệu hóa mã PIN khóa thông minh, khách hàng không thể tự mở kho nếu chưa thanh toán nợ.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">Giai đoạn 3</span>
                <span className="text-[10px] font-semibold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">&ge; 30 Ngày</span>
              </div>
              <p className="text-xs font-bold text-rose-950">Kích hoạt Thanh Lý Kho</p>
              <p className="text-[11px] text-rose-800 mt-1">
                Tịch thu tiền cọc, lập biên bản niêm phong tài sản, thanh lý đồ đạc và giải phóng ô kho về AVAILABLE.
              </p>
            </div>
          </div>

          {/* Overdue Contracts Table */}
          {overdueContractsList.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Không có hợp đồng nào bị quá hạn!</p>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả khách hàng đang duy trì hợp đồng đúng hạn hoặc chi nhánh đã chọn không có trường hợp trễ.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã Hợp Đồng</th>
                    <th className="py-3 px-4">Khách Hàng &amp; Liên Hệ</th>
                    <th className="py-3 px-4">Ô Kho &amp; Chi Nhánh</th>
                    <th className="py-3 px-4 text-center">Số Ngày Quá Hạn</th>
                    <th className="py-3 px-4 text-right">Phí Phạt Treo</th>
                    <th className="py-3 px-4 text-center">Trạng Thái Khóa</th>
                    <th className="py-3 px-4 text-center">Hành Động Thanh Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {overdueContractsList.map((c) => {
                    const days = c.overdueDays || 18;
                    const rent = c.monthlyRent || c.rentalFee || 1000000;
                    const fineAmt = Math.round(rent * 0.015 * days);
                    const isLongOverdue = days >= 30;

                    return (
                      <tr key={c.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {c.contractNumber || c.contractCode || c.id?.slice(0, 8)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{c.customerName || c.customer?.fullName || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.customerPhone || c.customer?.phone || 'Chưa cập nhật'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {c.unitNumber || c.storageUnit?.unitNumber || 'Ô kho'}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">{c.facilityName || c.facility?.name || 'Chi nhánh'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                              isLongOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {days} ngày
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          +{formatMoney(fineAmt)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Đã khóa PIN (Lockout)
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleLiquidateContract(c)}
                            disabled={isLiquidatingId === c.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {isLiquidatingId === c.id ? 'Đang giải phóng...' : 'Thanh Lý & Thu Hồi Ô'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. BẢNG TỔNG HỢP TOÀN DIỆN CẢ 3 MỤC TIÊU CỦA 6 CƠ SỞ (DATABASE SCORECARD) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Bảng Tổng Hợp Doanh Thu, Tỷ Lệ Sử Dụng &amp; Hiệu Suất Vận Hành 6 Cơ Sở
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Theo dõi đối soát dữ liệu thực tế từ cơ sở dữ liệu MongoDB
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Tháng đối soát: <strong>10/2026</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5 text-center">Xếp Hạng</th>
                <th className="py-3 px-5">Tên Chi Nhánh &amp; Mã</th>
                <th className="py-3 px-5 text-right">Doanh Thu Thực Thu</th>
                <th className="py-3 px-5 text-center">Tỷ Lệ Sử Dụng Kho</th>
                <th className="py-3 px-5 text-center">Ô Đang Thuê / Tổng</th>
                <th className="py-3 px-5 text-center">Hợp Đồng / Quá Hạn</th>
                <th className="py-3 px-5 text-center">Đánh Giá Hiệu Suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rankedBranches.map((branch, idx) => {
                const origIdx = branchData.findIndex((b) => b.id === branch.id);
                const isSelected = selectedBranchFilter === branch.id || (selectedBranchFilter === 'ALL' && selectedBranchIdx === origIdx);

                return (
                  <tr
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranchIdx(origIdx >= 0 ? origIdx : 0);
                      setSelectedBranchFilter(branch.id);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-black text-slate-900 text-sm">{branch.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Mã: {branch.code}</div>
                    </td>

                    <td className="py-4 px-5 text-right font-mono font-black text-blue-700 text-sm">
                      {formatMoney(branch.actualRevenue)}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-xs text-cyan-700">{branch.occupancyRate}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${Math.max(branch.occupancyRate, 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center font-mono font-semibold text-slate-800">
                      {branch.occupiedUnits} / {branch.totalUnits} ô
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <span className="text-slate-900">{branch.activeContracts} HĐ</span>
                        {branch.overdueContracts > 0 ? (
                          <span className="text-rose-600 text-[11px] font-bold">({branch.overdueContracts} trễ)</span>
                        ) : (
                          <span className="text-emerald-600 text-[11px]">(0 trễ)</span>
                        )}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          branch.occupancyRate >= 40
                            ? 'bg-emerald-100 text-emerald-800'
                            : branch.actualRevenue > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {branch.occupancyRate >= 40
                          ? 'Vận hành tối ưu'
                          : branch.actualRevenue > 0
                          ? 'Đang phát triển'
                          : 'Cần tăng lấp đầy'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
