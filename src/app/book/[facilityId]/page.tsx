"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Shield,
  CreditCard,
  CalendarDays,
  Clock,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  PartyPopper,
  Building2,
  Boxes,
  QrCode,
  MapPin,
  Tag,
  Sparkles,
  Check,
  Phone,
  Info,
  Copy,
  Lock,
  ShieldAlert,
} from "lucide-react";

interface DurationOption {
  key: string;
  months: number;
  label: string;
  discount: number;
  badge?: string | null;
}

interface TimeSlotOption {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  iso: string;
  available: boolean;
  bookedCount?: number;
  remainingCapacity?: number;
  reason?: string | null;
}

const DEFAULT_DURATIONS: DurationOption[] = [
  { key: "1_month", months: 1, label: "1 Tháng", discount: 0, badge: null },
  { key: "2_months", months: 2, label: "2 Tháng", discount: 0, badge: null },
  { key: "3_months", months: 3, label: "3 Tháng", discount: 5, badge: "Tiết kiệm 5%" },
  { key: "6_months", months: 6, label: "6 Tháng", discount: 10, badge: "Phổ biến - Giảm 10%" },
  { key: "1_year", months: 12, label: "1 Năm trở lên", discount: 15, badge: "Tốt nhất - Giảm 15%" },
];

const VIETNAMESE_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function isAuthError(err: any): boolean {
  const status =
    err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.cause?.status;

  // Only 401 is an unauthenticated/expired session.
  // 403 Forbidden is a permission issue, which should NOT wipe the user's login token.
  if (status === 401) return true;

  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("jwt expired") ||
    msg.includes("token expired") ||
    msg.includes("invalid token")
  );
}

