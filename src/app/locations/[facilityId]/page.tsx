"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { THEME } from "@/lib/theme";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  ThermometerSnowflake,
  Boxes,
  ArrowRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  Box,
  Building2,
  KeyRound,
  Truck,
  Lock,
  X,
  ChevronRight,
  Sparkles,
  Compass,
  HelpCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ChevronDown
} from "lucide-react";

interface ApiFacility {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address: string;
  images?: string[] | null;
  status: string;
  totalUnits?: number;
  availableUnits?: number;
  totalUnitTypes?: number;
  _count?: {
    storageUnits: number;
    storageUnitTypes: number;
  };
}

interface StorageUnitType {
  id: number;
  name: string;
  code?: string;
  category?: string;
  width?: number;
  height?: number;
  depth?: number;
  area?: number;
  volume?: number;
  climateControlled?: boolean;
  basePricePerMonth?: number | string;
  monthlyRent?: number | string;
  pricePerMonth?: number | string;
  totalUnits?: number;
  availableUnits?: number;
  description?: string;
}

// Clean fallback images if facility has no custom images
const GALLERY_FALLBACKS = [
  {
    title: "Lối vào kho",
    desc: "Lối vào kho với cửa cuốn tự động và bãi đỗ xe",
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Kho nhỏ 4.9 m² (12.5 m³)",
    desc: "Kho nhỏ diện tích 4.9 m², thể tích 12.5 m³",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80",
    area: "4.9",
    volume: "12.5",
    type: "Kho nhỏ",
  },
  {
    title: "Kho trung bình 9.0 m² (22.5 m³)",
    desc: "Kho trung bình diện tích 9.0 m², thể tích 22.5 m³",
    image: "https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80",
    area: "9.0",
    volume: "22.5",
    type: "Kho trung bình",
  },
  {
    title: "Kho lớn 14.5 m² (36.3 m³)",
    desc: "Kho lớn diện tích 14.5 m², thể tích 36.3 m³",
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80",
    area: "14.5",
    volume: "36.3",
    type: "Kho lớn",
  },
  {
    title: "Sảnh vào hàng rộng rãi",
    desc: "Sảnh vào hàng rộng rãi, xe tải tiếp cận trực tiếp",
    image: "https://images.unsplash.com/photo-1586528116480-1a74d75dca26?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Kho riêng biệt an toàn tuyệt đối",
    desc: "Kho riêng biệt an toàn tuyệt đối, khóa Smart Key độc lập",
    image: "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Thang máy hàng công nghiệp",
    desc: "Thang máy hàng công nghiệp tải trọng lớn 2 tấn",
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Kho kiểm soát nhiệt độ (Kho mát)",
    desc: "Kho kiểm soát nhiệt độ 23-25°C & độ ẩm dưới 55% RH",
    image: "https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?auto=format&fit=crop&w=800&q=80",
  }
];

