'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
  Eye,
  Check,
  Thermometer,
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

  const [isDoorOpen, setIsDoorOpen] = useState(true);
  const [isLightOn, setIsLightOn] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'iso' | 'top' | 'interior'>('iso');

  // Compute accurate dimensions with useMemo to keep reference stable
  const dimensions: UnitDimensions = useMemo(() => {
    return resolveUnitDimensions(unit);
  }, [unit]);

  useEffect(() => {
    if (isOpen) {
      setIsDoorOpen(true);
      setIsLightOn(true);
      setShowItems(true);
      setShowRulers(true);
      setCameraPreset('iso');
    }
  }, [isOpen, unit?.id]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[860px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* 1. MODAL HEADER (LIGHT THEME) */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {unit.name || 'Mô Hình Phòng Kho 3D'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  Mô hình 3D thực tế
                </span>
                {isClimate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-sky-600" />
                    Kho Mát 23–25°C
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>{facilityName ? `Cơ sở: ${facilityName}` : 'Hệ thống kho tự quản thông minh 24/7'}</span>
                <span>•</span>
                <span className="text-orange-600 font-semibold">Tỉ lệ mô phỏng chuẩn xác 1:1</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer border border-slate-200 shrink-0"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MAIN 3D VIEWPORT & CONTROL OVERLAY */}
        <div className="relative flex-1 bg-[#f8fafc] overflow-hidden flex flex-col">
          
          {/* TOP HUD: DIMENSIONS & CAMERA ANGLES */}
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 bg-white/80 backdrop-blur z-10 shrink-0">
            {/* Dimensions Badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-blue-600" />
                Số đo:
              </span>
              <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                Rộng {dimensions.width}m × Sâu {dimensions.depth}m × Cao {dimensions.height}m ({dimensions.volumeM3} m³)
              </span>
            </div>

            {/* Camera Angles Switcher */}
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

          {/* THREE.JS CANVAS */}
          <div className="w-full flex-1 relative bg-[#f8fafc]">
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
              <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-1.5 pointer-events-auto flex-wrap justify-center">
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

          {/* FOOTNOTE HELPER STRIP */}
          <div className="py-2.5 px-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center flex items-center justify-center gap-2 shrink-0 select-none">
            <span>Dùng chuột xoay 360° để xem mọi góc nhìn</span>
            <span>•</span>
            <span>Cuộn chuột để phóng to/thu nhỏ</span>
            <span>•</span>
            <span className="text-orange-600 font-semibold">Tỉ lệ mô phỏng chuẩn xác 1:1</span>
          </div>
        </div>

        {/* 3. MODAL FOOTER & BOOKING CTA */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">Giá thuê niêm yết:</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-orange-600 tabular-nums">
                  {price.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-xs text-slate-500 font-medium">/ tháng</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4 hidden md:block">
              <div className="text-[11px] text-slate-500 font-semibold">Tiền cọc giữ chỗ:</div>
              <div className="text-base font-bold text-slate-900 tabular-nums">
                {deposit.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4 hidden lg:block max-w-sm">
              <div className="text-[11px] text-slate-500 font-semibold mb-1">Gợi ý sức chứa:</div>
              <div className="flex flex-wrap gap-1">
                {dimensions.recommendedItems.slice(0, 3).map((it, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200 font-medium"
                  >
                    <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    <span>{it}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer text-center"
            >
              Đóng Lại
            </button>

            {facilityId && (
              <button
                type="button"
                onClick={handleBookNow}
                disabled={!isAvailable}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isAvailable
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
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
