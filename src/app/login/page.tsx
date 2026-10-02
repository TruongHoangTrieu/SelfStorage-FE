"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  // Load saved email if rememberMe was previously checked
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("saved_email");
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail }));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (rememberMe) {
        localStorage.setItem("saved_email", formData.email);
      } else {
        localStorage.removeItem("saved_email");
      }

      const getTargetRoute = (userObj: any) => {
        const redirectParam =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect")
            : null;

        if (redirectParam) {
          return redirectParam;
        }

        const role =
          typeof userObj?.role === "string"
            ? userObj.role.toUpperCase()
            : userObj?.role?.name?.toUpperCase() ?? "";

        if (role === "ADMIN") return "/admin";
        if (role === "STAFF") return "/staff";
        return "/";
      };

      if (isLogin) {
        const res = await api.post("/auth/login", {
          email: formData.email.trim(),
          password: formData.password
        });

        if (res?.accessToken) {
          localStorage.setItem("token", res.accessToken);
        }
        if (res?.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
        }

        // Notify other components/tabs of auth change
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-change"));

        const displayName = res?.user?.fullName || res?.user?.email || "";
        toast.success(`Đăng nhập thành công! Chào mừng ${displayName}`);

        const targetRoute = getTargetRoute(res?.user);
        router.push(targetRoute);
      } else {
        // Sign Up Flow
        const regRes = await api.post("/auth/register", {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password
        });

        if (regRes?.accessToken) {
          localStorage.setItem("token", regRes.accessToken);
          localStorage.setItem("user", JSON.stringify(regRes.user));
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new Event("auth-change"));
          toast.success("Đăng ký tài khoản thành công!");
          router.push(getTargetRoute(regRes?.user));
        } else {
          // Auto login after successful registration
          const loginRes = await api.post("/auth/login", {
            email: formData.email.trim(),
            password: formData.password
          });
          if (loginRes?.accessToken) {
            localStorage.setItem("token", loginRes.accessToken);
          }
          if (loginRes?.user) {
            localStorage.setItem("user", JSON.stringify(loginRes.user));
          }
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new Event("auth-change"));
          toast.success("Tạo tài khoản và đăng nhập thành công!");
          router.push(getTargetRoute(loginRes?.user));
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const errMsg =
        err?.message ||
        (isLogin
          ? "Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu."
          : "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      
      {/* ============================================================== */}
      {/* LEFT COLUMN: HERO PANEL ĐỒNG BỘ THEO MÀU XANH LOGO WEB        */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[46%] relative bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/50 overflow-hidden flex-col justify-between p-12 xl:p-16 select-none border-r border-blue-100/60">
        
        {/* Hình khối nghệ thuật màu Xanh Hoàng Gia & Điểm xuyết Vàng Hổ Phách theo Logo */}
        {/* 1. Top Right Blob (Xanh dương chủ đạo của khối logo) */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-[2px] opacity-90 transition-transform duration-700 pointer-events-none"
          style={{
            borderRadius: "45% 55% 60% 40% / 50% 45% 55% 50%"
          }}
        />
        {/* Subtle accent glow behind top right */}
        <div
          aria-hidden="true"
          className="absolute -top-6 -right-6 w-48 h-48 bg-blue-600 rounded-full opacity-30 blur-2xl pointer-events-none"
        />

        {/* 2. Middle Right Floating Dot (Màu hổ phách ánh vàng tinh tế lấy từ lõi logo) */}
        <div
          aria-hidden="true"
          className="absolute top-[44%] right-[10%] w-7 h-7 bg-amber-400 rounded-full opacity-90 shadow-md shadow-amber-500/25 pointer-events-none animate-pulse"
        />

        {/* 3. Bottom Left Large Organic Hill / Wave Blob */}
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-20 w-[420px] h-[340px] bg-blue-200/50 rounded-[120px] pointer-events-none"
          style={{
            transform: "rotate(-18deg)",
            borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%"
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-8 -left-10 w-48 h-48 bg-gradient-to-tr from-blue-600 to-indigo-500 opacity-90 pointer-events-none"
          style={{
            borderRadius: "55% 45% 65% 35% / 45% 55% 45% 55%"
          }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-20 left-36 w-6 h-6 bg-blue-500 rounded-full opacity-80 pointer-events-none"
        />

        {/* Top Header: Link Về trang chủ & Logo thương hiệu */}
        <div className="relative z-10 space-y-2">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Về trang chủ</span>
            </Link>
          </div>

          <div className="-ml-2 sm:-ml-4">
            <Link href="/" className="inline-block group" title="Về trang chủ SelfStorage">
              <img
                src="/logo.png"
                alt="SelfStorage Logo"
                className="h-20 sm:h-24 md:h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
              />
            </Link>
          </div>
        </div>

        {/* Center Main Headline (Tiếng Việt đồng bộ màu Xanh Logo) */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.2]">
            Bắt đầu cùng <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
              {isLogin ? "Tài khoản của bạn" : "Không gian lưu trữ"}
            </span>
          </h2>

          <p className="mt-5 text-slate-600 font-medium text-lg tracking-wide">
            Thông tin thông minh, quyết định tối ưu.
          </p>

          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Hệ thống đặt phòng, thanh toán cọc và mở khóa thông minh 24/7 trực tuyến.
          </p>
        </div>

        {/* Đã xóa hoàn toàn khối "Bạn chưa có tài khoản? Đăng ký ngay" ở góc dưới bên trái theo yêu cầu */}
        <div className="relative z-10 h-6" />

      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: KHUNG FORM ĐĂNG NHẬP / ĐĂNG KÝ (TIẾNG VIỆT)      */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[52%] xl:w-[54%] bg-white flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-6 sm:py-8 min-h-screen overflow-y-auto">
        
        {/* Top Navbar Mobile (Chỉ hiện khi ở màn hình nhỏ) */}
        <div className="lg:hidden w-full max-w-md mx-auto mb-4 space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Về trang chủ</span>
          </Link>
          <div>
            <Link href="/" className="inline-flex items-center">
              <img
                src="/logo.png"
                alt="SelfStorage Logo"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>
          </div>
        </div>

        {/* Central Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          
          {/* Title Header (Tiếng Việt) */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? "Chào Mừng Trở Lại" : "Tạo Tài Khoản"}
            </h1>
            <p className="mt-1.5 text-slate-500 font-normal text-sm sm:text-base">
              {isLogin
                ? "Đăng nhập vào tài khoản của bạn để tiếp tục"
                : "Điền thông tin để bắt đầu thuê kho và quản lý"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Khi ở chế độ Đăng Ký) */}
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required={!isLogin}
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                />
              </div>
            )}

            {/* Phone Number (Khi ở chế độ Đăng Ký) */}
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại (tùy chọn)"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                />
              </div>
            )}

            {/* Email Address với Icon máy bay giấy */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Send className="w-5 h-5 -rotate-12" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập địa chỉ Email của bạn"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
            </div>

            {/* Password với Icon ổ khóa và nút bật/tắt mật khẩu */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu của bạn"
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Tùy chọn: Ghi nhớ đăng nhập & Quên mật khẩu */}
            {isLogin && (
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Ghi nhớ đăng nhập
                  </span>
                </label>

                <a
                  href="mailto:support@selfstorage.com?subject=Quen%20mat%20khau%20SelfStorage"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
            )}

            {/* Nút bấm Đăng nhập chuẩn tông màu xanh thương hiệu đồng bộ Logo */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-bold text-white text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>{isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}</span>
                )}
              </button>
            </div>
          </form>

          {/* Đường phân cách */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-medium">
                hoặc tiếp tục với
              </span>
            </div>
          </div>

          {/* Nút Tiếp tục với Google */}
          <button
            type="button"
            onClick={() => {
              alert("Tính năng Đăng nhập bằng Google đang được hoàn thiện. Vui lòng sử dụng email/mật khẩu hệ thống.");
            }}
            className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 font-semibold text-slate-700 text-sm sm:text-base cursor-pointer shadow-sm group active:scale-[0.99]"
          >
            {/* Google G Logo SVG 4 màu chuẩn */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Tiếp tục với Google</span>
          </button>

          {/* Chuyển đổi giữa Đăng nhập & Đăng ký duy nhất tại đây */}
          <div className="mt-8 text-center text-sm font-medium text-slate-600">
            <span>{isLogin ? "Bạn chưa có tài khoản? " : "Bạn đã có tài khoản? "}</span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 group transition-colors cursor-pointer"
            >
              <span>{isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Chân trang bản quyền */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-slate-400 pt-4">
          © {new Date().getFullYear()} SelfStorage Việt Nam. Bảo lưu mọi quyền.
        </div>

      </div>

    </div>
  );
}
