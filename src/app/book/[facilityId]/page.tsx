"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft, CheckCircle2, ChevronRight, Shield, CreditCard,
  CalendarDays, Clock, ChevronLeft, Loader2,
  AlertTriangle, PartyPopper, Building2, Boxes, QrCode,
} from "lucide-react";

const DURATION_MAP = {
  "1_month": { months: 1, label: "1 month", discount: 0 },
  "2_months": { months: 2, label: "2 months", discount: 0 },
  "3_months": { months: 3, label: "3 months", discount: 5 },
  "6_months": { months: 6, label: "6 months", discount: 10 },
  "1_year": { months: 12, label: "1+ year", discount: 15 },
};

const TIME_SLOTS = [
  { label: "09:00 - 10:30", iso: "T09:00:00.000Z" },
  { label: "10:30 - 12:00", iso: "T10:30:00.000Z" },
  { label: "14:00 - 15:30", iso: "T14:00:00.000Z" },
];

/**
 * Helper: figure out whether an error means "user needs to authenticate"
 * — handles both 401 and 403, plus a few message fallbacks in case
 * the api wrapper doesn't expose the status code.
 */
function isAuthError(err: any): boolean {
  const status =
    err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.cause?.status;

  if (status === 401 || status === 403) return true;

  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("authentication") ||
    msg.includes("session") ||
    msg.includes("log in") ||
    msg.includes("sign in") ||
    msg.includes("no role") ||
    msg.includes("401") ||
    msg.includes("403")
  );
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
  const [timeSlot, setTimeSlot] = useState<{ label: string; iso: string } | null>(null);
  const [durationKey, setDurationKey] = useState<keyof typeof DURATION_MAP>("3_months");

  const [submitting, setSubmitting] = useState(false);
  const [reservationCode, setReservationCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [authError, setAuthError] = useState(false); // ← NEW: track auth vs generic failure
  const [qrData, setQrData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const monthName = new Date(calYear, calMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();

  useEffect(() => {
    async function loadData() {
      try {
        const [facilityData, unitTypesData] = await Promise.all([
          api.get("/facilities/" + facilityId),
          api.get("/storage-unit-types?facilityId=" + facilityId),
        ]);
        setFacility(facilityData);
        setUnitTypes(unitTypesData.data || unitTypesData || []);
      } catch (e) {
        console.error("Failed to load facility data", e);
      } finally {
        setLoadingData(false);
      }
    }
    if (facilityId) loadData();
  }, [facilityId]);

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

  const durationInfo = DURATION_MAP[durationKey];
  const monthlyPrice = Number(selectedUnitType?.depositAmount) || 0;
  const discountedPrice = monthlyPrice * (1 - durationInfo.discount / 100);

  const isStep2Valid = Boolean(moveInDate && timeSlot && durationKey);

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
      router.push(`/login?redirect=${encodeURIComponent(`/book/${facilityId}`)}`);
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
        rentalPeriod: durationInfo.months,
        rentalPeriodUnit: "MONTHS",
        notes: "Booked online",
      });

      const resId = resResult.id;
      setReservationCode(resResult.reservationCode || "RES-" + Date.now());

      const payResult = await api.post("/payments/deposit", {
        reservationId: resId,
        paymentMethod: "BANK_TRANSFER",
      });

      setQrData(payResult.qr);
      setPaymentData(payResult.payment);
      setStep("payment_qr");
    } catch (err: any) {
      setStep("failed");

      if (isAuthError(err)) {
        // token is stale / missing / account has no role → clear & send to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthError(true);
        setErrorMsg(
          "Your session has expired or you are not logged in. Please sign in to complete your reservation.",
        );
      } else {
        setAuthError(false);
        setErrorMsg(err?.message || "Reservation failed. Please try again.");
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
      throw new Error(`Invalid payment amount from server: ${paymentData.amount}`);
    }

    const webhookPayload = {
      id: Math.floor(Math.random() * 1000000),
      gateway: "MBBank",
      transactionDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      accountNumber: "0900000000",
      code: qrData.transferContent,
      content: `${qrData.transferContent} CK coc`,
      transferType: "in" as const,
      transferAmount: amount,   // ← guaranteed number
    };

    const res = await fetch("/api/payments/sepay/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
    if (body?.success === false) throw new Error(body?.message || "Webhook returned success: false");

    setStep("success");
  } catch (err: any) {
    alert("Failed to simulate webhook: " + (err?.message ?? "unknown error"));
  } finally {
    setSimulatingWebhook(false);
  }
};

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="font-medium">Loading facility details...</span>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-lg w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-200">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-[#1e1b4b] mb-3">Reservation Confirmed!</h1>
          <p className="text-slate-500 font-medium mb-6">
            Your unit is reserved. Our staff will complete the handover on your check-in date.
          </p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-6 space-y-3 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Reservation Code</span>
              <span className="font-black text-[#7E22CE] font-mono">{reservationCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Facility</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{facility?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Unit Type</span>
              <span className="font-bold">{selectedUnitType?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Check-in</span>
              <span className="font-bold">{moveInDate} • {timeSlot?.label}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3">
              <span className="text-slate-500 font-semibold">Deposit Paid</span>
              <span className="font-black text-emerald-600">
                {Math.round(discountedPrice).toLocaleString("vi-VN")} &#x111;
              </span>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-medium text-left mb-8">
            Next step: Bring a valid ID on check-in day. Our staff will verify your identity and complete the handover.
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 px-6 py-3.5 bg-[#1e1b4b] text-white font-bold rounded-full hover:bg-[#7E22CE] transition-colors shadow-md"
            >
              Go to My Dashboard
            </button>
            <Link
              href="/"
              className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#1e1b4b] flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-[#1e1b4b] mb-2">Setting up your reservation...</h2>
        <p className="text-slate-500 font-medium mb-8">
          Please wait while we secure your unit and generate the payment QR code.
        </p>
        <div className="space-y-3 text-sm text-left max-w-xs mx-auto">
          {["Reserving storage unit...", "Generating deposit payment..."].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-4 h-4 text-[#7E22CE] animate-spin" />
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-red-100">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-red-700 mb-3">
            {authError ? "Authentication Required" : "Reservation Failed"}
          </h2>
          <p className="text-slate-500 font-medium mb-8">{errorMsg}</p>
          <div className="flex gap-3">
            {authError ? (
              <button
                onClick={() =>
                  router.push(`/login?redirect=${encodeURIComponent(`/book/${facilityId}`)}`)
                }
                className="flex-1 px-6 py-3.5 bg-[#1e1b4b] text-white font-bold rounded-full hover:bg-[#7E22CE] transition-colors"
              >
                Sign In Now
              </button>
            ) : (
              <button
                onClick={() => setStep("schedule")}
                className="flex-1 px-6 py-3.5 bg-[#1e1b4b] text-white font-bold rounded-full hover:bg-[#7E22CE] transition-colors"
              >
                Try Again
              </button>
            )}
            <Link
              href="/"
              className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepNumber = step === "unit" ? 1 : step === "schedule" ? 2 : 3;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-5 px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <Link
          href="/locations"
          className="group flex items-center text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          BACK
        </Link>
        <div className="text-xl font-black tracking-tight text-slate-950">
          Self<span className="text-[#7E22CE]">Storage</span>
        </div>
        <div className="w-16" />
      </header>

      <main className="flex-grow flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <div className="flex-grow p-6 lg:p-12">
          <div className="flex items-center space-x-2 mb-12">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors " +
                    (stepNumber === s
                      ? "bg-[#1e1b4b] text-white"
                      : stepNumber > s
                      ? "bg-[#7E22CE] text-white"
                      : "bg-slate-200 text-slate-500")
                  }
                >
                  {stepNumber > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={
                      "h-1 w-12 sm:w-24 transition-colors " +
                      (stepNumber > s ? "bg-[#7E22CE]" : "bg-slate-200")
                    }
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="max-w-3xl">
            {step === "unit" && (
              <div>
                <h1 className="text-4xl font-black text-[#1e1b4b] mb-3 tracking-tight">
                  Select a Unit Type
                </h1>
                {facility && (
                  <p className="flex items-center gap-2 text-slate-500 font-medium mb-8 text-sm">
                    <Building2 className="w-4 h-4" />
                    {facility.name}
                  </p>
                )}
                {unitTypes.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Boxes className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No unit types available for this facility.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                    {unitTypes.map((ut) => (
                      <button
                        key={ut.id}
                        onClick={() => setSelectedUnitType(ut)}
                        className={
                          "text-left rounded-3xl border-2 overflow-hidden transition-all duration-300 flex flex-col bg-white " +
                          (selectedUnitType?.id === ut.id
                            ? "border-[#1e1b4b] shadow-2xl scale-[1.02]"
                            : "border-slate-200 hover:border-[#1e1b4b] hover:shadow-xl")
                        }
                      >
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className={
                                "w-10 h-10 rounded-xl flex items-center justify-center text-lg " +
                                (selectedUnitType?.id === ut.id
                                  ? "bg-[#1e1b4b] text-white"
                                  : "bg-slate-100")
                              }
                            >
                              📦
                            </div>
                            {selectedUnitType?.id === ut.id && (
                              <div className="bg-[#1e1b4b] text-white p-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-[#1e1b4b] mb-1">{ut.name}</h3>
                          <p className="text-sm text-slate-500 font-medium mb-3 flex-1">
                            {ut.description || ut.size + " " + ut.sizeUnit}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#7E22CE]">
                              {Number(ut.depositAmount).toLocaleString("vi-VN")}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold"> &#x111;/month</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {ut.size} {ut.sizeUnit}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setStep("schedule")}
                  disabled={!selectedUnitType}
                  className="inline-flex justify-center items-center px-10 py-4 bg-[#1e1b4b] text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#7E22CE] transition-colors rounded-full shadow-md"
                >
                  Continue <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            )}

            {step === "schedule" && (
              <div>
                <h1 className="text-4xl font-black text-[#1e1b4b] mb-3 tracking-tight">
                  When do you need it?
                </h1>
                <p className="text-slate-500 font-medium mb-10">
                  Choose your move-in date, time slot, and rental duration.
                </p>
                <div className="space-y-12">
                  <div>
                    <h2 className="text-sm font-bold text-[#7E22CE] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Move-In Date
                    </h2>
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 max-w-sm shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <button
                          onClick={() => {
                            if (calMonth === 0) {
                              setCalMonth(11);
                              setCalYear((y) => y - 1);
                            } else setCalMonth((m) => m - 1);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-[#1e1b4b]">{monthName}</span>
                        <button
                          onClick={() => {
                            if (calMonth === 11) {
                              setCalMonth(0);
                              setCalYear((y) => y + 1);
                            } else setCalMonth((m) => m + 1);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d} className="text-xs font-bold text-slate-400 pb-2">
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
                          const isPast = new Date(dateStr) < today;
                          const isSel = moveInDate === dateStr;
                          return (
                            <button
                              key={day}
                              onClick={() => !isPast && setMoveInDate(dateStr)}
                              disabled={isPast}
                              className={
                                "w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all " +
                                (isPast
                                  ? "text-slate-300 cursor-not-allowed"
                                  : isSel
                                  ? "bg-[#7E22CE] text-white shadow-md scale-110"
                                  : "text-[#1e1b4b] hover:bg-slate-100")
                              }
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#7E22CE] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time Slot
                    </h2>
                    <div className="space-y-3 max-w-sm">
                      {TIME_SLOTS.map((slot) => (
                        <label
                          key={slot.label}
                          className={
                            "flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all " +
                            (timeSlot?.label === slot.label
                              ? "border-[#7E22CE] bg-purple-50"
                              : "border-slate-200 bg-white hover:border-slate-300")
                          }
                        >
                          <div
                            className={
                              "w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 " +
                              (timeSlot?.label === slot.label
                                ? "border-[#7E22CE]"
                                : "border-slate-300")
                            }
                          >
                            {timeSlot?.label === slot.label && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#7E22CE]" />
                            )}
                          </div>
                          <span
                            className={
                              "font-bold text-sm " +
                              (timeSlot?.label === slot.label
                                ? "text-[#7E22CE]"
                                : "text-slate-600")
                            }
                          >
                            {slot.label}
                          </span>
                          <input
                            type="radio"
                            className="hidden"
                            checked={timeSlot?.label === slot.label}
                            onChange={() => setTimeSlot(slot)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#7E22CE] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Rental Duration
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(Object.entries(DURATION_MAP) as [keyof typeof DURATION_MAP, (typeof DURATION_MAP)[keyof typeof DURATION_MAP]][]).map(
                        ([key, d]) => (
                          <button
                            key={key}
                            onClick={() => setDurationKey(key)}
                            className={
                              "p-4 border-2 rounded-2xl font-bold flex flex-col items-center text-center transition-all text-sm " +
                              (durationKey === key
                                ? "border-[#1e1b4b] bg-slate-50 text-[#1e1b4b] shadow-md scale-[1.02]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")
                            }
                          >
                            <span>{d.label}</span>
                            {d.discount > 0 && (
                              <span className="mt-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full">
                                Save {d.discount}%
                              </span>
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex items-center space-x-4 border-t border-slate-200 pt-8">
                  <button
                    onClick={() => setStep("unit")}
                    className="px-6 py-4 font-bold text-slate-600 hover:text-slate-950 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateQR}
                    disabled={!isStep2Valid || submitting}
                    className="flex-grow sm:flex-grow-0 inline-flex justify-center items-center px-10 py-4 bg-[#1e1b4b] text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#7E22CE] transition-colors rounded-full shadow-md"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Confirm &amp; Get QR <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {step === "payment_qr" && qrData && (
              <div>
                <h1 className="text-4xl font-black text-[#1e1b4b] mb-3 tracking-tight">Pay Deposit</h1>
                <p className="text-slate-500 font-medium mb-6">
                  Scan the VietQR code using your banking app to secure your reservation.
                </p>

                <div className="flex flex-col md:flex-row gap-8 bg-white p-8 rounded-3xl border-2 border-slate-200">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <img
                      src={qrData.qrCodeUrl}
                      alt="VietQR"
                      className="w-64 h-64 object-contain rounded-xl border border-slate-100 p-2 shadow-sm"
                    />
                    <p className="text-xs font-semibold text-slate-400 mt-4 uppercase tracking-widest text-center">
                      Scan with any banking app
                    </p>
                  </div>
                  <div className="flex-1 space-y-4 pt-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bank</p>
                      <p className="font-bold text-slate-900 text-lg">{qrData.bankCode}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Account Name
                      </p>
                      <p className="font-bold text-slate-900 text-lg">{qrData.accountName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Account Number
                      </p>
                      <p className="font-bold text-[#1e1b4b] text-xl font-mono">
                        {qrData.accountNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Amount
                      </p>
                      <p className="font-black text-[#7E22CE] text-2xl">
                        {Number(qrData.amount).toLocaleString("vi-VN")} &#x111;
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Transfer Content
                      </p>
                      <p className="font-bold text-slate-900 font-mono bg-slate-100 p-2 rounded inline-block">
                        {qrData.transferContent}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center border-t border-slate-200 pt-8">
                  <p className="text-sm text-slate-500 font-medium mb-4">
                    Waiting for payment confirmation...
                  </p>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulatingWebhook}
                    className="inline-flex justify-center items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                  >
                    {simulatingWebhook ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <QrCode className="w-5 h-5" />
                    )}
                    Simulate Payment Success (Demo Webhook)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 lg:p-10 flex flex-col">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Reservation Summary
          </h2>
          <div className="space-y-4 text-sm flex-1">
            <div className="pb-4 border-b border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Facility</p>
              <p className="font-bold text-slate-900">
                {facility?.name || "Facility #" + facilityId}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{facility?.address}</p>
            </div>
            <div className="pb-4 border-b border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Unit Type</p>
              <p className="font-bold text-slate-900">{selectedUnitType?.name || "—"}</p>
              {selectedUnitType && (
                <p className="text-xs text-slate-400">
                  {selectedUnitType.size} {selectedUnitType.sizeUnit}
                </p>
              )}
            </div>
            {moveInDate && (
              <div className="pb-4 border-b border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Check-in</p>
                <p className="font-bold text-slate-900">{moveInDate}</p>
                {timeSlot && <p className="text-xs text-slate-400">{timeSlot.label}</p>}
              </div>
            )}
            <div className="pb-4 border-b border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Duration</p>
              <p className="font-bold text-slate-900">{durationInfo.label}</p>
            </div>
            {selectedUnitType && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Monthly Rent</span>
                  <span>{monthlyPrice.toLocaleString("vi-VN")} &#x111;</span>
                </div>
                {durationInfo.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                    <span>Discount (-{durationInfo.discount}%)</span>
                    <span>
                      -{(monthlyPrice * durationInfo.discount / 100).toLocaleString("vi-VN")} &#x111;
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[#1e1b4b] text-base pt-3 border-t border-slate-200">
                  <span>Deposit Due</span>
                  <span className="text-[#7E22CE]">
                    {Math.round(discountedPrice).toLocaleString("vi-VN")} &#x111;
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 bg-[#7E22CE]/10 p-5 rounded-2xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#7E22CE] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1e1b4b] font-semibold leading-relaxed">
              Your deposit secures the unit. Free cancellation 48h before check-in.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}