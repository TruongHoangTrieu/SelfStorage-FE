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
    <section id="3d-showcase" className="py-12 sm:py-16 bg-[#f8fafc] border-y border-slate-200">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* UNIFIED ALL-IN-ONE STUDIO CARD (TẤT CẢ TRONG 1 KHUNG GỌN GÀNG) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/50 overflow-hidden">
          
          {/* 1. INTEGRATED HEADER BAR */}
          <div className="px-5 sm:px-8 py-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                  Mô Hình 3D Trực Quan
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">
                  Tỉ lệ chuẩn 1:1
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Khám Phá Phòng Kho 3D Tương Tác
              </h2>
            </div>

            {/* SIZE SELECTOR TABS */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 w-full lg:w-auto">
              {PRESETS.map((p) => {
                const isSelected = p.id === selectedPresetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPresetId(p.id);
                      setIsDoorOpen(true);
                    }}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60 font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="block text-[10px] text-slate-600 font-semibold mt-0.5">
                      {p.sizeCBM}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MAIN STUDIO BODY: 3D VIEWPORT (LEFT) + SPECS & CTA (RIGHT) */}
          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 items-stretch">
            
            {/* LEFT COLUMN: 3D WEBGL VIEWER (Cols 7 or 8) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-[#f8fafc] relative">
              
              {/* TOP HUD: DIMENSIONS BADGE & CAMERA ANGLES */}
              <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 bg-white/70 backdrop-blur z-10 shrink-0">
                {/* Current Unit Badge */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {activePreset.name}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      Rộng {dimensions.width}m × Sâu {dimensions.depth}m × Cao {dimensions.height}m ({dimensions.volumeM3} m³)
                    </div>
                  </div>
                </div>

                {/* Camera Angle Buttons (Góc 3D, Trực diện, Từ trên, Vào trong) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setCameraPreset('iso')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
                    onClick={() => setCameraPreset('front')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
                    onClick={() => setCameraPreset('top')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
                    onClick={() => setCameraPreset('interior')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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

              {/* THREE.JS CANVAS STAGE */}
              <div className="w-full flex-1 relative h-[380px] sm:h-[420px] lg:h-[460px] bg-[#f8fafc]">
                <StorageUnitScene
                  dimensions={dimensions}
                  isDoorOpen={isDoorOpen}
                  onToggleDoor={() => setIsDoorOpen((prev) => !prev)}
                  isLightOn={isLightOn}
                  showItems={showItems}
                  showRulers={showRulers}
                  cameraPreset={cameraPreset}
                  onUserOrbit={() => {}}
                />

                {/* FLOATING ACTION TOOLBAR AT BOTTOM OF CANVAS */}
                <div className="absolute bottom-3 inset-x-3 z-10 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-lg flex items-center gap-1.5 pointer-events-auto flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => setIsDoorOpen((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        showRulers
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{showRulers ? 'Thước Đo 3D' : 'Hiện Thước'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FOOTER HELPER STRIP (CLEAN SEPARATION, NO OVERLAP, NO EMOJIS) */}
              <div className="py-2.5 px-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center flex items-center justify-center gap-2 shrink-0 select-none">
                <span>Dùng chuột xoay 360° để xem mọi góc nhìn</span>
                <span>•</span>
                <span>Cuộn chuột để phóng to/thu nhỏ</span>
                <span>•</span>
                <span className="text-orange-600 font-semibold">Tỉ lệ mô phỏng chuẩn xác 1:1</span>
              </div>
            </div>

            {/* RIGHT COLUMN: SPECS, ITEMS & CTA (Cols 5 or 4) */}
            <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-7 flex flex-col justify-between bg-white">
              <div className="space-y-5">
                
                {/* Header info */}
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                    {activePreset.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-tight">
                    {activePreset.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {activePreset.idealFor}
                  </p>
                </div>

                {/* Accurate Dimension Numbers Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-blue-600" />
                    <span>Số đo thực tế trên mô hình</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] text-slate-600 font-bold">Rộng (W)</div>
                      <div className="text-sm font-black text-slate-900 tabular-nums">
                        {dimensions.width} m
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] text-slate-600 font-bold">Sâu (D)</div>
                      <div className="text-sm font-black text-slate-900 tabular-nums">
                        {dimensions.depth} m
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-[10px] text-slate-600 font-bold">Cao (H)</div>
                      <div className="text-sm font-black text-slate-900 tabular-nums">
                        {dimensions.height} m
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Thể tích lưu trữ:</span>
                    <span className="font-black text-orange-600">{dimensions.volumeM3} m³ (CBM)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Diện tích mặt sàn:</span>
                    <span className="font-bold text-slate-800">{dimensions.areaM2} m²</span>
                  </div>
                </div>

                {/* Stored items checklist (NO EMOJIS, CLEAN SVG CHECK) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đồ đạc xếp vừa vặn vào kho:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                    {activePreset.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-200/70"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key facility specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Smart PIN 24/7</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                    <Thermometer className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Kho mát 23–25°C</span>
                  </div>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="pt-4 border-t border-slate-100 mt-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Giá thuê tham khảo:</span>
                  <span className="text-xl font-black text-orange-600">{activePreset.priceHint}</span>
                </div>

                <Link
                  href="/locations"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-extrabold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all text-center cursor-pointer"
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
