'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Building2,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  HelpCircle,
  Download,
  Filter,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface FacilityRevenueAnalyticsProps {
  facilityName?: string;
  facilityCode?: string;
}

export default function FacilityRevenueAnalytics({
  facilityName = 'Chi nhánh Landmark 81',
  facilityCode = 'FAC-LM81',
}: FacilityRevenueAnalyticsProps) {
  // Period filter
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'half_year' | 'year'>('half_year');
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(5); // default last month (T10)
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  // Helper format VND
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  // 6-Month Monthly Trend Data for this Facility
  const monthlyData = [
    { month: 'T5/2026', revenue: 118000000, target: 115000000, deposit: 38000000, extra: 3200000, contracts: 21 },
    { month: 'T6/2026', revenue: 126500000, target: 125000000, deposit: 41000000, extra: 4100000, contracts: 22 },
    { month: 'T7/2026', revenue: 131200000, target: 130000000, deposit: 44000000, extra: 3800000, contracts: 23 },
    { month: 'T8/2026', revenue: 139800000, target: 135000000, deposit: 46500000, extra: 4800000, contracts: 24 },
    { month: 'T9/2026', revenue: 135400000, target: 140000000, deposit: 45000000, extra: 5100000, contracts: 24 },
    { month: 'T10/2026', revenue: 142500000, target: 145000000, deposit: 48200000, extra: 5400000, contracts: 25 },
  ];

  // Storage Unit Tiers Revenue Contribution for this Facility
  const unitTiers = [
    {
      name: 'Tủ Mini Locker (1-3m³)',
      color: '#6366f1', // Indigo
      bgLight: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      totalUnits: 14,
      occupiedUnits: 12,
      pricePerMonth: 1200000,
      monthlyRevenue: 28800000,
      percentage: 20.2,
      growth: '+12.5%',
    },
    {
      name: 'Box Tiêu Chuẩn (4-8m³)',
      color: '#06b6d4', // Cyan
      bgLight: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      totalUnits: 12,
      occupiedUnits: 10,
      pricePerMonth: 2800000,
      monthlyRevenue: 44800000,
      percentage: 31.4,
      growth: '+8.0%',
    },
    {
      name: 'Kho Gia Đình (10-15m³)',
      color: '#f59e0b', // Amber
      bgLight: 'bg-amber-50 border-amber-200 text-amber-700',
      totalUnits: 6,
      occupiedUnits: 5,
      pricePerMonth: 5200000,
      monthlyRevenue: 41600000,
      percentage: 29.2,
      growth: '+15.2%',
    },
    {
      name: 'Kho Mát Điều Hòa (15-25m³)',
      color: '#10b981', // Emerald
      bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      totalUnits: 4,
      occupiedUnits: 3,
      pricePerMonth: 9100000,
      monthlyRevenue: 27300000,
      percentage: 19.2,
      growth: '+5.4%',
    },
  ];

  // Recent Transactions at this Facility
  const recentTransactions = [
    {
      id: 'TXN-8841',
      unit: 'A-101',
      tenant: 'Nguyễn Văn An',
      type: 'RENTAL',
      typeLabel: 'Tiền thuê tháng 10',
      method: 'VIETQR',
      methodLabel: 'VietQR SePay',
      amount: 2800000,
      date: 'Hôm nay, 09:32',
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8840',
      unit: 'A-107',
      tenant: 'P. Q. Bảo',
      type: 'FINE',
      typeLabel: 'Phạt trễ hạn & Phụ phí',
      method: 'VNPAY',
      methodLabel: 'VNPAY QR',
      amount: 450000,
      date: 'Hôm nay, 08:15',
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8837',
      unit: 'B-204',
      tenant: 'Trần Thị Thu Thảo',
      type: 'DEPOSIT',
      typeLabel: 'Cọc bảo đảm (1.0x)',
      method: 'MOMO',
      methodLabel: 'Ví MoMo',
      amount: 5200000,
      date: 'Hôm qua, 16:40',
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8834',
      unit: 'C-301',
      tenant: 'Cty TNHH Tiếp Vận Á Châu',
      type: 'RENTAL',
      typeLabel: 'Thuê kho mát (Quý 4)',
      method: 'BANK_TRANSFER',
      methodLabel: 'Chuyển khoản Vietcombank',
      amount: 27300000,
      date: '24/10/2026',
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8829',
      unit: 'A-110',
      tenant: 'Lý Kim Yến',
      type: 'EXTRA',
      typeLabel: 'Phí vệ sinh & Trả kho',
      method: 'CASH',
      methodLabel: 'Tiền mặt quầy',
      amount: 350000,
      date: '23/10/2026',
      status: 'SUCCESS',
    },
  ];

  // SVG Chart calculation parameters
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 50;
  const paddingY = 30;
  const minVal = 100000000;
  const maxVal = 160000000;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (monthlyData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  // Generate SVG path for revenue
  const revenuePoints = monthlyData.map((d, i) => getCoordinates(i, d.revenue));
  const targetPoints = monthlyData.map((d, i) => getCoordinates(i, d.target));

  // Bezier curve generation
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const smoothRevenuePath = createSmoothPath(revenuePoints);
  const areaPath = `${smoothRevenuePath} L ${revenuePoints[revenuePoints.length - 1].x} ${chartHeight - paddingY} L ${revenuePoints[0].x} ${chartHeight - paddingY} Z`;
  const smoothTargetPath = createSmoothPath(targetPoints);

  const selectedMonthData = activeChartPoint !== null ? monthlyData[activeChartPoint] : monthlyData[monthlyData.length - 1];

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Tài Chính Chi Nhánh • {facilityName} ({facilityCode})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Giám Sát Doanh Số &amp; Dòng Tiền Cơ Sở
          </h2>
          <p className="text-xs text-slate-500">
            Dữ liệu thu chi định kỳ, quỹ cọc bảo đảm của khách hàng và biểu đồ tăng trưởng doanh thu thực tế.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeframe === 'month' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Tháng Này
            </button>
            <button
              onClick={() => setTimeframe('half_year')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeframe === 'half_year' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              6 Tháng
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeframe === 'year' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Cả Năm 2026
            </button>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.print();
              }
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Xuất bảng đối soát tài chính chi nhánh"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* 2. Key Monetary Metrics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-indigo-400 hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Doanh Thu Tháng Này
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(142500000)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.4% MoM</span>
            <span className="text-slate-400 font-normal ml-1">• Đạt 98.2% chỉ tiêu</span>
          </div>
        </div>

        {/* Metric 2: Security Deposit Vault */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quỹ Cọc Bảo Đảm Đang Giữ
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(48200000)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>25 hợp đồng active • An toàn 100%</span>
          </div>
        </div>

        {/* Metric 3: Extra Charges & Fines */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Phụ Phí &amp; Phạt Quá Hạn
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(5400000)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
            <span>12 giao dịch phụ trợ &amp; ân hạn trễ</span>
          </div>
        </div>

        {/* Metric 4: On-time collection rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-cyan-400 hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50/50 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tỷ Lệ Thu Hồi Đúng Hạn
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            96.8%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-cyan-700 font-semibold">
            <span>Chỉ còn 2 hợp đồng cần đôn đốc</span>
          </div>
        </div>
      </div>

      {/* 3. Main Diagram & Trend Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column 1 & 2: SVG Area Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Biểu Đồ Xu Hướng Doanh Thu Cơ Sở (6 Tháng Gần Nhất)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đường màu xanh: Doanh thu thực thu • Đường nét đứt màu xám: Chỉ tiêu kế hoạch
                </p>
              </div>

              {/* Point Inspector Badge */}
              <div className="px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">Mốc {selectedMonthData.month}:</span>
                <span className="text-xs font-black text-indigo-600 tabular-nums">
                  {formatMoney(selectedMonthData.revenue)}
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart Container */}
            <div className="w-full mt-4 overflow-x-auto">
              <div className="min-w-[620px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-56 select-none overflow-visible"
                >
                  <defs>
                    {/* Linear Gradient for Area Fill */}
                    <linearGradient id="facilityRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                      <stop offset="85%" stopColor="#6366f1" stopOpacity="0.02" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
                    </filter>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {[100, 120, 140, 160].map((val) => {
                    const y = chartHeight - paddingY - ((val * 1000000 - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
                    return (
                      <g key={val}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="9.5"
                          fill="#94a3b8"
                          className="font-mono font-medium"
                        >
                          {val}M
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#facilityRevenueGrad)" />

                  {/* Target Dotted Line */}
                  <path
                    d={smoothTargetPath}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />

                  {/* Revenue Smooth Line */}
                  <path
                    d={smoothRevenuePath}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3.5"
                    filter="url(#glow)"
                  />

                  {/* Data Points */}
                  {monthlyData.map((d, i) => {
                    const pt = getCoordinates(i, d.revenue);
                    const isSelected = activeChartPoint === i;

                    return (
                      <g
                        key={d.month}
                        onClick={() => setActiveChartPoint(i)}
                        className="cursor-pointer group"
                      >
                        {/* Hover trigger circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? "14" : "10"}
                          fill={isSelected ? "#6366f1" : "transparent"}
                          fillOpacity={isSelected ? "0.15" : "0"}
                          className="transition-all"
                        />
                        {/* Outer dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? "6.5" : "4.5"}
                          fill="#ffffff"
                          stroke={isSelected ? "#4338ca" : "#6366f1"}
                          strokeWidth={isSelected ? "3" : "2.5"}
                          className="transition-transform duration-200 group-hover:scale-125"
                        />

                        {/* X-Axis Month label */}
                        <text
                          x={pt.x}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight={isSelected ? "700" : "500"}
                          fill={isSelected ? "#4338ca" : "#64748b"}
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Month Inspector Footer Card */}
          <div className="mt-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {selectedMonthData.month}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Chi tiết doanh số mốc {selectedMonthData.month}: Thực thu {formatMoney(selectedMonthData.revenue)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Quỹ cọc: {formatMoney(selectedMonthData.deposit)} • Phụ phí: {formatMoney(selectedMonthData.extra)} • {selectedMonthData.contracts} hợp đồng hoạt động
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                selectedMonthData.revenue >= selectedMonthData.target
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {selectedMonthData.revenue >= selectedMonthData.target ? '✓ Vượt chỉ tiêu' : '⚠ Đạt 93% chỉ tiêu'}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Column 3: Sơ Đồ Cơ Cấu Dòng Tiền (Donut & Split Breakdown) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  Cơ Cấu Nguồn Tiền Cơ Sở
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Phân bổ dòng tiền thu về trong tháng</p>
              </div>
            </div>

            {/* Visual Segmented Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Tổng thực thu</span>
                <span className="text-slate-900">{formatMoney(142500000)}</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1">
                <div style={{ width: '78%' }} className="bg-indigo-600 rounded-full h-full" title="Tiền thuê: 78%" />
                <div style={{ width: '18%' }} className="bg-emerald-500 rounded-full h-full" title="Tiền cọc: 18%" />
                <div style={{ width: '4%' }} className="bg-amber-500 rounded-full h-full" title="Phụ phí: 4%" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Stream Breakdown Items */}
            <div className="mt-6 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-indigo-50/50 hover:border-indigo-200 transition">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Tiền Thuê Kho Định Kỳ</p>
                    <p className="text-[11px] text-slate-400">Hợp đồng thuê 1-12 tháng</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{formatMoney(111150000)}</p>
                  <p className="text-[10px] font-bold text-indigo-600">78.0% tổng thu</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-emerald-50/50 hover:border-emerald-200 transition">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cọc Bảo Đảm Phát Sinh Mới</p>
                    <p className="text-[11px] text-slate-400">Khách ký mới trong tháng</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{formatMoney(25650000)}</p>
                  <p className="text-[10px] font-bold text-emerald-600">18.0% dòng tiền</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-amber-50/50 hover:border-amber-200 transition">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Phụ Phí Dịch Vụ &amp; Tiền Phạt</p>
                    <p className="text-[11px] text-slate-400">Trễ hạn, vệ sinh, cấp thẻ mới</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{formatMoney(5700000)}</p>
                  <p className="text-[10px] font-bold text-amber-600">4.0% tổng thu</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đối soát SePay tự động:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Khớp lệnh
            </span>
          </div>
        </div>
      </div>

      {/* 4. Sơ Đồ Doanh Thu Theo Phân Khúc Loại Ô Kho (Unit Tiers Breakdown) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Doanh Số Theo Phân Loại Ô Kho Tại Chi Nhánh
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đóng góp doanh thu, tỷ lệ lấp đầy và giá thuê bình quân của từng phân khúc ô lưu trữ
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
            Tổng cộng: 36 ô kho vật lý (25/36 đang cho thuê)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {unitTiers.map((tier, idx) => {
            const occupancyRate = Math.round((tier.occupiedUnits / tier.totalUnits) * 100);

            return (
              <div
                key={tier.name}
                onMouseEnter={() => setHoveredTier(idx)}
                onMouseLeave={() => setHoveredTier(null)}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  hoveredTier === idx
                    ? 'border-indigo-400 shadow-md bg-white scale-[1.01]'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${tier.bgLight}`}>
                    {tier.percentage}% Doanh thu
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {tier.growth}
                  </span>
                </div>

                <h4 className="font-black text-sm text-slate-900 mt-3">{tier.name}</h4>

                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  {formatMoney(tier.monthlyRevenue)}
                </div>

                {/* Occupancy bar */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Tỷ lệ lấp đầy:</span>
                    <span className="text-slate-800">{tier.occupiedUnits}/{tier.totalUnits} ô ({occupancyRate}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${occupancyRate}%`, backgroundColor: tier.color }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Đơn giá niêm yết:</span>
                  <span className="font-bold text-slate-700">{formatMoney(tier.pricePerMonth)}/tháng</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Facility Payment Ledger (Sổ quỹ giao dịch thu tiền) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Sổ Quỹ Giao Dịch Thu Tiền Gần Nhất Tại Chi Nhánh
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cập nhật tức thì các khoản thanh toán qua VietQR SePay, chuyển khoản ngân hàng và quầy tiếp đón
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SePay Webhook Online
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Mã Giao Dịch</th>
                <th className="py-3 px-5">Ô Kho</th>
                <th className="py-3 px-5">Khách Hàng</th>
                <th className="py-3 px-5">Khoản Mục Thu</th>
                <th className="py-3 px-5">Cổng Thanh Toán</th>
                <th className="py-3 px-5">Thời Gian</th>
                <th className="py-3 px-5 text-right">Số Tiền</th>
                <th className="py-3 px-5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900 tabular-nums">
                    {tx.id}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {tx.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-800">
                    {tx.tenant}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-medium">
                    {tx.typeLabel}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {tx.methodLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 text-[11px]">
                    {tx.date}
                  </td>
                  <td className="py-3.5 px-5 text-right font-black text-slate-900 tabular-nums text-sm">
                    {formatMoney(tx.amount)}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Đã ghi sổ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
