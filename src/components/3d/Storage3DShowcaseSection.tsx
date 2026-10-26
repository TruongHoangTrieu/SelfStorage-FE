'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Boxes,
  Maximize2,
  DoorOpen,
  DoorClosed,
  Lightbulb,
  Ruler,
  Compass,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Clock,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react';
import StorageUnitScene from './StorageUnitScene';
import { resolveUnitDimensions, UnitDimensions } from './unitDimensions';

interface UnitPreset {
  id: string;
  name: string;
  badge: string;
  sizeCBM: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  priceHint: string;
  depositHint: string;
  idealFor: string;
  items: string[];
}

const PRESETS: UnitPreset[] = [
  {
    id: 'mini',
    name: 'Kho Mini Locker',
    badge: 'Cá nhân & Hồ sơ',
    sizeCBM: '1 – 2 CBM',
    dimensions: { width: 1.0, depth: 1.0, height: 1.4 },
    priceHint: 'Từ 450.000 đ/tháng',
    depositHint: '450.000 đ',
    idealFor: 'Lưu trữ tài liệu, 2 vali du lịch cỡ lớn, túi gậy golf, balo, thiết bị cá nhân.',
    items: ['2 vali du lịch cỡ lớn', '4 thùng carton tiêu chuẩn', 'Tài liệu & balo', 'Túi gậy golf'],
  },
  {
    id: 'small',
    name: 'Kho Tiêu Chuẩn S',
    badge: 'Phòng trọ & Sinh viên',
    sizeCBM: '3 – 5 CBM',
    dimensions: { width: 1.4, depth: 1.6, height: 2.2 },
    priceHint: 'Từ 1.200.000 đ/tháng',
    depositHint: '1.200.000 đ',
    idealFor: 'Đồ đạc phòng trọ, 15 thùng đồ cá nhân, xe đạp gấp, quạt cây, lò vi sóng, bàn xếp.',
    items: ['10-15 thùng đồ carton', 'Xe đạp gấp gọn', 'Kệ sắt 3 tầng', 'Quạt cây & máy hút bụi'],
  },
  {
    id: 'medium',
    name: 'Kho Gia Đình M',
    badge: 'Căn hộ 1–2 phòng ngủ',
    sizeCBM: '10 – 15 CBM',
    dimensions: { width: 2.4, depth: 2.6, height: 2.6 },
    priceHint: 'Từ 2.800.000 đ/tháng',
    depositHint: '2.800.000 đ',
    idealFor: 'Nội thất căn hộ 1-2PN: sofa bọc nỉ, tủ lạnh, máy giặt, giường gấp, nệm, 30+ thùng đồ.',
    items: ['Sofa & bàn trà', 'Tủ lạnh & máy giặt', '30+ thùng carton', 'Tủ quần áo tháo lắp'],
  },
  {
    id: 'xl',
    name: 'Kho Doanh Nghiệp XL',
    badge: 'Shop TMĐT & Phân phối',
    sizeCBM: '25 – 35 CBM',
    dimensions: { width: 3.0, depth: 3.6, height: 2.8 },
    priceHint: 'Từ 5.500.000 đ/tháng',
    depositHint: '5.500.000 đ',
    idealFor: 'Kho hàng kinh doanh online, xe máy cá nhân, pallet hàng hóa, kệ sắt kho 4 tầng.',
    items: ['1 Xe máy', 'Pallet hàng hóa TMĐT', 'Hệ thống kệ kho 4 tầng', '60+ kiện hàng lớn'],
  },
];

