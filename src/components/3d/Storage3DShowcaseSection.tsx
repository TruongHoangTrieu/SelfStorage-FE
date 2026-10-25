'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Boxes,
  Sparkles,
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
  CheckCircle2,
  Layers,
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
    idealFor: 'Lưu trữ tài liệu, 2 vali du lịch cỡ lớn, túi gậy golf, balo, thiết bị điện tử cá nhân.',
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
    items: ['10-15 thùng đồ', 'Xe đạp gấp gọn', 'Kệ sắt 3 tầng', 'Quạt cây & máy hút bụi'],
  },
  {
    id: 'medium',
    name: 'Kho Gia Đình M',
    badge: 'Căn hộ 1–2 phòng ngủ',
    sizeCBM: '10 – 15 CBM',
    dimensions: { width: 2.4, depth: 2.6, height: 2.6 },
    priceHint: 'Từ 2.800.000 đ/tháng',
    depositHint: '2.800.000 đ',
    idealFor: 'Nội thất căn hộ 1-2PN: sofa bọc nỉ, tủ lạnh, máy giặt, giường gấp, nệm, 30+ thùng đồ chuyển nhà.',
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
    idealFor: 'Kho hàng kinh doanh online, xe máy cá nhân, pallet hàng hóa, kệ sắt công nghiệp 4 tầng, 60+ kiện hàng.',
    items: ['1 Xe máy', 'Pallet hàng hóa TMĐT', 'Hệ thống kệ sắt kho 4 tầng', '60+ kiện hàng lớn'],
  },
];

