"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  Clock,
  Thermometer,
  Truck,
  Box,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Star,
  Sparkles,
  ArrowRight,
  Building2,
  Lock,
  Calculator,
  HelpCircle,
  Send,
  Check,
  Luggage,
  FileText,
  Boxes,
  Loader2,
  KeyRound,
  RefreshCw,
  Users,
  UserCheck,
  Briefcase,
  ShieldAlert,
  CreditCard,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Layers,
  Settings,
  AlertCircle,
  TrendingUp,
  LifeBuoy
} from "lucide-react";

// Facility API Interface
interface ApiFacility {
  id: number | string;
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
  totalUnits?: number;
  availableUnits?: number;
  totalUnitTypes?: number;
}

// Fallback images for facility cards
const facilityImages = [
  "/climate_control.jpg",
  "/smart_access.jpg",
  "/security_camera.jpg"
];

// FAQs Data (100% Focused on Self-Storage)
const FAQS = [
  {
    q: "Quy trình thuê kho tự quản trên hệ thống diễn ra như thế nào?",
    a: "Quy trình 100% trực tuyến: Bạn chỉ cần (1) Chọn cơ sở kho tại TP.HCM & kích thước box phù hợp; (2) Chọn ngày bắt đầu và thời hạn thuê; (3) Thanh toán tiền cọc/tiền thuê tự động qua VietQR; (4) Đến cơ sở theo lịch hẹn, nhân viên hỗ trợ check-in và nhận mã Smart Key để tự do ra vào 24/7."
  },
  {
    q: "Tôi có thể ra vào kho tự quản vào thời gian nào?",
    a: "Với mô hình Kho Tự Quản thông minh, bạn được cấp mã PIN và Smart Key trên điện thoại để tự do ra vào kho 24/7 bất kỳ lúc nào — kể cả ban đêm, cuối tuần hoặc ngày lễ mà không cần báo trước hay phụ thuộc nhân viên."
  },
  {
    q: "Chính sách đặt cọc và hoàn cọc khi trả kho được quy định ra sao?",
    a: "Khách hàng thanh toán tiền cọc minh bạch khi đặt phòng. Khi hết hạn hợp đồng và trả kho, nhân viên cơ sở sẽ kiểm tra hiện trạng bàn giao phòng sạch sẽ, hệ thống sẽ tự động đối soát và hoàn tiền cọc nhanh chóng qua tài khoản ngân hàng."
  },
  {
    q: "Nếu tôi muốn gia hạn thêm thời gian thuê kho thì làm thế nào?",
    a: "Bạn chỉ cần đăng nhập vào Cổng Khách Hàng (Customer Dashboard), chọn phòng kho đang thuê và bấm nút 'Gia Hạn'. Hệ thống sẽ tự động tạo hóa đơn gia hạn với mã thanh toán VietQR tức thì mà không cần làm lại thủ tục."
  },
  {
    q: "Nhiệt độ và độ ẩm trong kho có được đảm bảo cho đồ gỗ, điện tử không?",
    a: "Tất cả các kho tự quản của SelfStorage tại TP.HCM đều trang bị hệ thống máy lạnh duy trì nhiệt độ 23°C – 25°C cùng máy hút ẩm công nghiệp hoạt động liên tục 24/7, giúp bảo vệ đồ gỗ nội thất, nệm, tài liệu và thiết bị điện tử khỏi ẩm mốc."
  },
  {
    q: "Khi gặp sự cố quên mã PIN hoặc sự cố phòng kho, tôi cần làm gì?",
    a: "Bạn có thể gửi yêu cầu hỗ trợ (Support Ticket) trực tiếp trên Cổng Khách Hàng hoặc liên hệ trực tiếp nhân viên trực cơ sở. Nhân viên sẽ đối chiếu mã đặt phòng và hỗ trợ xử lý mở khóa / cấp lại mã PIN tại chỗ ngay lập tức."
  }
];

