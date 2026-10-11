"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực thông tin đăng nhập Google...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get("error");
        if (error) {
          setStatus("error");
          setMessage(error);
          toast.error(error);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        const userParam = searchParams.get("user");
        let userObj: any = null;

        if (userParam) {
          try {
            userObj = JSON.parse(decodeURIComponent(userParam));
          } catch {
            userObj = null;
          }
        }

        // Nếu chưa có user từ query, gọi /auth/me để lấy từ session cookie
        if (!userObj) {
          try {
            userObj = await api.get("/auth/me");
          } catch {
            // bỏ qua
          }
        }

        if (userObj) {
          localStorage.setItem("user", JSON.stringify(userObj));
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new Event("auth-change"));

          setStatus("success");
          setMessage("Đăng nhập thành công! Đang chuyển hướng...");

          const displayName = userObj.fullName || userObj.email || "";
          toast.success(`Đăng nhập Google thành công! Chào mừng ${displayName}`);

          // Role-based redirect
          const role = (
            typeof userObj?.role === "string"
              ? userObj.role
              : userObj?.role?.name ?? ""
          ).toUpperCase();

          let targetRoute = "/dashboard";
          if (
            role === "ADMIN" ||
            role === "SYSTEM_ADMINISTRATOR" ||
            role.includes("ADMIN")
          ) {
            targetRoute = "/admin";
          } else if (
            role === "STAFF" ||
            role === "FACILITY_STAFF" ||
            role === "OPERATIONS_STAFF" ||
            role === "FACILITY_MANAGER" ||
            role === "BUSINESS_OPERATIONS_MANAGER" ||
            role.includes("STAFF") ||
            role.includes("MANAGER")
          ) {
            targetRoute = "/staff";
          }

          setTimeout(() => {
            router.push(targetRoute);
          }, 800);
        } else {
          throw new Error("Không thể trích xuất thông tin người dùng sau khi xác thực.");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        const errMsg = err?.message || "Đăng nhập Google thất bại.";
        setStatus("error");
        setMessage(errMsg);
        toast.error(errMsg);
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-blue-500/5 text-center flex flex-col items-center">
        {/* Google G Logo icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-8 h-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {status === "loading" && "Đang xử lý đăng nhập Google"}
          {status === "success" && "Xác thực thành công!"}
          {status === "error" && "Có lỗi xảy ra"}
        </h2>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">{message}</p>

        {status === "loading" && (
          <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Vui lòng chờ trong giây lát...</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Đang chuyển hướng vào hệ thống...</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Chuyển về trang đăng nhập sau vài giây...</span>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Quay lại đăng nhập ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