export default function FacilityDetailPage({
  params
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const facilityId = Number(resolvedParams.facilityId);

  const [facility, setFacility] = useState<ApiFacility | null>(null);
  const [unitTypes, setUnitTypes] = useState<StorageUnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter tabs for unit types
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "CLIMATE" | "STANDARD">("ALL");

  // Lightbox modal state
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Load facility details and unit types
  useEffect(() => {
    async function loadFacilityData() {
      if (!facilityId) return;
      setLoading(true);
      setErrorMessage(null);
      try {
        const [facData, unitsData] = await Promise.all([
          api.get<ApiFacility>(`/facilities/${facilityId}`),
          api.get<any>(`/storage-unit-types?facilityId=${facilityId}`).catch(() => [])
        ]);

        setFacility(facData);
        const typesList = Array.isArray(unitsData)
          ? unitsData
          : unitsData?.data && Array.isArray(unitsData.data)
          ? unitsData.data
          : [];
        setUnitTypes(typesList);
      } catch (err: any) {
        console.error("Failed to load facility detail:", err);
        setErrorMessage("Không thể tải thông tin chi nhánh kho. Vui lòng kiểm tra lại đường truyền.");
      } finally {
        setLoading(false);
      }
    }

    loadFacilityData();
  }, [facilityId]);

  // Google Maps embed URL
  const mapEmbedUrl = useMemo(() => {
    const q = facility?.address ? encodeURIComponent(`${facility.name} ${facility.address}`) : "SelfStorage";
    return `https://maps.google.com/maps?q=${q}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [facility]);

  const googleMapsDirectionUrl = useMemo(() => {
    const q = facility?.address ? encodeURIComponent(`${facility.name} ${facility.address}`) : "SelfStorage";
    return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
  }, [facility]);

  // Dynamic gallery items specific to this facility
  const galleryItems = useMemo(() => {
    return GALLERY_FALLBACKS.map((tmpl, idx) => {
      // In facility.images: index 0 is banner, index 1..8 are the 8 gallery images
      const imgFromDb = facility?.images && facility.images[idx + 1] ? facility.images[idx + 1] : tmpl.image;
      return {
        ...tmpl,
        title: idx === 0 ? `Lối vào kho ${facility?.name || "SelfStorage"}` : tmpl.title,
        desc: idx === 0 ? `Lối vào kho bãi đỗ xe và cửa cuốn bốc xếp hàng tại ${facility?.name || "SelfStorage"}` : tmpl.desc,
        image: imgFromDb,
      };
    });
  }, [facility]);

  const bannerImage = facility?.images?.[0] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80";

  // Filter unit types
  const filteredUnitTypes = useMemo(() => {
    if (selectedCategory === "ALL") return unitTypes;
    if (selectedCategory === "CLIMATE") return unitTypes.filter((u) => u.climateControlled);
    return unitTypes.filter((u) => !u.climateControlled);
  }, [unitTypes, selectedCategory]);

  const formatCurrency = (val?: number | string) => {
    if (!val) return "Liên hệ";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toLocaleString("vi-VN") + " đ/tháng";
  };

  const totalAvailable = facility?.availableUnits ?? unitTypes.reduce((acc, u) => acc + (u.availableUnits ?? 0), 0);
  const totalUnitsCount = facility?.totalUnits ?? facility?._count?.storageUnits ?? unitTypes.reduce((acc, u) => acc + (u.totalUnits ?? 0), 0);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <Navbar />

      {/* LOADING STATE */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-36">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Đang tải thông tin chi tiết cơ sở kho...</h2>
          <p className="text-sm text-slate-500 mt-1">Đồng bộ dữ liệu trực tiếp từ máy chủ</p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && (errorMessage || !facility) && (
        <div className="flex-1 flex flex-col items-center justify-center py-32 px-6">
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-lg">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-rose-900 mb-2">Không tìm thấy thông tin cơ sở</h3>
            <p className="text-sm text-rose-700 mb-6">{errorMessage || "Cơ sở này không tồn tại hoặc đã tạm dừng cung cấp dịch vụ."}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/locations"
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MAIN FACILITY CONTENT */}
      {!loading && facility && (
        <main className="flex-1">
          {/* 1. FACILITY INTRODUCTION & KEY HIGHLIGHTS (Bố cục giới thiệu & video/ảnh showcase) */}
          <section className="pt-28 sm:pt-32 pb-14 sm:pb-20 bg-white border-b border-slate-100">
            <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
              
              {/* Back navigation */}
              <div className="mb-8">
                <Link
                  href="/locations"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại tất cả chi nhánh</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left: Text & Features List */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
      
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                      Cơ Sở <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">{facility.name}</span>
                    </h2>
                  </div>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                    {facility.description ||
                      "Hệ thống kho tự quản thông minh đạt tiêu chuẩn quốc tế với đầy đủ lựa chọn kho máy lạnh 23-25°C, kho tiêu chuẩn thông gió tự nhiên và tủ locker. Vị trí giao thông huyết mạch, xe tải vào tận cửa sảnh bốc xếp hàng hóa, hỗ trợ thang máy công nghiệp nâng hàng nặng."}
                  </p>

                  {/* Highlights Bullet List (Giống phong cách V-Box) */}
                  <ul className="space-y-3.5 pt-2">
                    <li className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Vị trí thuận tiện:</strong> Dễ dàng kết nối các tuyến đường huyết mạch, không kẹt xe, xe tải ra vào 24/7.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Kích thước đa dạng:</strong> Tổng cộng <strong>{totalUnitsCount}</strong> phòng kho từ 1m³ đến hơn 50m³ cho cá nhân, gia đình và doanh nghiệp.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Khu bốc xếp hiện đại:</strong> Trang bị thang máy hàng công nghiệp tải trọng 2 tấn và xe nâng pallet miễn phí.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Kiểm soát nhiệt độ &amp; độ ẩm:</strong> Kho máy lạnh duy trì 23°C – 25°C, chống ẩm mốc tuyệt đối cho đồ gỗ, nội thất và điện tử.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Tự do ra vào 24/7:</strong> Không phụ thuộc nhân viên, mở cửa tức thì bằng Smart Key hoặc mã PIN cá nhân trên điện thoại.</span>
                    </li>
                  </ul>

                  {/* Summary Metric Pills */}
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-2xl font-black text-slate-900">{totalUnitsCount}</div>
                      <div className="text-xs text-slate-500 font-semibold">Tổng số ngăn kho</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-2xl font-black text-emerald-700">{totalAvailable}</div>
                      <div className="text-xs text-emerald-700 font-semibold">Ngăn kho sẵn sàng</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                      <div className="text-2xl font-black text-blue-700">23-25°C</div>
                      <div className="text-xs text-blue-700 font-semibold">Kho máy lạnh 24/7</div>
                    </div>
                  </div>
                </div>

                {/* Right: Facility Showcase Image Card */}
                <div className="lg:col-span-5">
                  <div className="relative isolate rounded-3xl p-2 bg-gradient-to-b from-orange-400/30 via-amber-300/20 to-blue-500/20 shadow-2xl">
                    <div className="rounded-[20px] overflow-hidden bg-slate-900 relative aspect-[4/3] group">
                      <img
                        src={facility.images && facility.images.length > 1 ? facility.images[1] : (facility.images?.[0] || "/climate_control.jpg")}
                        alt={facility.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                      {/* Bottom Caption */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Trực quan cơ sở</span>
                        <h4 className="text-base font-bold text-white">Không gian thực tế tại {facility.name}</h4>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* 2. GOOGLE MAP BANNER WITH OVERLAY CARD */}
          <section className="relative bg-slate-900 text-white">
            {/* Fullwidth Map Frame */}
            <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] bg-slate-950 overflow-hidden">
              <iframe
                title={`Bản đồ ${facility.name}`}
                src={mapEmbedUrl}
                className="w-full h-full border-0 filter contrast-[1.05]"
                loading="lazy"
                allowFullScreen
              ></iframe>

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none"></div>

              {/* Floating Facility Info Overlay Card aligned within max-w-[1800px] */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center">
                <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
                  <div className="pointer-events-auto max-w-md w-full my-6">
                    <div className="bg-slate-900/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-white/20 shadow-2xl space-y-4">
                      {/* Live Status */}
                      <div className="flex items-center justify-end gap-2">
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          {facility.status === "ACTIVE" ? "Đang hoạt động" : "Sẵn sàng phục vụ"}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {facility.name}
                        </h1>
                        <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mt-1">
                          Cơ sở kho tự quản thông minh 24/7
                        </p>
                      </div>

                      {/* Address List */}
                      <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-300">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <span className="leading-snug text-white font-medium">
                            {facility.address?.replace(/,\s*(?:TR|TP\.?)\s*Hồ Chí Minh/gi, "")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                          <a href={`tel:${facility.phone || "02877700117"}`} className="text-white hover:text-orange-400 font-bold transition">
                            Hotline: {facility.phone || "028 7770 0117"}
                          </a>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Ra vào tự do 24/7 qua Smart Key độc lập</span>
                        </div>
                      </div>

                      {/* Actions Button */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                        <a
                          href={googleMapsDirectionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-slate-900 bg-white hover:bg-slate-100 transition shadow-sm"
                        >
                          <Compass className="w-4 h-4 text-blue-600" />
                          <span>Chỉ đường Google Maps</span>
                        </a>

                        <a
                          href="#unit-types-section"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 transition"
                        >
                          <span>Xem bảng giá kho</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Rainbow Stripe */}
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600"></div>
          </section>

          {/* 3. VISUAL GALLERY OF STORAGE TYPES & AMENITIES (Lưới ảnh thực tế chuẩn phong cách V-Box) */}
          <section className="py-8 sm:py-14 bg-white border-b border-slate-200">
            <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
              
              {/* Ảnh toàn cảnh cơ sở phía trên */}
              <div className="w-full mb-6 sm:mb-8 overflow-hidden rounded-2xl">
                <img
                  src={bannerImage}
                  alt={facility.name}
                  className="w-full h-auto object-cover max-h-[580px]"
                />
              </div>

              {/* Lưới 4 cột ảnh thực tế khớp 100% với giao diện tham khảo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
                {galleryItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className="group cursor-pointer flex flex-col items-center"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2.5 sm:mt-3 text-center text-sm sm:text-base font-normal text-slate-800 leading-snug group-hover:text-orange-600 transition-colors">
                      {item.area ? (
                        <span>
                          {item.type} {item.area} m<sup>2</sup> ({item.volume} m<sup>3</sup>)
                        </span>
                      ) : (
                        item.title
                      )}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* 4. AVAILABLE STORAGE UNITS & PRICING CATALOG (Bảng giá các loại kho tại cơ sở này) */}
          <section id="unit-types-section" className="py-16 sm:py-24 bg-white border-b border-slate-200">
            <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    BẢNG GIÁ NIÊM YẾT MINH BẠCH
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Chọn Loại Kho Phù Hợp Tại {facility.name}
                  </h2>
                  <p className="mt-2 text-slate-600 text-sm sm:text-base">
                    Giá thuê đã bao gồm thuế, phí quản lý an ninh 24/7 và quyền ra vào Smart Key không giới hạn.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === "ALL"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tất cả ({unitTypes.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory("CLIMATE")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === "CLIMATE"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-blue-600"
                    }`}
                  >
                    Kho Mát Máy Lạnh
                  </button>
                  <button
                    onClick={() => setSelectedCategory("STANDARD")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === "STANDARD"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-orange-600"
                    }`}
                  >
                    Kho Tiêu Chuẩn
                  </button>
                </div>
              </div>

              {/* Units Grid */}
              {filteredUnitTypes.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
                  <Box className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">Chưa có thông tin loại kho phù hợp</h3>
                  <p className="text-xs text-slate-500 mt-1">Vui lòng liên hệ trực tiếp hotline để nhận báo giá chi tiết theo yêu cầu.</p>
                  <a
                    href="tel:02877700117"
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Gọi tư vấn: 028 7770 0117</span>
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredUnitTypes.map((unit) => {
                    const price = unit.monthlyRent || unit.pricePerMonth || unit.basePricePerMonth;
                    const isAvailable = (unit.availableUnits ?? 1) > 0;

                    return (
                      <div
                        key={unit.id}
                        className="bg-white rounded-3xl border border-slate-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-6 relative group"
                      >
                        {/* Climate badge */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          {unit.climateControlled ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-600" />
                              Kho Máy Lạnh 23-25°C
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                              <Box className="w-3.5 h-3.5 text-slate-500" />
                              Kho Tiêu Chuẩn
                            </span>
                          )}

                          {isAvailable ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Còn phòng
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-600">Đã kín</span>
                          )}
                        </div>

                        {/* Title & Dimension */}
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {unit.name}
                          </h3>

                          {/* Dimensions & Specs */}
                          <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                            {unit.area && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Diện tích sàn:</span>
                                <strong className="text-slate-800">{unit.area} m²</strong>
                              </div>
                            )}
                            {unit.volume && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Thể tích chứa:</span>
                                <strong className="text-slate-800">{unit.volume} m³ (CBM)</strong>
                              </div>
                            )}
                            {unit.width && unit.height && unit.depth && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">Kích thước (D x R x C):</span>
                                <span className="text-slate-800 font-medium">
                                  {unit.depth}m × {unit.width}m × {unit.height}m
                                </span>
                              </div>
                            )}
                          </div>

                          {unit.description && (
                            <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                              {unit.description}
                            </p>
                          )}
                        </div>

                        {/* Price & Action Button */}
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <div className="mb-3">
                            <span className="text-[11px] text-slate-400 block font-medium">Giá thuê trọn gói:</span>
                            <span className="text-xl font-black text-orange-600">
                              {formatCurrency(price)}
                            </span>
                          </div>

                          <Link
                            href={`/book/${facility.id}`}
                            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 transition-all uppercase tracking-wider text-center"
                          >
                            <span>Thuê Ngăn Kho Này</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </section>

          {/* 5. STRATEGIC STANDARDS & AMENITIES (Tiêu chuẩn an toàn & Tiện ích vượt trội) */}
          <section className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 relative z-10">
              
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  TIÊU CHUẨN SSAA QUỐC TẾ
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Tài Sản Của Bạn Được Bảo Vệ 24/7 Tuyệt Đối
                </h2>
                <p className="mt-3 text-slate-300 text-base sm:text-lg">
                  Mỗi ngăn kho tại {facility.name} đều vận hành theo quy chuẩn an ninh và bảo hiểm tài sản tự động.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Smart Key Cá Nhân 24/7</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tự do mở khóa bằng mã PIN điện thoại hoặc thẻ từ RFID, không cần liên hệ trước hay đợi nhân viên.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Camera AI &amp; Báo Động</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hệ thống camera an ninh hồng ngoại bao phủ 100% các dãy hành lang, lưu trữ đám mây liên tục.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <ThermometerSnowflake className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Kiểm Soát Nhiệt Độ &amp; Độ Ẩm</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hệ thống máy lạnh 23-25°C cùng máy hút ẩm duy trì độ ẩm dưới 55% RH, chống ẩm mốc cho đồ gỗ, đồ da.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Hạ Tầng Xe Tải &amp; Thang Máy</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Khu bốc dỡ hàng rộng rãi, xe tải đỗ sát cửa kho, thang máy hàng công nghiệp 2 tấn và xe nâng sẵn sàng.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* 6. LOCAL GUIDE & KNOWLEDGE BASE (Dành cho khách hàng khu vực - Giống V-Box) */}
          <section className="py-16 sm:py-24 bg-white">
            <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
                    HƯỚNG DẪN TRƯỚC KHI THUÊ KHO
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Cần Thuê Kho Tự Quản Tại {facility.name}?
                  </h3>
                  <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                    Chỉ cần 3 phút hoàn tất thủ tục online: Chọn loại kho, chọn ngày dọn đồ vào, thanh toán cọc tự động qua VietQR và nhận mã PIN mở cửa ngay lập tức.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/book/${facility.id}`}
                      className="px-6 py-3.5 rounded-full font-extrabold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 transition uppercase tracking-wider"
                    >
                      Bắt đầu đặt kho ngay
                    </Link>

                    <a
                      href="tel:02877700117"
                      className="px-6 py-3.5 rounded-full font-bold text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition"
                    >
                      Tư vấn qua điện thoại: 028 7770 0117
                    </a>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <h5 className="font-bold text-slate-900">1. Làm sao để chọn kích thước kho phù hợp?</h5>
                    <p className="text-slate-500 mt-1">
                      Box mini 1-5m³ phù hợp gửi vali &amp; thùng carton; Box 6-12m³ phù hợp đồ căn hộ 1-2 phòng ngủ; Box 15m³+ phù hợp hàng hóa kinh doanh TMĐT.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <h5 className="font-bold text-slate-900">2. Tôi có thể gia hạn hoặc trả phòng sớm không?</h5>
                    <p className="text-slate-500 mt-1">
                      Hoàn toàn linh hoạt! Bạn có thể gia hạn 1-click trên Cổng Khách Hàng hoặc yêu cầu trả phòng để hoàn cọc tự động.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* 7. LIGHTBOX MODAL FOR GALLERY PHOTOS */}
          {activeImageIndex !== null && (
            <div
              className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
              onClick={() => setActiveImageIndex(null)}
            >
              <div
                className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setActiveImageIndex(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="aspect-[16/10] w-full overflow-hidden bg-black">
                  <img
                    src={galleryItems[activeImageIndex].image}
                    alt={galleryItems[activeImageIndex].title}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-5 sm:p-6 bg-slate-900 text-white">
                  <h3 className="text-lg font-bold text-white">
                    {galleryItems[activeImageIndex].title}
                  </h3>
                  {galleryItems[activeImageIndex].desc && (
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      {galleryItems[activeImageIndex].desc}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      )}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