// Google Reviews Data
const REVIEWS = [
  {
    name: "Trương Huỳnh Hiếu",
    rating: 5,
    role: "Khách hàng thuê kho cá nhân · Google Review",
    comment: "Quy trình đặt kho và thanh toán cọc qua QR rất nhanh gọn. Đến cơ sở nhân viên check-in hướng dẫn nhận phòng chu đáo. Mở cửa bằng mã PIN 24/7 cực kỳ tiện!",
    avatarBg: "bg-blue-600"
  },
  {
    name: "Phúc Lê",
    rating: 5,
    role: "Chủ shop TMĐT TP.HCM · Google Review",
    comment: "Kho máy lạnh sạch sẽ, xuất nhập hàng lúc nào cũng được. Trên hệ thống có thể quản lý nhiều box và xem hạn gia hạn rất rõ ràng. Đáng tin cậy 100%!",
    avatarBg: "bg-orange-600"
  },
  {
    name: "Ngọc Lan Nguyễn",
    rating: 5,
    role: "Khách hàng thuê kho sửa nhà · Google Review",
    comment: "Tôi thuê phòng kho 12m³ để gửi nội thất 2 tháng sửa nhà. Có hỗ trợ xe tải bốc xếp đến tận cửa kho, phòng kho riêng biệt và an tâm tuyệt đối.",
    avatarBg: "bg-emerald-600"
  }
];

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Dynamic facilities from API
  const [facilities, setFacilities] = useState<ApiFacility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    need: "kho-mini",
    facilityId: "",
    note: ""
  });

  // Fetch facilities from API
  const loadFacilities = async () => {
    setFacilitiesLoading(true);
    setFacilitiesError(null);
    try {
      const data = await api.get<ApiFacility[]>("/facilities");
      if (Array.isArray(data) && data.length > 0) {
        setFacilities(data);
        if (!contactForm.facilityId) {
          setContactForm((prev) => ({ ...prev, facilityId: String(data[0].id) }));
        }
      } else {
        setFacilities([]);
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
      setFacilitiesError("Không thể tải danh sách cơ sở kho. Vui lòng thử lại.");
    } finally {
      setFacilitiesLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactForm({
        name: "",
        phone: "",
        need: "kho-mini",
        facilityId: facilities.length > 0 ? String(facilities[0].id) : "",
        note: ""
      });
      alert("Cảm ơn bạn! Đội ngũ tư vấn SelfStorage sẽ liên hệ lại trong vòng 5 phút.");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white pb-20 sm:pb-0">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Decorative Background Grid */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-500/20 rounded-full blur-[180px] pointer-events-none"></div>

        {/* Widescreen Centered Container */}
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
                <span>Hệ Thống Kho Tự Quản Thông Minh 24/7 · TP. Hồ Chí Minh</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[62px] font-black tracking-tight leading-[1.1] text-white">
                Dịch vụ cho thuê <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
                  kho tự quản thông minh
                </span>{" "}
                tại TP.HCM
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
                Nền tảng cho thuê và quản lý kho tự quản chuẩn Âu - Mỹ tại TP. Hồ Chí Minh. Khách hàng chủ động đặt phòng trực tuyến, thanh toán cọc tự động, check-in nhận phòng và tự do mở cửa bằng Smart Key 24/7.
              </p>

              {/* Key Specs Pills */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 border border-white/15 backdrop-blur text-xs sm:text-sm">
                  <Box className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="font-bold text-white">1 – 50 CBM</span>
                  <span className="text-slate-300 text-xs">kích thước kho</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 border border-white/15 backdrop-blur text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white">24/7</span>
                  <span className="text-slate-300 text-xs">ra vào tự do</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 border border-white/15 backdrop-blur text-xs sm:text-sm">
                  <Thermometer className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-bold text-white">23 – 25°C</span>
                  <span className="text-slate-300 text-xs">kho máy lạnh</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-4">
                <Link
                  href="/locations"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all text-center uppercase tracking-wider whitespace-nowrap"
                >
                  <span>ĐẶT KHO TỰ QUẢN NGAY</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm sm:text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur transition-all text-center whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 text-amber-300" />
                  <span>Nhận Báo Giá &amp; Tư Vấn</span>
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm sm:text-base font-bold text-slate-200 hover:text-white bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 backdrop-blur transition-all text-center whitespace-nowrap"
                >
                  <KeyRound className="w-5 h-5 text-blue-300" />
                  <span>Cổng Đăng Nhập</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative isolate rounded-2xl p-1.5 bg-gradient-to-b from-blue-400/40 via-indigo-500/30 to-orange-500/40 shadow-2xl shadow-blue-950/80">
                <div className="rounded-[14px] bg-slate-900/90 overflow-hidden border border-white/15 backdrop-blur-xl">
                  {/* Hero Facility Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src="/climate_control.jpg"
                      alt="Cơ sở kho tự quản SelfStorage hiện đại máy lạnh tại TP.HCM"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    
                    {/* Live Status Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Kho tự quản hoạt động 24/7 tại TP.HCM
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Hệ sinh thái thông minh khép kín</p>
                      <p className="text-lg font-bold">100% Phòng Kho Tự Quản Riêng Biệt</p>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="p-5 grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">Khóa thông minh</div>
                        <div className="text-slate-400 text-[11px]">Mã PIN &amp; Smart Key</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">Camera AI 24/7</div>
                        <div className="text-slate-400 text-[11px]">Bảo mật đa tầng</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10">
                      <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">Thanh toán tự động</div>
                        <div className="text-slate-400 text-[11px]">VietQR &amp; SePay</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10">
                      <Boxes className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">Bàn đóng gói</div>
                        <div className="text-slate-400 text-[11px]">Xe đẩy &amp; Wifi free</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CUSTOMER JOURNEY: 6-STEP SELF-STORAGE FLOW */}
      <section id="services" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div id="how-it-works" className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full mb-12 sm:mb-16">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold text-blue-600 bg-blue-100/70 px-3 py-1 rounded-full mb-3">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              Quy Trình Khách Hàng (Storage Customer)
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Hành Trình Thuê Kho Tự Quản 100% Khép Kín &amp; Tự Động
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Từ bước chọn cơ sở kho tại TP.HCM đến lúc check-in nhận phòng, thanh toán cọc và quản lý kho lưu trữ — mọi thao tác đều được tối ưu hóa trực tuyến.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1: Tra cứu kho */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-blue-500/20">
                  01
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Khám Phá Cơ Sở &amp; Kích Thước Kho
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Xem danh sách cơ sở kho tại TP.HCM, so sánh các loại box từ 1m³ đến 23m³+, xem số phòng trống và bảng giá thuê niêm yết công khai.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold text-blue-600 flex items-center gap-1">
                <span>Xem kho trống thời gian thực</span>
              </div>
            </div>

            {/* Step 2: Đặt phòng */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-orange-400 hover:shadow-xl transition-all group relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-orange-500/20">
                  02
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition">
                  Đặt Giữ Chỗ &amp; Chọn Thời Hạn Thuê
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Chọn chi nhánh gần bạn, loại box mong muốn, ngày bắt đầu nhập kho và thời hạn thuê theo tháng hoặc theo năm linh hoạt.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold text-orange-600 flex items-center gap-1">
                <span>Giữ phòng ngay chỉ với 1 phút</span>
              </div>
            </div>

            {/* Step 3: Thanh toán */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all group relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-emerald-500/20">
                  03
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition">
                  Thanh Toán Cọc &amp; Phí Thuê Tự Động
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Thanh toán tiền đặt cọc và tiền thuê qua mã VietQR tự động. Hệ thống đồng bộ xác nhận ngay lập tức, xuất hóa đơn điện tử rõ ràng.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span>VietQR SePay cập nhật tức thì</span>
              </div>
            </div>

            {/* Step 4: Check-in */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all group relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-indigo-500/20">
                  04
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  Check-in Nhận Phòng &amp; Smart Key
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Đến cơ sở kho theo lịch hẹn, nhân viên hỗ trợ đối soát đặt phòng và bàn giao mã PIN / Smart Key phòng kho riêng biệt cho bạn.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold text-indigo-600 flex items-center gap-1">
                <span>Bàn giao phòng an toàn &amp; nhanh</span>
              </div>
            </div>

            {/* Step 5: Quản lý */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all group relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-purple-500/20">
                  05
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition">
                  Quản Lý Nhiều Kho Trên 1 Tài Khoản
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Dễ dàng theo dõi thời hạn hợp đồng, lịch sử thanh toán, gia hạn thuê phòng chỉ với 1 cú nhấp trên Cổng Khách Hàng (Customer Portal).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold text-purple-600 flex items-center gap-1">
                <span>Dashboard tự quản lý thông minh</span>
              </div>
            </div>

            {/* Step 6: Hỗ trợ */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-rose-400 hover:shadow-xl transition-all group relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-rose-500/20">
                  06
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition">
                  Gửi Yêu Cầu Hỗ Trợ 24/7 (Ticket)
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  Khi cần cấp lại mã PIN, hỗ trợ khóa phòng, đổi kích thước kho hoặc giải quyết sự cố, bạn chỉ cần gửi ticket để nhân viên hỗ trợ ngay.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-bold text-rose-600 flex items-center gap-1">
                <span>Hỗ trợ kỹ thuật &amp; CSKH tận tâm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC FACILITY LOCATIONS FROM API (TP.HCM ONLY) */}
      <section id="locations" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full mb-12 sm:mb-16">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold text-blue-600 bg-blue-100/70 px-3 py-1 rounded-full mb-3">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              Mạng Lưới Cơ Sở Kho Tại TP.HCM
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Hệ Thống Cơ Sở Kho Tự Quản
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              Danh sách các cơ sở kho tự quản đang hoạt động tại TP. Hồ Chí Minh. Dữ liệu phòng kho và tình trạng sẵn sàng được đồng bộ từ API hệ thống.
            </p>
          </div>

          {/* Dynamic API Rendering */}
          {facilitiesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border border-slate-200">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600 font-semibold text-sm">Đang tải danh sách cơ sở kho từ hệ thống...</p>
            </div>
          ) : facilitiesError ? (
            <div className="p-8 text-center bg-slate-50 rounded-3xl border border-rose-200 text-slate-700">
              <p className="text-rose-600 font-bold mb-3">{facilitiesError}</p>
              <button
                onClick={loadFacilities}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4" /> Thử tải lại
              </button>
            </div>
          ) : facilities.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
              <p className="text-slate-600 font-semibold">Chưa có cơ sở kho nào được ghi nhận trên hệ thống.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((fac, idx) => (
                <div
                  key={fac.id}
                  className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                        {fac.code || `FAC_${fac.id}`}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                        ● {fac.status === "ACTIVE" ? "Đang hoạt động" : fac.status || "Còn phòng"}
                      </span>
                    </div>

                    {/* Facility Image preview */}
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-5 bg-slate-200">
                      <img
                        src={facilityImages[idx % facilityImages.length]}
                        alt={fac.name || "Cơ sở kho tự quản"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        Kho Tự Quản 24/7
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {fac.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span>{fac.address || "Địa chỉ tại TP. Hồ Chí Minh"}</span>
                    </p>

                    {fac.description && (
                      <p className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60">
                        {fac.description}
                      </p>
                    )}

                    {/* Quick Stats from API */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      {fac.availableUnits !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span><strong>{fac.availableUnits}</strong> box sẵn có</span>
                        </div>
                      )}
                      {fac.phone && (
                        <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{fac.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <Link
                      href="/locations"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700"
                    >
                      <span>Xem phòng trống</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/locations"
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      Đặt Phòng Ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>



      {/* 6. STORAGE USE CASES & B2B */}
      <section id="b2b" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full mb-12 sm:mb-16">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold text-blue-600 bg-blue-100/70 px-3 py-1 rounded-full mb-3">
              <Boxes className="w-3.5 h-3.5" />
              Nhu Cầu Phổ Biến &amp; B2B
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tôi Có Thể Lưu Trữ Những Gì Trong Kho Tự Quản?
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              Hệ thống phòng kho tự quản máy lạnh tại TP.HCM đáp ứng trọn vẹn mọi nhu cầu lưu trữ từ đồ dùng gia đình đến hàng hóa kinh doanh.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Case 1: Chuyển nhà & Nội thất */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="aspect-[16/10] bg-slate-200 overflow-hidden relative">
                <img
                  src="/climate_control.jpg"
                  alt="Lưu trữ nội thất khi chuyển nhà TP.HCM"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-white text-xs font-bold">
                  Gia Đình &amp; Nhà Cửa
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Lưu Trữ Nội Thất &amp; Đồ Dọn Nhà
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Lưu tạm giường nệm, bàn ghế, sofa, đồ gia dụng trong phòng kho riêng khi sửa nhà, dọn nhà mới hoặc đi công tác nước ngoài.
                </p>
              </div>
            </div>

            {/* Case 2: Bộ sưu tập & Đam mê */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="aspect-[16/10] bg-slate-200 overflow-hidden relative">
                <img
                  src="/smart_access.jpg"
                  alt="Lưu trữ bộ sưu tập mô hình anime giày sneaker"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-white text-xs font-bold">
                  Bộ Sưu Tập Cá Nhân
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Bộ Sưu Tập Giày, Mô Hình &amp; Nghệ Thuật
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Bảo quản mô hình anime đắt tiền, giày sneaker hiếm, tranh ảnh và đồ lưu niệm trong không gian máy lạnh kiểm soát ẩm không lo mốc hỏng.
                </p>
              </div>
            </div>

            {/* Case 3: Hàng hóa TMĐT */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="aspect-[16/10] bg-slate-200 overflow-hidden relative">
                <img
                  src="/security_camera.jpg"
                  alt="Lưu trữ hàng hóa kinh doanh online TMĐT"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-white text-xs font-bold">
                  Thương Mại &amp; Bán Lẻ
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Hàng Hóa Kinh Doanh &amp; TMĐT
                </h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Phòng kho tự quản giao nhận thuận tiện cho shop online, xuất nhập hàng 24/7 mọi lúc, có bàn đóng gói và xe đẩy hàng miễn phí.
                </p>
              </div>
            </div>

            {/* Case 4: Giấy tờ & Hồ sơ */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Hồ Sơ &amp; Chứng Từ Doanh Nghiệp</h4>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Lưu trữ chứng từ kế toán 5-10 năm, hồ sơ pháp lý công ty an toàn tuyệt đối với hệ thống PCCC tiêu chuẩn và mã vạch quản lý.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-blue-600">Bảo mật cao · Giá ưu đãi theo năm</div>
            </div>

            {/* Case 5: Hành lý du lịch */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Luggage className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Hành Lý Du Lịch &amp; Đồ Cắm Trại</h4>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Gửi vali, lều trại, đồ thể thao, ván lướt sóng tiện lợi. Đến lấy trước mỗi chuyến đi mà không làm chật chội căn nhà của bạn.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-orange-600">Linh hoạt theo ngày/tháng</div>
            </div>

            {/* Case 6: Vật liệu đóng gói & chuyển nhà */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Vật Liệu Đóng Gói &amp; Xe Vận Chuyển</h4>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  Cung cấp trọn gói thùng carton 5 lớp, màng xốp nổ bubble wrap, băng keo và hỗ trợ xe bốc xếp chở đồ đến tận phòng kho tự quản.
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-emerald-600">Đầy đủ vật tư chuyên dụng</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. GOOGLE REVIEWS & SOCIAL PROOF */}
      <section id="reviews" className="py-20 sm:py-28 bg-slate-900 text-white relative">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
          {/* Main Quote Highlight */}
          <div className="text-center w-full mx-auto mb-16">
            <div className="flex justify-center gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-snug text-white">
              “Quy trình đặt kho và check-in tự động rất chuyên nghiệp. Kho sạch sẽ, bảo mật cao và quản lý hạn thuê trên điện thoại cực kỳ tiện lợi!”
            </blockquote>
            <p className="mt-6 text-xs sm:text-sm uppercase tracking-widest font-bold text-orange-400">
              Trương Huỳnh Hiếu · Khách hàng thực tế tại TP. Hồ Chí Minh
            </p>
          </div>

          <div className="text-center w-full mx-auto mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold">Hàng Ngàn Khách Hàng Đã Tin Tưởng &amp; Hài Lòng</h3>
            <p className="mt-2 text-slate-400 text-sm sm:text-base">
              Đánh giá <strong className="text-white">4.9 / 5.0 ⭐ EXCELLENT</strong> dựa trên hơn <strong>675+</strong> nhận xét thực tế từ khách hàng tại TP.HCM.
            </p>
          </div>

          {/* Review Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS.map((rev, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-orange-400/50 transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${rev.avatarBg} text-white flex items-center justify-center font-bold text-xs`}>
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{rev.name}</div>
                    <div className="text-slate-400 text-xs">{rev.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-20 sm:py-28 bg-slate-50 border-b border-slate-200">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="text-center w-full mx-auto mb-16">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold text-blue-600 bg-blue-100/70 px-3 py-1 rounded-full mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              Hỏi &amp; Đáp
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Những Câu Hỏi Thường Gặp Về Kho Tự Quản
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              Giải đáp mọi thắc mắc về quy định ra vào 24/7, chính sách đặt cọc, thanh toán và bảng giá thuê kho tự quản tại SelfStorage TP.HCM.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left font-bold text-slate-900 text-base sm:text-lg flex items-center justify-between gap-4 hover:text-blue-600 transition"
                >
                  <span>{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${
                        openFaqIndex === idx ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </div>
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 sm:px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4 animate-slide-up-fade">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FAST CONTACT / INQUIRY FORM */}
      <section className="py-20 sm:py-28 bg-white" id="contact">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                <Send className="w-3.5 h-3.5" />
                Tư Vấn Kho Tự Quản 24/7
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Nhận Báo Giá Kho Tự Quản &amp; Đặt Lịch Tham Quan
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Để lại số điện thoại và nhu cầu thuê kho tự quản của bạn, chuyên viên SelfStorage sẽ gọi điện tư vấn kích thước kho phù hợp và gửi bảng giá chi tiết kèm ưu đãi trong vòng 5 phút!
              </p>

              <div className="space-y-4 pt-4 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Hotline 24/7:</div>
                    <a href="tel:02877700117" className="text-blue-600 font-bold hover:underline">028 7770 0117</a> (Zalo / Call)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Email hỗ trợ:</div>
                    <a href="mailto:support@selfstorage.vn" className="text-emerald-700 hover:underline">support@selfstorage.vn</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Khu vực phục vụ:</div>
                    <span>Toàn bộ hệ thống cơ sở kho tự quản tại TP. Hồ Chí Minh</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-6">
              <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-xl">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Đăng Ký Tư Vấn Thuê Kho Tự Quản</h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-6">Điền thông tin để nhận mã giảm giá 10% cho tháng đầu tiên!</p>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Số Điện Thoại (Zalo) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0901 234 567"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nhu Cầu Thuê
                      </label>
                      <select
                        value={contactForm.need}
                        onChange={(e) => setContactForm({ ...contactForm, need: e.target.value })}
                        className="w-full px-3 py-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="kho-mini">Kho Tự Quản Mini (1-5 CBM)</option>
                        <option value="kho-gia-dinh">Kho Tự Quản Gia Đình (8-12 CBM)</option>
                        <option value="kho-doanh-nghiep">Kho Tự Quản Doanh Nghiệp (23+ CBM)</option>
                        <option value="tu-locker">Tủ Locker Gửi Hành Lý</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cơ Sở Kho (TP.HCM)
                      </label>
                      <select
                        value={contactForm.facilityId}
                        onChange={(e) => setContactForm({ ...contactForm, facilityId: e.target.value })}
                        className="w-full px-3 py-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {facilities.length > 0 ? (
                          facilities.map((fac) => (
                            <option key={fac.id} value={fac.id}>
                              {fac.name}
                            </option>
                          ))
                        ) : (
                          <option value="">Tất cả cơ sở tại TP.HCM</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ghi chú đồ cần lưu trữ
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ví dụ: Cần kho tự quản chứa đồ căn hộ 2PN trong 3 tháng..."
                      value={contactForm.note}
                      onChange={(e) => setContactForm({ ...contactForm, note: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitted}
                    className="w-full py-4 rounded-xl font-extrabold text-sm sm:text-base text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    {formSubmitted ? "Đang gửi thông tin..." : "GỬI YÊU CẦU TƯ VẤN NGAY"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <Footer />

      {/* 12. STICKY BOTTOM ACTION BAR (FOR MOBILE) */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] grid grid-cols-4 sm:hidden">
        <Link
          href="/locations"
          className="flex flex-col items-center justify-center py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Calculator className="w-5 h-5 text-blue-400 mb-0.5" />
          <span className="text-[10px] font-bold">Xem Giá</span>
        </Link>

        <Link
          href="/locations"
          className="flex flex-col items-center justify-center py-2.5 bg-orange-600 text-white font-bold transition hover:bg-orange-500"
        >
          <Box className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Đặt Kho</span>
        </Link>

        <a
          href="tel:02877700117"
          className="flex flex-col items-center justify-center py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Phone className="w-5 h-5 text-emerald-400 mb-0.5" />
          <span className="text-[10px] font-bold">Hotline</span>
        </a>

        <Link
          href="/login"
          className="flex flex-col items-center justify-center py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <KeyRound className="w-5 h-5 text-sky-400 mb-0.5" />
          <span className="text-[10px] font-bold">Đăng Nhập</span>
        </Link>
      </div>
    </div>
  );
}
