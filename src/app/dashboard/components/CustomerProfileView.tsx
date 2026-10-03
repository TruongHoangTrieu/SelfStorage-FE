'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  Calendar,
  Headphones,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { CustomerUser } from '../types';

interface CustomerProfileViewProps {
  customerUser: CustomerUser | null;
  onUserUpdated: (updatedUser: CustomerUser) => void;
}

export default function CustomerProfileView({
  customerUser,
  onUserUpdated,
}: CustomerProfileViewProps) {
  const router = useRouter();

  // Profile Form State
  const [fullName, setFullName] = useState(customerUser?.fullName || '');
  const [phone, setPhone] = useState(customerUser?.phone || '');
  const [email, setEmail] = useState(customerUser?.email || '');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Load fresh profile from GET /auth/me on mount
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const res = await api.get<any>('/auth/me');
        if (res) {
          setFullName(res.fullName || '');
          setPhone(res.phone || '');
          setEmail(res.email || '');
          if (res.createdAt) setCreatedAt(res.createdAt);

          const mappedUser: CustomerUser = {
            id: res.id,
            email: res.email,
            fullName: res.fullName,
            role: typeof res.role === 'object' ? res.role?.name : res.role,
            phone: res.phone,
          };
          onUserUpdated(mappedUser);
        }
      } catch (err) {
        console.warn('Could not fetch fresh user profile:', err);
      }
    };
    fetchFreshProfile();
  }, []);

  // Sync state if prop changes
  useEffect(() => {
    if (customerUser) {
      setFullName(customerUser.fullName || '');
      setPhone(customerUser.phone || '');
      setEmail(customerUser.email || '');
    }
  }, [customerUser]);

  // Handle Save Profile Information (PUT /auth/profile)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    setInfoSuccess(null);

    if (!fullName.trim()) {
      setInfoError('Họ và tên không được để trống');
      return;
    }

    setIsSavingInfo(true);
    try {
      const updated = await api.put<any>('/auth/profile', {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      const updatedUser: CustomerUser = {
        ...(customerUser || ({} as CustomerUser)),
        id: updated?.id || customerUser?.id || 0,
        email: updated?.email || email,
        fullName: fullName.trim(),
        role: updated?.role || customerUser?.role || 'STORAGE_CUSTOMER',
        phone: phone.trim() || undefined,
      };

      // Persist in localStorage for cross-component sync
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('customer_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('auth-change'));

      onUserUpdated(updatedUser);
      setInfoSuccess('Cập nhật thông tin tài khoản thành công!');
      toast.success('Cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật thông tin. Vui lòng thử lại.';
      setInfoError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Handle Change Password (PUT /auth/change-password)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu hiện tại
    if (newPassword === currentPassword) {
      setPassError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setIsSavingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPassSuccess('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Lưu email để hỗ trợ tự động điền sẵn ở form đăng nhập
      if (email || customerUser?.email) {
        try {
          localStorage.setItem('saved_email', email || customerUser?.email || '');
        } catch {
          // ignore localStorage error
        }
      }

      // Đăng xuất và dọn dẹp phiên đăng nhập cũ
      try {
        await api.post('/auth/logout');
      } catch (logoutErr) {
        console.warn('Backend logout notice:', logoutErr);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('customer_user');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('auth-change'));

      // Chuyển hướng về trang đăng nhập sau 1.5s
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      console.error('Change password error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      setPassError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setIsSavingPass(false);
    }
  };

  const getInitials = (name?: string, mail?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (mail) return mail.slice(0, 2).toUpperCase();
    return 'KH';
  };

  const formattedCreatedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 pb-12 animate-slide-up-fade">
      {/* ================= 1. CLEAN MINIMALIST HEADER (VERCEL / LINEAR STYLE) ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white text-2xl sm:text-3xl font-extrabold flex items-center justify-center shadow-md shadow-blue-600/15 border-2 border-white select-none">
              {getInitials(fullName, email)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-50" />
          </div>

          {/* Name & Contact Info */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {fullName || 'Chưa cập nhật họ tên'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đang hoạt động
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                {email || 'Chưa có email'}
              </span>
              {phone && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-700 tabular-nums font-medium">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {phone}
                  </span>
                </>
              )}
              {formattedCreatedDate && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tham gia từ {formattedCreatedDate}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Security badge pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          
        </div>
      </div>

      {/* ================= 2. TWO EQUAL-WIDTH CARDS SPANNING FULL SCREEN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD A: THÔNG TIN CÁ NHÂN */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông Tin Cá Nhân</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật họ và tên và số điện thoại liên lạc của bạn
                </p>
              </div>
            </div>

            {/* Thông báo lỗi / thành công thông tin */}
            {infoError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{infoError}</span>
              </div>
            )}
            {infoSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{infoSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Họ và tên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Email (Cố định) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Địa chỉ Email</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cố định theo tài khoản</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              form="profile-form"
              disabled={isSavingInfo}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSavingInfo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu thông tin...</span>
                </>
              ) : (
                <span>Lưu Thay Đổi Thông Tin</span>
              )}
            </button>
          </div>
        </div>

        {/* CARD B: BẢO MẬT & ĐỔI MẬT KHẨU */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bảo Mật &amp; Đổi Mật Khẩu</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đổi mật khẩu định kỳ để bảo vệ quyền truy cập vào ô kho
                </p>
              </div>
            </div>

            {/* Thông báo lỗi / thành công mật khẩu */}
            {passError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{passError}</span>
              </div>
            )}
            {passSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{passSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu đang dùng"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 6 ký tự (khác mật khẩu cũ)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              form="password-form"
              disabled={isSavingPass}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 active:scale-95 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSavingPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{passSuccess ? 'Đang chuyển về đăng nhập...' : 'Đang cập nhật...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Cập Nhật Mật Khẩu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
}