export default function Storage3DShowcaseSection() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('small');
  const [isDoorOpen, setIsDoorOpen] = useState(true);
  const [isLightOn, setIsLightOn] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'iso' | 'top' | 'interior'>('iso');
  const [resetSignal, setResetSignal] = useState<number>(0);

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[1],
    [selectedPresetId]
  );

  // Stable dimensions reference using useMemo to prevent unnecessary scene recreation
  const dimensions: UnitDimensions = useMemo(
    () =>
      resolveUnitDimensions({
        name: activePreset.name,
        width: activePreset.dimensions.width,
        depth: activePreset.dimensions.depth,
        height: activePreset.dimensions.height,
      }),
    [
      activePreset.id,
      activePreset.name,
      activePreset.dimensions.width,
      activePreset.dimensions.depth,
      activePreset.dimensions.height,
    ]
  );

  return (
    <section id="3d-showcase" className="w-full bg-[#f8fafc] py-16 sm:py-20 border-y border-slate-200/80 font-sans relative">
      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
        
        {/* 1. TOP HEADER & PRESETS BAR */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 font-sans">
                Mô Hình 3D Trực Quan
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500 font-sans">
                Tỉ lệ chuẩn 1:1
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-sans">
              Khám Phá Phòng Kho 3D Tương Tác
            </h2>
            
          </div>

          {/* SIZE SELECTOR TABS */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs w-full xl:w-auto">
            {PRESETS.map((p) => {
              const isSelected = p.id === selectedPresetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    setIsDoorOpen(true);
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center font-sans ${
                    isSelected
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 font-black shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="block leading-snug">{p.name}</span>
                  <span className="block text-[11px] text-slate-400 font-semibold mt-0.5">
                    {p.sizeCBM}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MAIN 3D STUDIO - ALIGNED PERFECTLY WITH THE HEADER */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-12 w-full divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 items-stretch min-h-[640px] xl:min-h-[700px]">
            
            {/* LEFT COLUMN: 3D WEBGL VIEWER (Cols 7 or 8) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-[#f8fafc] relative">
              
              {/* TOP HUD: DIMENSIONS BADGE & CAMERA ANGLES */}
              <div className="px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 backdrop-blur-md z-10 shrink-0">
                {/* Current Unit Badge */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold shadow-2xs">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 font-sans text-sm">
                      {activePreset.name}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 font-sans">
                      Rộng {dimensions.width}m × Sâu {dimensions.depth}m × Cao {dimensions.height}m ({dimensions.volumeM3} m³)
                    </div>
                  </div>
                </div>

                {/* Camera Angle Buttons (Góc 3D, Trực diện, Từ trên, Vào trong) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('iso');
                      setResetSignal((prev) => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans ${
                      cameraPreset === 'iso'
                        ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Góc 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('front');
                      setResetSignal((prev) => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans ${
                      cameraPreset === 'front'
                        ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Trực diện</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('top');
                      setResetSignal((prev) => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans ${
                      cameraPreset === 'top'
                        ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Từ trên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('interior');
                      setResetSignal((prev) => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-sans ${
                      cameraPreset === 'interior'
                        ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Bên trong</span>
                  </button>
                </div>
              </div>

              {/* THREE.JS CANVAS STAGE - EXPANSIVE STUDIO HEIGHT */}
              <div className="w-full flex-1 relative min-h-[480px] sm:min-h-[540px] lg:min-h-[600px] xl:min-h-[660px] bg-[#f8fafc]">
                <StorageUnitScene
                  dimensions={dimensions}
                  isDoorOpen={isDoorOpen}
                  onToggleDoor={() => setIsDoorOpen((prev) => !prev)}
                  isLightOn={isLightOn}
                  showItems={showItems}
                  showRulers={showRulers}
                  cameraPreset={cameraPreset}
                  resetSignal={resetSignal}
                  onUserOrbit={() => {}}
                />

                {/* FLOATING ACTION TOOLBAR AT BOTTOM OF CANVAS */}
                <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/90 shadow-xl flex items-center gap-2 pointer-events-auto flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => setIsDoorOpen((prev) => !prev)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs font-sans ${
                        isDoorOpen
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isDoorOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                      <span>{isDoorOpen ? 'Đóng Cửa Kho' : 'Mở Cửa Kho'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLightOn((prev) => !prev)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs font-sans ${
                        isLightOn
                          ? 'bg-amber-500 text-slate-950 font-black hover:bg-amber-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{isLightOn ? 'Đèn LED Bật' : 'Bật Đèn LED'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowItems((prev) => !prev)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs font-sans ${
                        showItems
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>{showItems ? 'Ẩn Đồ Đạc' : 'Xếp Thử Đồ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRulers((prev) => !prev)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs font-sans ${
                        showRulers
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{showRulers ? 'Thước Đo 3D' : 'Hiện Thước'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCameraPreset('iso');
                        setIsDoorOpen(true);
                        setIsLightOn(true);
                        setShowItems(true);
                        setShowRulers(true);
                        setResetSignal((prev) => prev + 1);
                      }}
                      title="Đặt lại góc nhìn mặc định"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs font-sans bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Đặt lại</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FOOTER HELPER STRIP */}
              <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center flex items-center justify-center gap-3 shrink-0 select-none flex-wrap font-sans">
                <span>Dùng chuột xoay 360° để xem mọi góc nhìn</span>
                <span>•</span>
                <span>Cuộn chuột để phóng to/thu nhỏ</span>
                <span>•</span>
                <span className="text-orange-600 font-semibold">Tỉ lệ mô phỏng chuẩn xác 1:1</span>
              </div>
            </div>

            {/* RIGHT COLUMN: SPECS, ITEMS & CTA (Cols 5 or 4) */}
            <div className="lg:col-span-5 xl:col-span-4 p-6 sm:p-8 xl:p-10 flex flex-col justify-between bg-white overflow-y-auto">
              <div className="space-y-6">
                
                {/* Header info */}
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 font-sans inline-block">
                    {activePreset.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 leading-tight font-sans tracking-tight">
                    {activePreset.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed font-sans font-medium">
                    {activePreset.idealFor}
                  </p>
                </div>

                {/* Accurate Dimension Numbers */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-sans">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-600" />
                    <span>Số đo thực tế trên mô hình</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-xs text-slate-500 font-bold">Rộng (W)</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums mt-0.5">
                        {dimensions.width} m
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-xs text-slate-500 font-bold">Sâu (D)</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums mt-0.5">
                        {dimensions.depth} m
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-xs text-slate-500 font-bold">Cao (H)</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 tabular-nums mt-0.5">
                        {dimensions.height} m
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-200/70">
                    <span className="text-slate-500 font-medium">Thể tích lưu trữ:</span>
                    <span className="font-black text-orange-600">{dimensions.volumeM3} m³ (CBM)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Diện tích mặt sàn:</span>
                    <span className="font-bold text-slate-800">{dimensions.areaM2} m²</span>
                  </div>
                </div>

                {/* Stored items checklist */}
                <div className="space-y-2.5 font-sans">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span>Đồ đạc xếp vừa vặn vào kho:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {activePreset.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-700 border border-slate-200/70 font-medium"
                      >
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key facility specs */}
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700 font-sans font-semibold">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Smart PIN 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <Thermometer className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Kho mát 23–25°C</span>
                  </div>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="pt-6 border-t border-slate-200/80 mt-6 space-y-3.5 font-sans">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">Giá thuê tham khảo:</span>
                  <span className="text-2xl font-black text-orange-600 tracking-tight">{activePreset.priceHint}</span>
                </div>

                <Link
                  href="/locations"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 transition-all text-center cursor-pointer font-sans"
                >
                  <span>XEM CƠ SỞ &amp; ĐẶT KHO NGAY</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
