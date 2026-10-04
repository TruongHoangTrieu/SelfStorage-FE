"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  MapPin,
  Navigation2,
  CheckCircle2,
  Search,
  Filter,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  ThermometerSnowflake,
  Clock,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Eye,
  Boxes,
  HelpCircle,
  Compass,
  Check,
  MessageCircle,
  Building2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Box
} from "lucide-react";
import { api } from "@/lib/api";

/** Raw structure from GET /api/facilities */
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
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    storageUnits: number;
    storageUnitTypes: number;
  };
  totalUnits?: number;
  availableUnits?: number;
  totalUnitTypes?: number;
}

/** Formatted structure for rendering */
interface FormattedFacility {
  id: number;
  name: string;
  code: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  status: string;
  image: string;
  images: string[];
  totalUnits: number;
  availableUnits: number;
  totalUnitTypes: number;
  mapEmbedUrl: string;
  googleMapsUrl: string;
  highlights: string[];
  features: string[];
}

// Curated warehouse photo set to assign deterministically based on facility ID
const FACILITY_PHOTOS = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1565118531796-763e5082d113?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1549194388-f61be84a6e9e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
];

function extractDistrict(address: string, name: string): string {
  const text = `${name} ${address}`.toLowerCase();
  if (text.includes("thủ đức") || text.includes("thu duc") || text.includes("an phú") || text.includes("võ nguyên giáp") || text.includes("thảo điền")) return "TP. Thủ Đức";
  if (text.includes("quận 1") || text.includes("q. 1") || text.includes("q1") || text.includes("tân định") || text.includes("nguyễn huệ")) return "Quận 1";
  if (text.includes("quận 7") || text.includes("q. 7") || text.includes("q7") || text.includes("trần trọng cung") || text.includes("tân phú")) return "Quận 7";
  if (text.includes("bình thạnh") || text.includes("binh thanh") || text.includes("landmark")) return "Q. Bình Thạnh";
  if (text.includes("quận 6") || text.includes("q. 6") || text.includes("q6")) return "Quận 6";
  if (text.includes("quận 9") || text.includes("q. 9") || text.includes("q9")) return "Quận 9";
  return "Khu Vực Trung Tâm";
}

function formatFacility(raw: ApiFacility, index: number): FormattedFacility {
  const district = extractDistrict(raw.address || "", raw.name || "");
  const totalUnits = raw.totalUnits ?? raw._count?.storageUnits ?? 0;
  const availableUnits = raw.availableUnits ?? 0;
  const totalUnitTypes = raw.totalUnitTypes ?? raw._count?.storageUnitTypes ?? 0;
  const addressText = raw.address || "Địa chỉ đang cập nhật";

  const imagesList = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : [FACILITY_PHOTOS[index % FACILITY_PHOTOS.length]];

  const primaryImage = imagesList[0];

  const defaultHighlights: string[] = [];
  if (raw.description) {
    defaultHighlights.push(raw.description);
  }
  defaultHighlights.push(`Hệ thống ${totalUnits} ngăn kho vật lý (${availableUnits} ô đang sẵn sàng bàn giao)`);
  defaultHighlights.push(`Đa dạng ${totalUnitTypes || 3} phân loại kích cỡ (từ 1m³ đến trên 25m³)`);
  defaultHighlights.push("Kho máy lạnh 23-25°C, kiểm soát độ ẩm & bảo vệ 24/7");

  return {
    id: raw.id,
    name: raw.name || `Cơ sở kho #${raw.id}`,
    code: raw.code || `FAC_${raw.id}`,
    district,
    address: addressText,
    phone: raw.phone || "028 7770 0117",
    email: raw.email || "support@selfstorage.vn",
    description: raw.description || "Cơ sở lưu trữ thông minh trang bị khóa bàn phím số tay nắm cửa và an ninh 24/7.",
    status: raw.status || "ACTIVE",
    image: primaryImage,
    images: imagesList,
    totalUnits,
    availableUnits,
    totalUnitTypes,
    mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(addressText + " " + raw.name)}&output=embed`,
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(addressText)}`,
    highlights: defaultHighlights,
    features: ["Kho máy lạnh", "24/7 Ra vào", "Bàn phím số tay nắm cửa", "Camera AI"]
  };
}

