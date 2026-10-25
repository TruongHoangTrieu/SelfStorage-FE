'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function MultiBranchRevenueAnalytics() {
  const [selectedBranchIdx, setSelectedBranchIdx] = useState<number | null>(0);
  const [timelinePoint, setTimelinePoint] = useState<number | null>(9); // default T10
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Helper format VND
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const formatShortM = (val: number) => {
    return (val / 1000000).toFixed(1) + 'M';
  };

  // 5 Branches Performance Data
  const branchData = [
    {
      id: 'fac-lm81',
      name: 'Chi nhánh Landmark 81',
      city: 'TP. Hồ Chí Minh',
      district: 'Q. Bình Thạnh',
      actualRevenue: 215400000,
      targetRevenue: 200000000,
      depositVault: 74200000,
      extraCharges: 9800000,
      totalUnits: 68,
      occupiedUnits: 58,
      occupancyRate: 85.3,
      growthMoM: '+16.2%',
      status: 'EXCEED', // Vượt chỉ tiêu
      manager: 'Nguyễn Văn Minh',
    },
    {
      id: 'fac-caugiay',
      name: 'Chi nhánh Cầu Giấy',
      city: 'Hà Nội',
      district: 'Q. Cầu Giấy',
      actualRevenue: 192800000,
      targetRevenue: 185000000,
      depositVault: 68500000,
      extraCharges: 8100000,
      totalUnits: 60,
      occupiedUnits: 51,
      occupancyRate: 85.0,
      growthMoM: '+12.4%',
      status: 'EXCEED',
      manager: 'Trần Thị Thu Trang',
    },
    {
      id: 'fac-q7',
      name: 'Chi nhánh Nam Sài Gòn Q7',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 7',
      actualRevenue: 178500000,
      targetRevenue: 170000000,
      depositVault: 62000000,
      extraCharges: 7300000,
      totalUnits: 55,
      occupiedUnits: 45,
      occupancyRate: 81.8,
      growthMoM: '+14.1%',
      status: 'EXCEED',
      manager: 'Lê Hoàng Nam',
    },
    {
      id: 'fac-thaodien',
      name: 'Chi nhánh Thảo Điền - An Phú',
      city: 'TP. Hồ Chí Minh',
      district: 'TP. Thủ Đức',
      actualRevenue: 146200000,
      targetRevenue: 150000000,
      depositVault: 51500000,
      extraCharges: 5200000,
      totalUnits: 50,
      occupiedUnits: 38,
      occupancyRate: 76.0,
      growthMoM: '+10.8%',
      status: 'NEARING', // Gần đạt
      manager: 'Vũ Đức Khang',
    },
    {
      id: 'fac-danang',
      name: 'Chi nhánh Hải Châu',
      city: 'Đà Nẵng',
      district: 'Q. Hải Châu',
      actualRevenue: 112300000,
      targetRevenue: 120000000,
      depositVault: 38800000,
      extraCharges: 4200000,
      totalUnits: 42,
      occupiedUnits: 30,
      occupancyRate: 71.4,
      growthMoM: '+8.5%',
      status: 'SUPPORT', // Cần đẩy mạnh
      manager: 'Phan Thị Mai Lan',
    },
  ];

  // Aggregated System Totals
  const totalSystemRevenue = branchData.reduce((acc, b) => acc + b.actualRevenue, 0); // 845,200,000 đ
  const totalSystemTarget = branchData.reduce((acc, b) => acc + b.targetRevenue, 0); // 825,000,000 đ
  const totalSystemDeposits = branchData.reduce((acc, b) => acc + b.depositVault, 0); // 295,000,000 đ
  const totalSystemExtra = branchData.reduce((acc, b) => acc + b.extraCharges, 0); // 34,600,000 đ
  const avgRevenuePerBranch = Math.round(totalSystemRevenue / branchData.length); // 169,040,000 đ

  // 12-Month Consolidated System Timeline
  const system12MonthTrend = [
    { month: 'T1', rental: 420, deposit: 160, extra: 18, total: 598 },
    { month: 'T2', rental: 440, deposit: 175, extra: 20, total: 635 },
    { month: 'T3', rental: 465, deposit: 190, extra: 22, total: 677 },
    { month: 'T4', rental: 490, deposit: 205, extra: 24, total: 719 },
    { month: 'T5', rental: 520, deposit: 220, extra: 26, total: 766 },
    { month: 'T6', rental: 540, deposit: 235, extra: 28, total: 803 },
    { month: 'T7', rental: 555, deposit: 250, extra: 29, total: 834 },
    { month: 'T8', rental: 570, deposit: 265, extra: 31, total: 866 },
    { month: 'T9', rental: 560, deposit: 275, extra: 32, total: 867 },
    { month: 'T10', rental: 590, deposit: 295, extra: 35, total: 920 },
    { month: 'T11*', rental: 615, deposit: 310, extra: 37, total: 962 },
    { month: 'T12*', rental: 640, deposit: 325, extra: 40, total: 1005 },
  ];

  // Storage Tiers across all branches
  const systemTierShare = [
    { name: 'Tủ Đồ Mini Cá Nhân', share: 18.5, revenue: 156400000, color: '#6366f1', units: 95 },
    { name: 'Box Tiêu Chuẩn 4-8m³', share: 34.2, revenue: 289000000, color: '#06b6d4', units: 102 },
    { name: 'Kho Gia Đình 10-15m³', share: 26.8, revenue: 226500000, color: '#f59e0b', units: 51 },
    { name: 'Kho Doanh Nghiệp & Kho Mát', share: 20.5, revenue: 173300000, color: '#10b981', units: 27 },
  ];

  // Selected branch for deep dive
  const selectedBranch = selectedBranchIdx !== null ? branchData[selectedBranchIdx] : branchData[0];

  // SVG Chart: Multi-branch comparison bar chart
  const barChartWidth = 720;
  const barChartHeight = 240;
  const barPaddingX = 40;
  const barPaddingBottom = 35;
  const maxBarVal = 240000000;

  const barGroupWidth = (barChartWidth - barPaddingX * 2) / branchData.length;
  const singleBarWidth = 28;

  return (
    <div className="space-y-6">
      {/* 1. Header & System Total Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-xs font-semibold tracking-wide">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Hệ Thống 5 Chi Nhánh Toàn Quốc • Giám Sát Tài Chính Chuỗi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Tổng Quan Tài Chính &amp; Doanh Thu Toàn Hệ Thống
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Dành cho <strong>Ban Giám Đốc Chuỗi &amp; Quản Lý Vận Hành</strong>. Tổng hợp doanh số thực tế, đối soát quỹ cọc bảo đảm, so sánh KPI và dòng tiền giữa các chi nhánh trên toàn quốc.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Xuất Báo Cáo Chuỗi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Highlight Monetary KPIs (Tổng Tiền Toàn Hệ Thống) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Gross Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-indigo-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Tổng Thu Toàn Hệ Thống (Gross)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(totalSystemRevenue)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.8% so với cùng kỳ</span>
            <span className="text-slate-400 font-normal ml-1">• 103.1% KPI chuỗi</span>
          </div>
        </div>

        {/* Metric 2: Total System Deposits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Tổng Quỹ Cọc Bảo Đảm Toàn Chuỗi
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(totalSystemDeposits)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>222 hợp đồng active • An toàn 100%</span>
          </div>
        </div>

        {/* Metric 3: Average Revenue per Branch */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Doanh Thu Bình Quân / Cơ Sở
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(avgRevenuePerBranch)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
            <span>5 cơ sở đang vận hành đồng bộ</span>
          </div>
        </div>

        {/* Metric 4: Total Extra Charges & Fines */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-cyan-400 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Tổng Phụ Phí &amp; Phạt Toàn Quốc
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tabular-nums">
            {formatMoney(totalSystemExtra)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-cyan-700 font-semibold">
            <span>Chiếm 4.1% tổng doanh số hệ thống</span>
          </div>
        </div>
      </div>

      {/* 3. Biểu đồ So Sánh Doanh Thu Giữa Các Chi Nhánh (SVG Grouped Bar Chart) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Sơ Đồ So Sánh Doanh Thu Giữa Các Chi Nhánh (Thực Thu vs Chỉ Tiêu)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cột màu xanh đậm: Thực thu chi nhánh • Cột viền kẻ: Chỉ tiêu kế hoạch kinh doanh
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-indigo-600" />
              <span className="text-slate-700">Thực thu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
              <span className="text-slate-500">Chỉ tiêu (KPI)</span>
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
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="selectedBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Lines */}
              {[50, 100, 150, 200].map((val) => {
                const y = barChartHeight - barPaddingBottom - ((val * 1000000) / maxBarVal) * (barChartHeight - barPaddingBottom - 20);
                return (
                  <g key={val}>
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
                      {val}M
                    </text>
                  </g>
                );
              })}

              {/* Bars per branch */}
              {branchData.map((branch, i) => {
                const groupCenterX = barPaddingX + i * barGroupWidth + barGroupWidth / 2;
                const isSelected = selectedBranchIdx === i;

                // Heights
                const actualHeight = ((branch.actualRevenue) / maxBarVal) * (barChartHeight - barPaddingBottom - 20);
                const actualY = barChartHeight - barPaddingBottom - actualHeight;

                const targetHeight = ((branch.targetRevenue) / maxBarVal) * (barChartHeight - barPaddingBottom - 20);
                const targetY = barChartHeight - barPaddingBottom - targetHeight;

                const kpiPercent = Math.round((branch.actualRevenue / branch.targetRevenue) * 100);

                return (
                  <g
                    key={branch.id}
                    onClick={() => setSelectedBranchIdx(i)}
                    className="cursor-pointer group"
                  >
                    {/* Hover column background */}
                    <rect
                      x={groupCenterX - barGroupWidth / 2 + 5}
                      y={10}
                      width={barGroupWidth - 10}
                      height={barChartHeight - barPaddingBottom - 10}
                      rx="12"
                      fill={isSelected ? "#e0e7ff" : "transparent"}
                      fillOpacity={isSelected ? "0.4" : "0"}
                      className="transition-all duration-200 group-hover:fill-slate-50"
                    />

                    {/* Target Bar (Left) */}
                    <rect
                      x={groupCenterX - singleBarWidth - 2}
                      y={targetY}
                      width={singleBarWidth}
                      height={targetHeight}
                      rx="6"
                      fill="#e2e8f0"
                      className="transition-all group-hover:fill-slate-300"
                    />

                    {/* Actual Revenue Bar (Right) */}
                    <rect
                      x={groupCenterX + 2}
                      y={actualY}
                      width={singleBarWidth}
                      height={actualHeight}
                      rx="6"
                      fill={isSelected ? "url(#selectedBarGrad)" : "url(#actualBarGrad)"}
                      className="transition-all duration-200 group-hover:brightness-110"
                    />

                    {/* Monetary value on top of actual bar */}
                    <text
                      x={groupCenterX + 2 + singleBarWidth / 2}
                      y={actualY - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      fill="#1e1b4b"
                    >
                      {formatShortM(branch.actualRevenue)}
                    </text>

                    {/* KPI achievement badge */}
                    <rect
                      x={groupCenterX - 22}
                      y={actualY - 26}
                      width="44"
                      height="16"
                      rx="8"
                      fill={kpiPercent >= 100 ? "#dcfce7" : "#fef3c7"}
                    />
                    <text
                      x={groupCenterX}
                      y={actualY - 14.5}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={kpiPercent >= 100 ? "#15803d" : "#b45309"}
                    >
                      {kpiPercent}%
                    </text>

                    {/* X-Axis Branch Name */}
                    <text
                      x={groupCenterX}
                      y={barChartHeight - 16}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? "800" : "600"}
                      fill={isSelected ? "#4338ca" : "#475569"}
                    >
                      {branch.name.replace('Chi nhánh ', '')}
                    </text>

                    {/* Location small label */}
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

        {/* Selected Branch Drill-down Inspector */}
        <div className="mt-5 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-slate-900">{selectedBranch.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {selectedBranch.city}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Quản lý phụ trách: <strong>{selectedBranch.manager}</strong> • Tỷ lệ lấp đầy: <strong>{selectedBranch.occupancyRate}%</strong> ({selectedBranch.occupiedUnits}/{selectedBranch.totalUnits} ô)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Doanh thu thực thu</span>
              <span className="font-black text-indigo-700 text-sm">{formatMoney(selectedBranch.actualRevenue)}</span>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Quỹ cọc đang giữ</span>
              <span className="font-black text-emerald-700 text-sm">{formatMoney(selectedBranch.depositVault)}</span>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Đạt chỉ tiêu</span>
              <span className="font-black text-emerald-600 text-sm">
                {Math.round((selectedBranch.actualRevenue / selectedBranch.targetRevenue) * 100)}% KPI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dòng Tiền 12 Tháng Toàn Chuỗi & Phân Bổ Tỷ Trọng Theo Phân Khúc */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: 12-Month Flow Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Dòng Tiền Toàn Chuỗi 12 Tháng (Tổng Hợp Các Nguồn Thu)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đơn vị: Triệu Đồng (VND) • Thể hiện xu hướng mở rộng quy mô chi nhánh
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Tiền thuê
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Quỹ cọc
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Phụ phí
                </span>
              </div>
            </div>

            {/* SVG 12-Month Stacked Visual Flow */}
            <div className="mt-5 w-full overflow-x-auto">
              <div className="min-w-[580px]">
                <svg viewBox="0 0 600 180" className="w-full h-44 select-none">
                  {/* Grid Lines */}
                  {[300, 600, 900].map((v) => {
                    const y = 160 - (v / 1100) * 140;
                    return (
                      <line
                        key={v}
                        x1="30"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke="#f8fafc"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* 12 Columns */}
                  {system12MonthTrend.map((m, idx) => {
                    const x = 40 + idx * 45;
                    const isSelected = timelinePoint === idx;

                    const totalH = (m.total / 1100) * 135;
                    const rentalH = (m.rental / 1100) * 135;
                    const depositH = (m.deposit / 1100) * 135;
                    const extraH = (m.extra / 1100) * 135;

                    const yBase = 150;
                    const rentalY = yBase - rentalH;
                    const depositY = rentalY - depositH;
                    const extraY = depositY - extraH;

                    return (
                      <g
                        key={m.month}
                        onClick={() => setTimelinePoint(idx)}
                        className="cursor-pointer group"
                      >
                        {/* Rental Stack */}
                        <rect
                          x={x - 12}
                          y={rentalY}
                          width="24"
                          height={rentalH}
                          rx="3"
                          fill="#4f46e5"
                          opacity={isSelected ? "1" : "0.85"}
                          className="transition-all"
                        />
                        {/* Deposit Stack */}
                        <rect
                          x={x - 12}
                          y={depositY}
                          width="24"
                          height={depositH}
                          rx="3"
                          fill="#10b981"
                          opacity={isSelected ? "1" : "0.85"}
                          className="transition-all"
                        />
                        {/* Extra Stack */}
                        <rect
                          x={x - 12}
                          y={extraY}
                          width="24"
                          height={extraH}
                          rx="3"
                          fill="#f59e0b"
                          opacity={isSelected ? "1" : "0.85"}
                          className="transition-all"
                        />

                        {/* Top Total Amount */}
                        <text
                          x={x}
                          y={extraY - 6}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="bold"
                          fill="#1e1b4b"
                        >
                          {m.total}M
                        </text>

                        {/* Month text */}
                        <text
                          x={x}
                          y="168"
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight={isSelected ? "bold" : "normal"}
                          fill={isSelected ? "#4338ca" : "#64748b"}
                        >
                          {m.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dấu (*) là số liệu ước tính các tháng cao điểm cuối năm</span>
            <span className="font-bold text-indigo-600">Dự phóng cả năm: ~9.8 Tỷ Đồng</span>
          </div>
        </div>

        {/* Column 3: Phân Bổ Tỷ Trọng Theo Phân Khúc Kho */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                Cơ Cấu Tỷ Trọng Doanh Thu Toàn Chuỗi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Phân theo các nhóm ô lưu trữ</p>
            </div>

            <div className="mt-5 space-y-3.5">
              {systemTierShare.map((tier) => (
                <div
                  key={tier.name}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span className="text-xs font-bold text-slate-800">{tier.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      {tier.share}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{tier.units} ô toàn chuỗi</span>
                    <span className="font-bold text-slate-800">{formatMoney(tier.revenue)}</span>
                  </div>

                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${tier.share}%`, backgroundColor: tier.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
            Tổng cộng: 275 ngăn kho vật lý trên toàn hệ thống
          </div>
        </div>
      </div>

      {/* 5. Bảng Xếp Hạng & Báo Cáo Hiệu Quả Kinh Doanh Từng Chi Nhánh */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Bảng Tổng Hợp Doanh Thu &amp; Hiệu Quả Từng Chi Nhánh (HQ Scorecard)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              So sánh kết quả thực thu so với chỉ tiêu kế hoạch được giao của từng cơ sở
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
                <th className="py-3 px-5">Tên Chi Nhánh &amp; Quản Lý</th>
                <th className="py-3 px-5">Địa Điểm</th>
                <th className="py-3 px-5 text-right">Doanh Thu Thực Thu</th>
                <th className="py-3 px-5 text-right">Chỉ Tiêu (KPI)</th>
                <th className="py-3 px-5">Tỷ Lệ Đạt KPI</th>
                <th className="py-3 px-5 text-center">Lấp Đầy</th>
                <th className="py-3 px-5 text-right">Quỹ Cọc Giữ</th>
                <th className="py-3 px-5 text-center">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {branchData.map((branch, idx) => {
                const kpiPercent = Math.round((branch.actualRevenue / branch.targetRevenue) * 100);

                return (
                  <tr
                    key={branch.id}
                    onClick={() => setSelectedBranchIdx(idx)}
                    className={`cursor-pointer transition-colors ${
                      selectedBranchIdx === idx ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-black text-slate-900 text-sm">{branch.name}</div>
                      <div className="text-[11px] text-slate-500">Quản lý: {branch.manager}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800">{branch.district}</div>
                      <div className="text-[10px] text-slate-400">{branch.city}</div>
                    </td>

                    <td className="py-4 px-5 text-right font-black text-slate-900 tabular-nums text-sm">
                      {formatMoney(branch.actualRevenue)}
                    </td>

                    <td className="py-4 px-5 text-right font-medium text-slate-500 tabular-nums">
                      {formatMoney(branch.targetRevenue)}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              kpiPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(kpiPercent, 100)}%` }}
                          />
                        </div>
                        <span className={`font-black text-xs ${
                          kpiPercent >= 100 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {kpiPercent}%
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center font-bold text-slate-800">
                      {branch.occupancyRate}%
                    </td>

                    <td className="py-4 px-5 text-right font-bold text-slate-700 tabular-nums">
                      {formatMoney(branch.depositVault)}
                    </td>

                    <td className="py-4 px-5 text-center">
                      {branch.status === 'EXCEED' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Vượt chỉ tiêu
                        </span>
                      ) : branch.status === 'NEARING' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Gần đạt KPI
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Cần hỗ trợ
                        </span>
                      )}
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