function formatDateVi(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export default function BookingFlow() {
  const params = useParams();
  const router = useRouter();
  const facilityId = Number(params.facilityId);

  const [facility, setFacility] = useState<any>(null);
  const [unitTypes, setUnitTypes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [step, setStep] = useState<"unit" | "schedule" | "processing" | "payment_qr" | "success" | "failed">("unit");
  const [selectedUnitType, setSelectedUnitType] = useState<any>(null);
  const [moveInDate, setMoveInDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([]);
  const [timeSlot, setTimeSlot] = useState<TimeSlotOption | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>(DEFAULT_DURATIONS);
  const [durationKey, setDurationKey] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [reservationCode, setReservationCode] = useState("");
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [authError, setAuthError] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins (900s)

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (raw && token) {
        setCurrentUser(JSON.parse(raw));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const roleName = (
    typeof currentUser?.role === "string" ? currentUser.role : currentUser?.role?.name ?? ""
  ).toUpperCase();

  const isStaffOrAdmin = Boolean(
    currentUser && (
      roleName === "STAFF" ||
      roleName === "FACILITY_STAFF" ||
      roleName === "OPERATIONS_STAFF" ||
      roleName === "FACILITY_MANAGER" ||
      roleName === "BUSINESS_OPERATIONS_MANAGER" ||
      roleName === "ADMIN" ||
      roleName === "SYSTEM_ADMINISTRATOR" ||
      roleName.includes("STAFF") ||
      roleName.includes("MANAGER") ||
      roleName.includes("ADMIN")
    )
  );

  // 15-minute countdown timer when on payment_qr
  useEffect(() => {
    if (step !== "payment_qr") return;
    setTimeLeft(900);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Auto-polling for payment confirmation (SePay VietQR)
  useEffect(() => {
    if (step !== "payment_qr" || !reservationId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const summary: any = await api.get(`/payments/reservations/${reservationId}/summary`);
        if (!isSubscribed) return;
        if (summary?.depositPaid || summary?.reservation?.status === "CONFIRMED") {
          clearInterval(interval);
          toast.success("Hệ thống đã nhận được tiền cọc thành công! Ô kho đã được giữ chỗ.");
          setStep("success");
        }
      } catch {
        // silent catch during background polling
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [step, reservationId]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const monthNameVi = `Tháng ${calMonth + 1}, ${calYear}`;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();

  useEffect(() => {
    async function loadData() {
      try {
        const [facilityData, unitTypesData, durationsData] = await Promise.all([
          api.get("/facilities/" + facilityId),
          api.get("/storage-unit-types?facilityId=" + facilityId),
          api.get("/facilities/" + facilityId + "/rental-durations").catch(() => null),
        ]);
        setFacility(facilityData);
        setUnitTypes(unitTypesData.data || unitTypesData || []);
        if (Array.isArray(durationsData) && durationsData.length > 0) {
          setDurationOptions(durationsData);
        }
      } catch (e) {
        console.error("Failed to load facility data", e);
        toast.error("Không thể tải thông tin cơ sở kho");
      } finally {
        setLoadingData(false);
      }
    }
    if (facilityId) loadData();
  }, [facilityId]);

  useEffect(() => {
    if (!facilityId || !moveInDate) {
      setTimeSlots([]);
      return;
    }
    let isCancelled = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const data = await api.get(`/facilities/${facilityId}/time-slots?date=${moveInDate}`);
        if (!isCancelled && data?.slots) {
          setTimeSlots(data.slots);
          if (timeSlot) {
            const current = data.slots.find((s: TimeSlotOption) => s.id === timeSlot.id);
            if (!current || !current.available) {
              setTimeSlot(null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch available time slots", err);
      } finally {
        if (!isCancelled) setLoadingSlots(false);
      }
    }
    fetchSlots();
    return () => {
      isCancelled = true;
    };
  }, [facilityId, moveInDate]);

  useEffect(() => {
    const saved = sessionStorage.getItem("pendingBooking");
    if (saved && unitTypes.length > 0) {
      try {
        const data = JSON.parse(saved);
        const restoredUnit = unitTypes.find((u) => u.id === data.unitTypeId);
        if (restoredUnit) {
          setSelectedUnitType(restoredUnit);
          setMoveInDate(data.moveInDate);
          setTimeSlot(data.timeSlot);
          setDurationKey(data.durationKey);
          setStep("schedule");
        }
      } catch {
        // ignore malformed cache
      }
      sessionStorage.removeItem("pendingBooking");
    }
  }, [unitTypes]);

  const durationInfo = durationOptions.find((d) => d.key === durationKey) || null;
  const monthlyPrice = Number(selectedUnitType?.price ?? selectedUnitType?.depositAmount) || 0;
  const depositAmount = Number(selectedUnitType?.depositAmount) || monthlyPrice;
  const discountedRentalPrice = durationInfo && durationInfo.discount > 0
    ? Math.round(monthlyPrice * (1 - durationInfo.discount / 100))
    : monthlyPrice;

  const isStep2Valid = Boolean(moveInDate && timeSlot && timeSlot.available && durationKey);

  const handleGenerateQR = async () => {
    if (!selectedUnitType || !isStep2Valid) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      sessionStorage.setItem(
        "pendingBooking",
        JSON.stringify({
          unitTypeId: selectedUnitType.id,
          moveInDate,
          timeSlot,
          durationKey,
        }),
      );
      toast.info("Vui lòng đăng nhập để hoàn tất giữ chỗ kho");
      router.push(`/login?redirect=${encodeURIComponent(`/book/${facilityId}`)}`);
      return;
    }

    if (isStaffOrAdmin) {
      toast.error(
        "Tài khoản Nhân viên / Quản lý không có quyền đặt giữ chỗ kho trực tuyến. Tính năng này chỉ dành cho Khách hàng."
      );
      return;
    }

    setSubmitting(true);
    setAuthError(false);
    setErrorMsg("");
    setStep("processing");

    try {
      const appointmentDate = moveInDate + timeSlot!.iso;
      const resResult = await api.post("/reservations", {
        facilityId,
        unitTypeId: selectedUnitType.id,
        appointmentDate,
        rentalPeriod: durationInfo?.months || 1,
        rentalPeriodUnit: "MONTHS",
        notes: "Booked online",
      });

      const resId = resResult.id;
      setReservationId(resId);
      setReservationCode(resResult.reservationCode || "RES-" + Date.now());

      const payResult = await api.post("/payments/deposit", {
        reservationId: resId,
        paymentMethod: "BANK_TRANSFER",
      });

      setQrData(payResult.qr);
      setPaymentData(payResult.payment);
      setStep("payment_qr");
      toast.success("Đã tạo mã QR thanh toán cọc thành công!");
    } catch (err: any) {
      setStep("failed");

      const status =
        err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.cause?.status;
      const isForbidden =
        status === 403 ||
        String(err?.message || "").toLowerCase().includes("forbidden");

      if (isForbidden || isStaffOrAdmin) {
        setAuthError(false);
        setErrorMsg(
          "Tài khoản của bạn là tài khoản Nội bộ (Nhân viên / Quản lý) nên không có quyền đặt thuê kho trực tuyến. Hệ thống chỉ cho phép tài khoản Khách hàng (STORAGE_CUSTOMER) thực hiện đặt giữ chỗ.",
        );
      } else if (isAuthError(err)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthError(true);
        setErrorMsg(
          "Phiên làm việc đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để tiếp tục đặt kho.",
        );
      } else {
        setAuthError(false);
        setErrorMsg(err?.message || "Đặt kho thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!qrData || !paymentData) return;
    setSimulatingWebhook(true);

    try {
      const amount = Number(paymentData.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Số tiền thanh toán không hợp lệ: ${paymentData.amount}`);
      }

      const webhookPayload = {
        id: Math.floor(Math.random() * 1000000),
        gateway: "MBBank",
        transactionDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        accountNumber: "0900000000",
        code: qrData.transferContent,
        content: `${qrData.transferContent} CK coc`,
        transferType: "in" as const,
        transferAmount: amount,
      };

      const res = await fetch("/api/payments/sepay/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
      if (body?.success === false) throw new Error(body?.message || "Webhook trả về thất bại");

      toast.success("Thanh toán cọc thành công! Đã giữ chỗ ô kho.");
      setStep("success");
    } catch (err: any) {
      toast.error("Mô phỏng thanh toán thất bại: " + (err?.message ?? "Lỗi không xác định"));
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-32">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Đang tải thông tin cơ sở kho...</h3>
          <p className="text-sm text-slate-500 font-medium">Vui lòng chờ trong giây lát</p>
        </div>
        <Footer />
      </div>
    );
  }

  // SUCCESS STEP
  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 pt-28 sm:pt-32">
          <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 text-center relative overflow-hidden animate-slide-up-fade">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600 absolute top-0 inset-x-0" />

            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <PartyPopper className="w-10 h-10" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đặt Kho Thành Công
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2 tracking-tight">
              Giữ Chỗ Ngăn Kho Đã Hoàn Tất!
            </h1>
            <p className="text-slate-500 text-sm font-medium mb-8">
              Mã giữ chỗ của bạn đã được ghi nhận trên hệ thống. Nhân viên lễ tân sẽ hướng dẫn bạn nhận kho và kích hoạt Smart Key vào ngày dọn đồ.
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3 text-xs sm:text-sm text-left border border-slate-200">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Mã Đặt Chỗ</span>
                <span className="font-extrabold text-blue-600 text-base tabular-nums">
                  {reservationCode}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Cơ Sở Lưu Trữ</span>
                <span className="font-bold text-slate-900 text-right max-w-[65%]">
                  {facility?.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Loại Kho Đã Chọn</span>
                <span className="font-bold text-slate-900">{selectedUnitType?.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Lịch Bàn Giao</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatDateVi(moveInDate)} • {timeSlot?.label}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-semibold">Tiền Cọc Đã Thanh Toán</span>
                <span className="font-black text-emerald-600 text-base tabular-nums">
                  {depositAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 font-medium text-left mb-8 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Vui lòng mang theo CCCD/Hộ chiếu khi đến nhận kho. Bạn có thể mở khóa và quản lý kho bất kỳ lúc nào tại mục <strong>Kho Của Tôi</strong>.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-full transition-all shadow-md shadow-orange-500/25 cursor-pointer"
              >
                Đến Kho Của Tôi
              </button>
              <Link
                href="/"
                className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-full transition-colors text-center"
              >
                Về Trang Chủ
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // PROCESSING STEP
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-32">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            Đang Khởi Tạo Đơn Giữ Chỗ...
          </h2>
          <p className="text-slate-500 font-medium mb-8 max-w-md">
            Hệ thống đang kiểm tra ô kho sẵn sàng và tạo mã VietQR chuyển khoản cọc.
          </p>
          <div className="space-y-3 text-sm text-left max-w-xs mx-auto bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            {["Đang giữ chỗ ngăn kho...", "Tạo thông tin thanh toán VietQR..."].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-700">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                <span className="font-semibold text-xs">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // FAILED STEP
  if (step === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-32">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-red-100">
            <div className="w-18 h-18 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 border border-rose-200">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">
              {authError ? "Yêu Cầu Đăng Nhập" : "Đặt Kho Thất Bại"}
            </h2>
            <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
              {errorMsg}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {isStaffOrAdmin ? (
                <Link
                  href="/staff"
                  className="flex-1 px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full transition-colors cursor-pointer text-sm text-center flex items-center justify-center gap-1.5"
                >
                  Đến Staff Portal
                </Link>
              ) : authError ? (
                <button
                  onClick={() =>
                    router.push(`/login?redirect=${encodeURIComponent(`/book/${facilityId}`)}`)
                  }
                  className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors cursor-pointer text-sm"
                >
                  Đăng Nhập Ngay
                </button>
              ) : (
                <button
                  onClick={() => setStep("schedule")}
                  className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors cursor-pointer text-sm"
                >
                  Thử Lại
                </button>
              )}
              <button
                onClick={() => setStep("schedule")}
                className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full transition-colors text-center text-sm cursor-pointer"
              >
                Quay Lại
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const stepNumber = step === "unit" ? 1 : step === "schedule" ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-600 selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          
          {/* Breadcrumb & Facility Mini Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              href={`/locations/${facilityId}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Quay lại chi tiết cơ sở: <strong>{facility?.name}</strong></span>
            </Link>

            {facility?.phone && (
              <a
                href={`tel:${facility.phone}`}
                className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 tabular-nums"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Hotline cơ sở: {facility.phone}</span>
              </a>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="mb-10 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[
                { s: 1, label: "1. Chọn Loại Kho" },
                { s: 2, label: "2. Lịch Dọn Đồ" },
                { s: 3, label: "3. Thanh Toán Cọc" },
              ].map((item, idx) => (
                <React.Fragment key={item.s}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-bold transition-all ${
                        stepNumber === item.s
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                          : stepNumber > item.s
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {stepNumber > item.s ? <Check className="w-4 h-4" /> : item.s}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-bold hidden sm:inline ${
                        stepNumber === item.s
                          ? "text-blue-600"
                          : stepNumber > item.s
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {idx < 2 && (
                    <div
                      className={`flex-1 h-1 mx-3 sm:mx-6 rounded-full transition-all ${
                        stepNumber > idx + 1 ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Two-Column Grid: Form Flow (Left) + Reservation Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: ACTIVE STEP CONTENT */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-2xs">
              
              {/* Staff / Admin Warning Notice */}
              {isStaffOrAdmin && (
                <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-amber-950">
                          Tài khoản Nhân viên: {currentUser?.name || currentUser?.email}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-200/80 text-amber-900 uppercase">
                          {roleName}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                        Tài khoản nội bộ không có quyền đặt thuê kho trực tuyến (chỉ dành riêng cho Khách hàng). Bạn có thể truy cập Cổng Quản lý để kiểm tra và xử lý kho.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/staff"
                    className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Đến Staff Portal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* ================= STEP 1: SELECT UNIT TYPE ================= */}
              {step === "unit" && (
                <div>
                  <div className="mb-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Bước 1 / 3: Khảo Sát Nhu Cầu
                    </span>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      Chọn Loại Ngăn Kho Phù Hợp
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5">
                      Tất cả các kho đều trang bị khóa điện tử Smart Lock, camera AI giám sát 24/7 và hệ thống hút ẩm tiêu chuẩn quốc tế.
                    </p>
                  </div>

                  {unitTypes.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Boxes className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-600" />
                      <p className="font-bold text-slate-600">Cơ sở này hiện chưa có loại kho trống trực tuyến.</p>
                      <p className="text-xs text-slate-400 mt-1">Vui lòng liên hệ hotline cơ sở để được nhân viên hỗ trợ ngay.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
                      {unitTypes.map((ut) => {
                        const isSelected = selectedUnitType?.id === ut.id;
                        return (
                          <div
                            key={ut.id}
                            onClick={() => setSelectedUnitType(ut)}
                            className={`text-left rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer relative ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/20 shadow-lg shadow-blue-500/10 scale-[1.02]"
                                : "border-slate-200 hover:border-blue-400 hover:shadow-md bg-white"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}

                            <div>
                              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg mb-4 border border-orange-100">
                                📦
                              </div>

                              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-1">
                                {ut.name}
                              </h3>

                              <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-4 leading-relaxed">
                                {ut.description || `Kho tiêu chuẩn kích thước ${ut.size} ${ut.sizeUnit}`}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-blue-600 tabular-nums">
                                  {Number(ut.price ?? ut.depositAmount).toLocaleString("vi-VN")}
                                </span>
                                <span className="text-xs text-slate-400 font-bold"> đ/tháng</span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                  <Tag className="w-3 h-3 text-slate-400" />
                                  <span>Quy cách: {ut.size} {ut.sizeUnit}</span>
                                </span>
                                <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200/80">
                                  Cọc: {Number(ut.depositAmount).toLocaleString("vi-VN")} đ
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    

                    <button
                      onClick={() => setStep("schedule")}
                      disabled={!selectedUnitType}
                      className="inline-flex justify-center items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-full shadow-md shadow-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ml-auto"
                    >
                      <span>Tiếp tục bước 2</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: SCHEDULE & DURATION ================= */}
              {step === "schedule" && (
                <div>
                  <div className="mb-8">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Bước 2 / 3: Lên Lịch Tiếp Nhận
                    </span>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      Chọn Lịch Dọn Đồ &amp; Kỳ Hạn
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5">
                      Lựa chọn ngày nhận kho, khung giờ hẹn nhân viên và thời gian dự kiến thuê.
                    </p>
                  </div>

                  <div className="space-y-10">
                    {/* HÀNG 1: NGÀY BẮT ĐẦU & KHUNG GIỜ NẰM CÙNG HÀNG */}
                    {/* HÀNG 1: NGÀY BẮT ĐẦU & KHUNG GIỜ NẰM CÙNG HÀNG (CÂN ĐỐI 50% - 50%) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch">
                      {/* Cột 1: Ngày Bắt Đầu Dọn Đồ Vào Kho (50%) */}
                      <div className="flex flex-col h-full">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-600" />
                          1. Ngày Bắt Đầu Dọn Đồ Vào Kho
                        </h2>

                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs w-full flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-5">
                            <button
                              type="button"
                              onClick={() => {
                                if (calMonth === 0) {
                                  setCalMonth(11);
                                  setCalYear((y) => y - 1);
                                } else setCalMonth((m) => m - 1);
                              }}
                              className="p-2 rounded-xl hover:bg-white text-slate-600 transition border border-transparent hover:border-slate-200 cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-extrabold text-slate-900 text-sm">{monthNameVi}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (calMonth === 11) {
                                  setCalMonth(0);
                                  setCalYear((y) => y + 1);
                                } else setCalMonth((m) => m + 1);
                              }}
                              className="p-2 rounded-xl hover:bg-white text-slate-600 transition border border-transparent hover:border-slate-200 cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center flex-1 items-center">
                            {VIETNAMESE_DAYS.map((d) => (
                              <div key={d} className="text-xs font-bold text-slate-400 pb-1">
                                {d}
                              </div>
                            ))}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                              <div key={"e" + i} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1;
                              const dateStr =
                                calYear +
                                "-" +
                                String(calMonth + 1).padStart(2, "0") +
                                "-" +
                                String(day).padStart(2, "0");

                              // Quy tắc: Đặt trước tối thiểu 1 ngày (Next-day booking)
                              const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                              const cellDate = new Date(calYear, calMonth, day);
                              const isPastOrToday = cellDate < startOfTomorrow;
                              const isToday =
                                cellDate.getFullYear() === today.getFullYear() &&
                                cellDate.getMonth() === today.getMonth() &&
                                cellDate.getDate() === today.getDate();
                              const isSel = moveInDate === dateStr;

                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => !isPastOrToday && setMoveInDate(dateStr)}
                                  disabled={isPastOrToday}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all tabular-nums cursor-pointer ${
                                    isPastOrToday
                                      ? isToday
                                        ? "text-slate-400 bg-slate-100/90 cursor-not-allowed border border-slate-200"
                                        : "text-slate-300 cursor-not-allowed"
                                      : isSel
                                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                                      : "text-slate-800 hover:bg-white border border-transparent hover:border-slate-200"
                                  }`}
                                  title={
                                    isToday
                                      ? "Hôm nay (Cần đặt lịch hẹn trước tối thiểu 1 ngày để cơ sở chuẩn bị kho)"
                                      : isPastOrToday
                                      ? "Đã qua ngày này"
                                      : `Chọn ngày ${day}/${calMonth + 1}`
                                  }
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>

                          {/* Ghi chú quy tắc đặt lịch hẹn trước tối thiểu 1 ngày */}
                          <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Quy tắc đặt lịch:</strong> Cơ sở áp dụng quy tắc đặt trước tối thiểu 1 ngày (chọn từ ngày mai trở đi) để nhân viên kỹ thuật kịp kiểm tra khóa thông minh, vệ sinh và chuẩn bị ô kho chu đáo nhất trước khi đón tiếp bạn.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cột 2: Khung Giờ Nhân Viên Hỗ Trợ Tiếp Nhận (50%) */}
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            2. Khung Giờ Nhân Viên Hỗ Trợ Tiếp Nhận
                          </h2>
                          {loadingSlots && (
                            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Đang kiểm tra ca giờ...
                            </span>
                          )}
                        </div>

                        {!moveInDate ? (
                          <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center text-xs text-slate-500 font-medium flex-1 flex flex-col items-center justify-center min-h-[320px]">
                            <CalendarDays className="w-10 h-10 text-slate-400 mb-3 opacity-50" />
                            <p className="max-w-xs leading-relaxed font-semibold text-slate-600">
                              Vui lòng chọn <strong>Ngày Bắt Đầu Dọn Đồ</strong> ở lịch bên cạnh để xem các khung giờ khả dụng.
                            </p>
                          </div>
                        ) : timeSlots.filter((s) => s.available).length === 0 && !loadingSlots ? (
                          <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center text-xs text-amber-800 font-medium flex-1 flex items-center justify-center min-h-[320px]">
                            Hiện tại các khung giờ trong ngày này đã kín lịch. Vui lòng chọn ngày khác.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 content-start">
                            {timeSlots
                              .filter((slot) => slot.available)
                              .map((slot) => {
                                const isSel = timeSlot?.id === slot.id;
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => setTimeSlot(slot)}
                                    className={`p-4 sm:p-5 border-2 rounded-2xl transition-all flex flex-col justify-between min-h-[84px] cursor-pointer ${
                                      isSel
                                        ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-md scale-[1.01]"
                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:shadow-xs"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                          isSel ? "border-blue-600" : "border-slate-300"
                                        }`}
                                      >
                                        {isSel && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                      </div>
                                      <span className="font-bold text-xs sm:text-sm">{slot.label}</span>
                                    </div>

                                    <div className="flex items-center text-[11px] text-slate-400 font-medium pl-6.5 mt-2">
                                      <span>Nhận bàn giao kho</span>
                                    </div>
                                  </div>
                                );
                              })}
                            {/* Card hoàn thiện bố cục khi số ca bị lẻ (7 ca) để 2 cột luôn vuông vức, cân xứng tuyệt đối với lịch */}
                            {timeSlots.filter((slot) => slot.available).length % 2 !== 0 && (
                              <div className="p-4 sm:p-5 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center min-h-[84px] bg-slate-50/60">
                                <span className="text-xs font-bold text-slate-600">Khung giờ khác?</span>
                                <span className="text-[11px] text-slate-400 font-medium mt-1">Liên hệ hotline 028 7770 0117</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rental Duration Options */}
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        3. Thời Gian Thuê Kho Dự Kiến
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {durationOptions.map((d) => {
                          const isSel = durationKey === d.key;
                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => setDurationKey(d.key)}
                              className={`p-4 border-2 rounded-2xl font-bold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                isSel
                                  ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-md scale-[1.02]"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <span className="text-sm">{d.label}</span>
                              {d.badge ? (
                                <span className="mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">
                                  {d.badge}
                                </span>
                              ) : d.discount > 0 ? (
                                <span className="mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">
                                  Giảm {d.discount}%
                                </span>
                              ) : (
                                <span className="mt-1.5 text-[10px] text-slate-400 font-medium">Tiêu chuẩn</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Bottom Controls */}
                  <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep("unit")}
                      className="px-6 py-3.5 rounded-full border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                    >
                      ← Quay lại
                    </button>

                    {isStaffOrAdmin ? (
                      <Link
                        href="/staff"
                        className="inline-flex justify-center items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold text-sm uppercase tracking-wider rounded-full shadow-md transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Chuyển Sang Cổng Quản Lý Nhân Viên</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateQR}
                        disabled={!isStep2Valid || submitting}
                        className="inline-flex justify-center items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-full shadow-md shadow-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>Xác Nhận &amp; Nhận Mã QR</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ================= STEP 3: PAYMENT QR ================= */}
              {step === "payment_qr" && qrData && (
                <div>
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Bước 3 / 3: Quét Mã Thanh Toán Cọc
                      </span>
                      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold self-start sm:self-auto transition-colors ${
                        timeLeft <= 120 
                          ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Thời gian giữ chỗ còn: <strong className="tabular-nums font-black">{formatCountdown(timeLeft)}</strong></span>
                      </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      Thanh Toán Cọc Giữ Chỗ Tự Động
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5">
                      Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR. Hệ thống tự động xác nhận sau 5 - 10 giây khi nhận được tiền.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200">
                    
                    {/* VietQR Display (Chỉ hiển thị ảnh VietQR như ảnh 2) */}
                    <div className="md:col-span-6 flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                      <img
                        src={qrData.qrCodeUrl}
                        alt="Mã VietQR Chuyển Khoản"
                        className="w-full max-w-[280px] sm:max-w-[320px] aspect-square object-contain"
                      />
                    </div>

                    {/* Bank Info Details */}
                    <div className="md:col-span-6 space-y-3.5 text-xs sm:text-sm">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngân Hàng Thụ Hưởng</p>
                          <p className="font-bold text-slate-900 text-base">{qrData.bankCode || "MBBank"}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên Chủ Tài Khoản</p>
                          <p className="font-bold text-slate-900">{qrData.accountName || "SELF STORAGE SYSTEM"}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số Tài Khoản</p>
                          <p className="font-black text-blue-600 text-lg tabular-nums">{qrData.accountNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(qrData.accountNumber, "Số tài khoản")}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số Tiền Thanh Toán</p>
                          <p className="font-black text-emerald-600 text-xl tabular-nums">
                            {Number(qrData.amount).toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(qrData.amount), "Số tiền")}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                          title="Sao chép số tiền"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nội Dung Chuyển Khoản</p>
                          <p className="font-bold text-slate-900 tabular-nums bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                            {qrData.transferContent}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(qrData.transferContent, "Nội dung chuyển khoản")}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Webhook simulation & help */}
                  <div className="mt-8 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản VietQR (tự động chuyển trang khi hoàn tất)...</span>
                    </p>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={simulatingWebhook}
                      className="inline-flex justify-center items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {simulatingWebhook ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      <span>Mô Phỏng Đã Chuyển Khoản Thành Công (Demo Webhook)</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: RESERVATION SUMMARY SIDEBAR */}
            <div className="lg:col-span-4 sticky top-28 self-start">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs relative overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600 absolute top-0 inset-x-0" />

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Tóm Tắt Đặt Chỗ
                  </h2>
                  
                </div>

                <div className="space-y-4 text-xs sm:text-sm pt-4">
                  {/* Facility Info */}
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      Cơ Sở Lưu Trữ
                    </p>
                    <p className="font-bold text-slate-900 leading-snug">
                      {facility?.name || "Cơ sở #" + facilityId}
                    </p>
                    {facility?.address && (
                      <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{facility.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Unit Type Info */}
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Boxes className="w-3 h-3 text-slate-400" />
                      Loại Ngăn Kho
                    </p>
                    <p className="font-bold text-slate-900">
                      {selectedUnitType?.name || "Chưa chọn loại kho"}
                    </p>
                    {selectedUnitType && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kích thước: {selectedUnitType.size} {selectedUnitType.sizeUnit}
                      </p>
                    )}
                  </div>

                  {/* Move-in Date & Time */}
                  {moveInDate && (
                    <div className="pb-3 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                        Lịch Nhận Kho
                      </p>
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatDateVi(moveInDate)} {timeSlot && `• ${timeSlot.label}`}
                      </p>
                    </div>
                  )}

                  {/* Duration (Chỉ hiện khi đã chọn thời gian thuê) */}
                  {durationInfo && (
                    <div className="pb-3 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Thời Gian Thuê
                      </p>
                      <p className="font-bold text-slate-900">{durationInfo.label}</p>
                    </div>
                  )}

                  {/* Price breakdown */}
                  {selectedUnitType && (
                    <div className="pt-2 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Giá thuê niêm yết:</span>
                        <span className="font-semibold tabular-nums">{monthlyPrice.toLocaleString("vi-VN")} đ / tháng</span>
                      </div>

                      {durationInfo && durationInfo.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Ưu đãi kỳ hạn ({durationInfo.discount}%):</span>
                          <span className="tabular-nums">
                            {discountedRentalPrice.toLocaleString("vi-VN")} đ / tháng
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline font-black text-slate-900 text-sm sm:text-base pt-3 border-t border-slate-200">
                        <div className="flex flex-col">
                          <span>Tiền Cọc Cần Nộp:</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">Trừ thẳng vào tiền thuê khi nhận phòng</span>
                        </div>
                        <span className="text-xl sm:text-2xl text-orange-500 tabular-nums font-black">
                          {depositAmount.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-2 leading-tight">
                        * Lưu ý: Tiền cọc sẽ được trừ trực tiếp vào tiền thuê khi ký hợp đồng và không hoàn lại nếu quý khách hủy đơn.
                      </p>
                    </div>
                  )}

                  {isStaffOrAdmin && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900">Tài khoản Nhân viên</p>
                        <p className="text-amber-700 mt-0.5">Không hỗ trợ chức năng thanh toán cọc giữ chỗ trực tuyến.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}