export default function LocationsPage() {
  const [facilities, setFacilities] = useState<FormattedFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeFacility, setActiveFacility] = useState<FormattedFacility | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  const roleName = (
    typeof currentUser?.role === "string" ? currentUser.role : currentUser?.role?.name ?? ""
  ).toUpperCase();
  const isStorageCustomer = Boolean(currentUser && roleName === "STORAGE_CUSTOMER");
  const canRentStorage = !currentUser || isStorageCustomer;

  useEffect(() => {
    let cancelled = false;

    async function loadFacilities() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await api.get<ApiFacility[]>("/facilities");
        if (cancelled) return;

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu phản hồi từ máy chủ không hợp lệ.");
        }

        const formatted = data.map((item, idx) => formatFacility(item, idx));
        setFacilities(formatted);
        if (formatted.length > 0) {
          setActiveFacility(formatted[0]);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to load live facilities:", err);
        setFacilities([]);
        setActiveFacility(null);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể kết nối đến máy chủ Backend để tải danh sách cơ sở."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFacilities();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setReloadToken((prev) => prev + 1);
  };

  // Dynamic districts extracted from live API facilities only
  const availableDistricts = useMemo(() => {
    const list = Array.from(new Set(facilities.map((f) => f.district))).filter(Boolean);
    return ["ALL", ...list];
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.district.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDistrict = selectedDistrict === "ALL" || f.district === selectedDistrict;
      const matchStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "AVAILABLE" && f.availableUnits > 0) ||
        (selectedStatus === "ACTIVE" && f.status === "ACTIVE");

      return matchSearch && matchDistrict && matchStatus;
    });
  }, [facilities, searchTerm, selectedDistrict, selectedStatus]);

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <Navbar />

      {/* 1. HERO BANNER (Live API facilities summary) */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        {/* Decorative Background Grid */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/20 rounded-full blur-[180px] pointer-events-none"></div>

        <div className="relative w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Heading & Live Statistics */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Địa điểm <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
                  kho lưu trữ thông minh
                </span>
              </h1>

              <p className="text-slate-200 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                Hệ thống cơ sở kho tự quản thông minh đang hoạt động thực tế. Dữ liệu được đồng bộ hóa tức thời từ máy chủ, hiển thị chính xác số lượng ngăn kho sẵn sàng cho thuê và thông tin liên hệ từng chi nhánh.
              </p>

              {/* Dynamic Stats Badges from Live API */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="text-sm font-bold text-white">
                    {loading ? "..." : `${facilities.length} Cơ sở kho`}
                  </span>
                  <span className="text-xs text-slate-300">đang quản lý</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <Box className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-bold text-white">
                    {loading
                      ? "..."
                      : `${facilities.reduce((acc, f) => acc + f.availableUnits, 0)} Ngăn kho`}
                  </span>
                  <span className="text-xs text-slate-300">còn trống</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-sm font-bold text-white">24/7</span>
                  <span className="text-xs text-slate-300">Khóa số tay nắm cửa</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href="#facilities-directory"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 transition-all text-center uppercase tracking-wider whitespace-nowrap"
                >
                  <span>Xem danh sách cơ sở</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {activeFacility && (
                  <a
                    href="#live-map-section"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur transition-all text-center whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4 text-amber-300" />
                    <span>Xem bản đồ chi nhánh</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right: Featured Live Facility Photo */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative isolate">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 pointer-events-none"
                ></div>

                <Link
                  href={activeFacility ? `/locations/${activeFacility.id}` : "#facilities-directory"}
                  className="block group/heroCard overflow-hidden rounded-2xl border border-white/20 bg-slate-800 shadow-2xl transition hover:border-orange-500/50 cursor-pointer"
                >
                  <img
                    src={activeFacility?.image || FACILITY_PHOTOS[0]}
                    alt="Kho tự quản SelfStorage"
                    className="aspect-[4/3] w-full object-cover transform group-hover/heroCard:scale-105 transition-transform duration-700"
                  />
                  <div className="p-4 bg-slate-900/95 backdrop-blur border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-orange-400 uppercase">
                        {activeFacility ? activeFacility.district : "Hệ thống SelfStorage"}
                      </p>
                      <p className="text-sm font-bold text-white truncate max-w-[220px] group-hover/heroCard:text-orange-400 transition-colors">
                        {activeFacility ? activeFacility.name : "Đang kết nối cơ sở..."}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Signature rainbow stripe */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600"></div>
      </section>

      {/* 2. FACILITIES DIRECTORY (Strictly Live API Data) */}
      <section id="facilities-directory" className="py-16 sm:py-24 w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            CƠ SỞ KHO ĐANG HOẠT ĐỘNG
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Danh sách chi nhánh SelfStorage
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 font-medium">
            Tất cả cơ sở kho tự quản dưới đây được lấy trực tiếp từ cơ sở dữ liệu hệ thống.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm cơ sở theo tên, địa chỉ hoặc quận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            {/* Quick Status Pill */}
            <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2">
              <button
                onClick={() => setSelectedStatus(selectedStatus === "AVAILABLE" ? "ALL" : "AVAILABLE")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  selectedStatus === "AVAILABLE"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                Còn trống
              </button>

              <button
                onClick={handleRetry}
                title="Tải lại từ API"
                className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic District Filter Tabs (Generated from live data) */}
          {availableDistricts.length > 1 && (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
              <span className="text-slate-400 font-bold uppercase mr-1 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5" /> Khu vực:
              </span>
              {availableDistricts.map((dist) => (
                <button
                  key={dist}
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-3.5 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                    selectedDistrict === dist
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {dist === "ALL" ? `Tất cả (${facilities.length})` : dist}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">Đang tải danh sách cơ sở từ API...</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {/* ERROR STATE (No Mock fallback - pure error display with retry) */}
        {!loading && errorMessage && (
          <div className="py-16 text-center bg-rose-50 border border-rose-200 rounded-2xl p-8 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-rose-900">Không thể tải dữ liệu cơ sở kho</h3>
            <p className="text-sm text-rose-700 mt-1 max-w-md mx-auto">{errorMessage}</p>
            <div className="mt-5">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại kết nối
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !errorMessage && filteredFacilities.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Boxes className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-700">Không có cơ sở kho nào phù hợp với bộ lọc.</p>
            <p className="text-sm text-slate-500 mt-1">Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc quận được chọn.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDistrict("ALL");
                setSelectedStatus("ALL");
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}

        {/* LIVE FACILITY CARDS GRID (Compact 3-column layout) */}
        {!loading && !errorMessage && filteredFacilities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((fac) => (
              <div
                key={fac.id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Facility Image with Live Status & Available Units Badges */}
                <Link
                  href={`/locations/${fac.id}`}
                  className="block relative aspect-[16/10] overflow-hidden bg-slate-100 cursor-pointer"
                >
                  <img
                    src={fac.image}
                    alt={fac.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* District Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900/90 text-white text-[11px] font-bold tracking-wider backdrop-blur-sm uppercase">
                      {fac.district}
                    </span>
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur text-[11px] font-bold text-slate-900 shadow-sm">
                    {fac.availableUnits > 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Còn trống: <strong>{fac.availableUnits}/{fac.totalUnits}</strong> ô
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Đã kín phòng ({fac.totalUnits} ô)
                      </span>
                    )}
                  </div>
                </Link>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-2">
                    <Link href={`/locations/${fac.id}`} className="group/title">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover/title:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {fac.name}
                      </h3>
                    </Link>
                  </div>

                  {/* Highlights from API */}
                  <ul className="mt-2 space-y-1.5 mb-4">
                    {fac.highlights.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                        <span className="leading-snug line-clamp-2">{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Address & Contact Box */}
                  <div className="mt-auto pt-3 border-t border-slate-100 space-y-1.5">
                    <p className="text-xs text-slate-700 flex items-start gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{fac.address}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                      {fac.phone && (
                        <a
                          href={`tel:${fac.phone}`}
                          className="flex items-center gap-1 text-blue-700 font-bold hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{fac.phone}</span>
                        </a>
                      )}
                      {fac.email && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{fac.email}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setActiveFacility(fac);
                          const el = document.getElementById("live-map-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Bản đồ
                      </button>

                      <a
                        href={fac.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        <Compass className="w-3 h-3" />
                        Chỉ đường
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/locations/${fac.id}`}
                        className={`inline-flex items-center justify-center py-2 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors ${
                          canRentStorage ? "px-3" : "px-4"
                        }`}
                      >
                        <span>Xem kho</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>

                      {canRentStorage && (
                        <Link
                          href={`/book/${fac.id}`}
                          className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/20 hover:-translate-y-0.5"
                        >
                          <span>Đặt chỗ</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* 3. INTERACTIVE MAP SECTION FOR ACTIVE FACILITY */}
      {activeFacility && (
        <section id="live-map-section" className="py-16 sm:py-24 bg-slate-100 border-y border-slate-200">
          <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
            
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                VỊ TRÍ &amp; BẢN ĐỒ THỰC TẾ
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Khám phá cơ sở: {activeFacility.name}
              </h2>
              <p className="mt-3 text-slate-600 text-base sm:text-lg">
                Xem vị trí tọa độ thực tế trên Google Maps và trạng thái khả dụng của cơ sở kho này.
              </p>
            </div>

            {/* Quick Switcher among live facilities */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
              {facilities.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => setActiveFacility(fac)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeFacility.id === fac.id
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${activeFacility.id === fac.id ? "text-orange-400" : "text-slate-400"}`} />
                  <span>{fac.name}</span>
                </button>
              ))}
            </div>

            {/* Map & Live Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              {/* Google Maps Embed */}
              <div className="lg:col-span-8 bg-slate-900 relative min-h-[420px] lg:min-h-[480px]">
                <iframe
                  title={`Bản đồ ${activeFacility.name}`}
                  src={activeFacility.mapEmbedUrl}
                  className="w-full h-full min-h-[420px] lg:min-h-[480px] border-0"
                  loading="lazy"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Facility Details Box */}
              <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center justify-end gap-2 mb-3">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      {activeFacility.status === "ACTIVE" ? "Đang hoạt động" : activeFacility.status}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    {activeFacility.name}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-6">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{activeFacility.address}</span>
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">Tổng số ngăn kho:</span>
                      <strong className="text-sm text-slate-900">{activeFacility.totalUnits} ô</strong>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <span className="text-xs text-emerald-800 font-medium">Ngăn kho sẵn sàng:</span>
                      <strong className="text-sm text-emerald-700">{activeFacility.availableUnits} ô trống</strong>
                    </div>

                    {activeFacility.phone && (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="text-xs text-blue-800 font-medium">Điện thoại cơ sở:</span>
                        <a href={`tel:${activeFacility.phone}`} className="text-xs font-black text-blue-700 hover:underline">
                          {activeFacility.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`pt-6 border-t border-slate-100 ${canRentStorage ? "grid grid-cols-2 gap-2" : "flex"}`}>
                  <Link
                    href={`/locations/${activeFacility.id}`}
                    className="w-full py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-800 text-center flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    Chi tiết &amp; Bảng giá
                  </Link>

                  {canRentStorage && (
                    <Link
                      href={`/book/${activeFacility.id}`}
                      className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs text-white text-center flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 hover:-translate-y-0.5 transition-all"
                    >
                      Thuê kho ngay
                    </Link>
                  )}
                </div>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* 4. STRATEGIC ACCESSIBILITY & SECURITY HIGHLIGHTS */}
      <section className="py-16 sm:py-24 w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 relative">
            <div className="relative isolate">
              <div
                aria-hidden="true"
                className="absolute -bottom-3 -right-3 -z-10 h-full w-full rounded-2xl border-2 border-orange-500/40 bg-orange-500/10"
              ></div>

              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                alt="Tiêu chuẩn an toàn kho SelfStorage"
                className="rounded-2xl object-cover aspect-[4/3] w-full shadow-lg"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                AN NINH &amp; TIÊU CHUẨN QUỐC TẾ
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Hãy an tâm! Đồ của bạn luôn an toàn tại SelfStorage
              </h2>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900">Camera AI &amp; Báo động 24/7:</strong> Giám sát mọi hành lang và lối ra vào của từng cơ sở kho.
                </div>
              </li>

              <li className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700">
                <ThermometerSnowflake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900">Kiểm soát nhiệt độ 23-25°C &amp; Hút ẩm:</strong> Không bị ẩm mốc, giữ gìn đồ gỗ, đồ điện tử và tài liệu.
                </div>
              </li>

              <li className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700">
                <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900">Khóa bàn phím số tay nắm cửa:</strong> Mở cửa bằng mã PIN bấm trực tiếp trên tay nắm cửa phòng kho, cấp tự động sau khi đặt chỗ.
                </div>
              </li>

              <li className="flex items-start gap-3.5 text-sm sm:text-base text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-slate-900">Bảo hiểm tài sản miễn phí:</strong> Mọi hợp đồng thuê kho đều được tặng kèm bảo hiểm theo tiêu chuẩn SSAA.
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href="tel:02877700117"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
              >
                <Phone className="w-4 h-4 text-white" />
                <span>Liên hệ tư vấn chi nhánh: 028 7770 0117</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FOOTER */}
      <Footer />
    </main>
  );
}
