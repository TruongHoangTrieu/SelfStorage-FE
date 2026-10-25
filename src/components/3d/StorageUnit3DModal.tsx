'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Maximize2,
  Box,
  Boxes,
  Lightbulb,
  DoorOpen,
  DoorClosed,
  Ruler,
  Compass,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Thermometer,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  Info,
} from 'lucide-react';
import StorageUnitScene from './StorageUnitScene';
import { resolveUnitDimensions, UnitDimensions } from './unitDimensions';

export interface StorageUnit3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: any | null;
  facilityName?: string;
  facilityId?: string | number;
}

export default function StorageUnit3DModal({
  isOpen,
  onClose,
  unit,
  facilityName,
  facilityId,
}: StorageUnit3DModalProps) {
  const router = useRouter();

  const [isDoorOpen, setIsDoorOpen] = useState(true); // Default open so customer immediately sees interior
  const [isLightOn, setIsLightOn] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'iso' | 'top' | 'interior' | null>('iso');

  // Compute accurate dimensions for this specific unit
  const dimensions: UnitDimensions = resolveUnitDimensions(unit);

  // Reset states when a new unit is opened
  useEffect(() => {
    if (isOpen) {
      setIsDoorOpen(true);
      setIsLightOn(true);
      setShowItems(true);
      setShowRulers(true);
      setCameraPreset('iso');
    }
  }, [isOpen, unit?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !unit) return null;

  const price = Number(unit.price ?? unit.monthlyRent ?? unit.pricePerMonth ?? unit.depositAmount) || 0;
  const deposit = Number(unit.depositAmount ?? price) || 0;
  const isAvailable = (unit.availableUnits ?? 1) > 0;
  const isClimate = Boolean(
    unit.climateControlled ||
    unit.name?.toLowerCase().includes('mát') ||
    unit.name?.toLowerCase().includes('máy lạnh') ||
    unit.description?.toLowerCase().includes('máy lạnh') ||
    unit.code?.toLowerCase().includes('climate')
  );

  const handleBookNow = () => {
    onClose();
    if (facilityId) {
      router.push(`/book/${facilityId}?unitTypeId=${unit.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[900px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* 1. MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {unit.name || 'Mô Hình Phòng Kho 3D'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wide">
                  3D Interactive Model
                </span>
                {isClimate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    Kho Mát 23–25°C
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>{facilityName ? `Cơ sở: ${facilityName}` : 'Hệ thống kho tự quản thông minh 24/7'}</span>
                <span>•</span>
                <span className="text-orange-400 font-semibold">Tỉ lệ kích thước chuẩn 1:1</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 shrink-0"
            title="Đóng cửa sổ 3D (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MAIN 3D VIEWPORT & CONTROL OVERLAY */}
        <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-[#0b1120] to-slate-950 overflow-hidden">
          
          {/* THREE.JS CANVAS */}
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

          {/* TOP-LEFT FLOATING HUD: ACCURATE DIMENSIONS BADGE */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none max-w-xs sm:max-w-sm">
            <div className="bg-slate-900/85 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shadow-xl space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-blue-400" />
                  Kích thước thực tế
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-600/40 text-blue-300 font-black text-xs border border-blue-500/40">
                  {dimensions.volumeM3} m³ (~{dimensions.areaM2} m²)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Rộng (W)</div>
                  <div className="font-black text-white text-sm tabular-nums">{dimensions.width}m</div>
                </div>
                <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Sâu (D)</div>
                  <div className="font-black text-white text-sm tabular-nums">{dimensions.depth}m</div>
                </div>
                <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Cao (H)</div>
                  <div className="font-black text-white text-sm tabular-nums">{dimensions.height}m</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 leading-snug pt-1 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{dimensions.capacitySummary}</span>
              </div>
            </div>
          </div>

          {/* TOP-RIGHT FLOATING HUD: CAMERA PRESETS */}
          <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
            <button
              onClick={() => setCameraPreset('iso')}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-left cursor-pointer"
              title="Góc nhìn 3D Isometric"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Góc 3D</span>
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-left cursor-pointer"
              title="Góc nhìn thẳng trực diện"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trực diện</span>
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-left cursor-pointer"
              title="Góc nhìn từ trên cao xuống"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Nhìn từ trên</span>
            </button>
            <button
              onClick={() => setCameraPreset('interior')}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-left cursor-pointer"
              title="Nhìn vào bên trong kho"
            >
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>Bên trong</span>
            </button>
          </div>

          {/* BOTTOM FLOATING CONTROLS BAR */}
          <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-2 pointer-events-auto flex-wrap justify-center">
              {/* DOOR TOGGLE */}
              <button
                onClick={() => setIsDoorOpen((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  isDoorOpen
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isDoorOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
                <span>{isDoorOpen ? 'Đóng Cửa Kho' : 'Mở Cửa Kho'}</span>
              </button>

              {/* CEILING LIGHT TOGGLE */}
              <button
                onClick={() => setIsLightOn((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  isLightOn
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>{isLightOn ? 'Đèn LED Bật' : 'Bật Đèn LED'}</span>
              </button>

              {/* INTERIOR ITEMS TOGGLE */}
              <button
                onClick={() => setShowItems((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  showItems
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>{showItems ? 'Ẩn Đồ Đạc' : 'Xếp Thử Đồ'}</span>
              </button>

              {/* RULERS TOGGLE */}
              <button
                onClick={() => setShowRulers((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  showRulers
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>{showRulers ? 'Thước Đo 3D' : 'Hiện Thước Đo'}</span>
              </button>
            </div>
          </div>

          {/* HINT OVERLAY: Drag to rotate */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-80 text-[11px] text-slate-300 bg-slate-900/80 px-3.5 py-1.5 rounded-full backdrop-blur border border-slate-700/60 shadow-lg hidden md:block">
            🖱️ Nhấp giữ chuột để xoay 360° • Cuộn chuột để phóng to/thu nhỏ
          </div>
        </div>

        {/* 3. MODAL FOOTER & BOOKING CTA */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Price & Items Hint */}
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Giá thuê niêm yết:</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-orange-400 tabular-nums">
                  {price.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-xs text-slate-400 font-medium">/ tháng</span>
              </div>
            </div>

            <div className="border-l border-slate-800 pl-4 hidden md:block">
              <div className="text-[11px] text-slate-400 font-semibold">Tiền cọc giữ chỗ:</div>
              <div className="text-base font-bold text-slate-200 tabular-nums">
                {deposit.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="border-l border-slate-800 pl-4 hidden lg:block max-w-sm">
              <div className="text-[11px] text-slate-400 font-semibold mb-1">Đồ đạc xếp vừa kho:</div>
              <div className="flex flex-wrap gap-1">
                {dimensions.recommendedItems.slice(0, 3).map((it, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700"
                  >
                    ✓ {it}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-center"
            >
              Đóng Lại
            </button>

            {facilityId && (
              <button
                onClick={handleBookNow}
                disabled={!isAvailable}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isAvailable
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{isAvailable ? 'Đặt Thuê Ngăn Kho Này' : 'Hiện Đã Kín Chỗ'}</span>
                {isAvailable && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