export default function Storage3DShowcaseSection() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medium');
  const [isDoorOpen, setIsDoorOpen] = useState(true);
  const [isLightOn, setIsLightOn] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'iso' | 'top' | 'interior' | null>('iso');

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[2];

  // Resolve 3D dimensions
  const dimensions: UnitDimensions = resolveUnitDimensions({
    name: activePreset.name,
    width: activePreset.dimensions.width,
    depth: activePreset.dimensions.depth,
    height: activePreset.dimensions.height,
  });

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden border-b border-slate-800">
      {/* Background Glow & Grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
            <span>Mô Hình 3D Tương Tác Độc Quyền</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Khám Phá Phòng Kho 3D <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
              Trực Quan Từng Centimet
            </span>
          </h2>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Không còn phải đoán mò kích thước. Xoay 360°, mở cửa cuốn, bật đèn LED trần và xếp thử đồ đạc trực tiếp vào mô hình 3D thực tế trước khi đặt thuê.
          </p>

          {/* Size Preset Selector Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-800 shadow-xl max-w-2xl mx-auto">
            {PRESETS.map((p) => {
              const isSelected = p.id === selectedPresetId;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    setIsDoorOpen(true);
                  }}
                  className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="leading-tight">{p.name}</span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                    {p.sizeCBM}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Interactive Stage & Info Box */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: 3D WEBGL VIEWER (Col 8) */}
          <div className="lg:col-span-8 relative bg-slate-950/90 rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl flex flex-col min-h-[460px] sm:min-h-[560px]">
            
            {/* Top Toolbar */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg pointer-events-auto flex items-center gap-2 text-xs">
                <Box className="w-4 h-4 text-orange-400" />
                <span className="font-extrabold text-white">{activePreset.name}</span>
                <span className="text-slate-500">•</span>
                <span className="font-bold text-blue-400">
                  {dimensions.width}m x {dimensions.depth}m x {dimensions.height}m
                </span>
                <span className="text-slate-500">•</span>
                <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 font-black text-[11px]">
                  {dimensions.volumeM3} m³
                </span>
              </div>
            </div>

            {/* Top-Right Camera Angles */}
            <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-lg pointer-events-auto">
              <button
                onClick={() => setCameraPreset('iso')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Góc 3D
              </button>
              <button
                onClick={() => setCameraPreset('front')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Trực diện
              </button>
              <button
                onClick={() => setCameraPreset('top')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Từ trên
              </button>
            </div>

            {/* THREE.JS CANVAS CONTAINER */}
            <div className="w-full flex-1 relative min-h-[460px] sm:min-h-[540px]">
              <StorageUnitScene
                dimensions={dimensions}
                isDoorOpen={isDoorOpen}
                onToggleDoor={() => setIsDoorOpen((prev) => !prev)}
                isLightOn={isLightOn}
                showItems={showItems}
                showRulers={showRulers}
                cameraPreset={cameraPreset}
                onPresetHandled={() => setCameraPreset(null)}
              />

              {/* Bottom Interactive Controls (Elevated above canvas floor) */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-2 pointer-events-auto flex-wrap justify-center">
                  <button
                    onClick={() => setIsDoorOpen((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isDoorOpen
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isDoorOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                    <span>{isDoorOpen ? 'Đóng Cửa Kho' : 'Mở Cửa Kho'}</span>
                  </button>

                  <button
                    onClick={() => setIsLightOn((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isLightOn
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{isLightOn ? 'Đèn LED Bật' : 'Bật Đèn LED'}</span>
                  </button>

                  <button
                    onClick={() => setShowItems((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      showItems
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>{showItems ? 'Ẩn Đồ Đạc' : 'Xếp Thử Đồ'}</span>
                  </button>

                  <button
                    onClick={() => setShowRulers((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      showRulers
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{showRulers ? 'Thước Đo 3D' : 'Hiện Thước'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction footnote strictly below canvas with its own background & border */}
            <div className="py-2.5 px-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2 shrink-0 select-none">
              <span>🖱️ Dùng chuột xoay 360° để xem mọi ngóc ngách kho</span>
              <span>•</span>
              <span className="text-orange-400 font-semibold">Tỉ lệ mô phỏng chuẩn xác 1:1</span>
            </div>
          </div>

          {/* RIGHT: UNIT SPECS & CAPACITY DETAILS (Col 4) */}
          <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl border border-slate-800/90 p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Badge & Title */}
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {activePreset.badge}
                </span>
                <h3 className="text-2xl font-black text-white mt-2 leading-snug">
                  {activePreset.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {activePreset.idealFor}
                </p>
              </div>

              {/* Exact Dimension Box */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-orange-400" />
                  <span>Thông số kích thước chuẩn</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-semibold">Chiều Rộng</div>
                    <div className="text-base font-black text-white tabular-nums">{dimensions.width} m</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-semibold">Chiều Sâu</div>
                    <div className="text-base font-black text-white tabular-nums">{dimensions.depth} m</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-semibold">Chiều Cao</div>
                    <div className="text-base font-black text-white tabular-nums">{dimensions.height} m</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                  <span className="text-slate-400">Thể tích chứa đồ:</span>
                  <span className="font-black text-orange-400 text-sm">{dimensions.volumeM3} m³ (CBM)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Diện tích mặt sàn:</span>
                  <span className="font-bold text-slate-200">{dimensions.areaM2} m²</span>
                </div>
              </div>

              {/* Recommended Items List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-blue-400" />
                  <span>Đồ đạc xếp vừa vặn vào kho:</span>
                </div>
                <div className="space-y-1.5">
                  {activePreset.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 text-xs text-slate-200 border border-slate-700/40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Features Mini */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/30 border border-slate-700/40">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ra vào 24/7 Smart PIN</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/30 border border-slate-700/40">
                  <Thermometer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Kho máy lạnh 23–25°C</span>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="pt-6 border-t border-slate-800 mt-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-semibold">Giá thuê tham khảo:</span>
                <span className="text-xl font-black text-orange-400">{activePreset.priceHint}</span>
              </div>

              <Link
                href="/locations"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-extrabold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all text-center cursor-pointer hover:scale-[1.02]"
              >
                <span>XEM CƠ SỞ &amp; ĐẶT KHO NGAY</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
