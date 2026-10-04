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
  Building2,
  Calendar,
  BadgeCheck,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { StaffUser } from '../types';

interface StaffProfileViewProps {
  currentUser: StaffUser | null;
  onUserUpdated: (updatedUser: StaffUser) => void;
  onLogout?: () => void;
}

export default function StaffProfileView({
  currentUser,
  onUserUpdated,
  onLogout,
}: StaffProfileViewProps) {
  const router = useRouter();

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
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

          const mappedUser: StaffUser = {
            id: res.id,
            email: res.email,
            fullName: res.fullName,
            role: typeof res.role === 'object' ? res.role?.name : res.role,
            phone: res.phone,
            facilityId: res.facilityId,
            facilityName: res.facilityName || res.facility?.name || currentUser?.facilityName,
          };
          onUserUpdated(mappedUser);
        }
      } catch (err) {
        console.warn('Could not fetch fresh staff profile:', err);
      }
    };
    fetchFreshProfile();
  }, []);

  // Sync state if prop changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Handle Save Profile Information (PATCH /auth/profile)
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
      const res = await api.patch<any>('/auth/profile', {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      const updatedName = res?.fullName || fullName.trim();
      const updatedPhone = res?.phone ?? phone.trim();

      setInfoSuccess('Cập nhật thông tin nhân viên thành công!');
      toast.success('Đã lưu thông tin tài khoản nhân viên');

      // Update in localStorage
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const userObj = JSON.parse(raw);
          const newUserObj = { ...userObj, fullName: updatedName, phone: updatedPhone };
          localStorage.setItem('user', JSON.stringify(newUserObj));
          window.dispatchEvent(new Event('auth-change'));
          window.dispatchEvent(new Event('storage'));
        }
      } catch {
        // ignore
      }

      if (currentUser) {
        onUserUpdated({
          ...currentUser,
          fullName: updatedName,
          phone: updatedPhone,
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.';
      setInfoError(msg);
      toast.error(msg);
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Handle Change Password (PATCH /auth/change-password)
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
    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp với mật khẩu mới');
      return;
    }

    setIsSavingPass(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPassSuccess('Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới cho các phiên làm việc tiếp theo.');
      toast.success('Mật khẩu đã được thay đổi thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      setPassError(msg);
      toast.error(msg);
    } finally {
      setIsSavingPass(false);
    }
  };

  const roleName = (currentUser?.role || 'OPERATIONS_STAFF').toUpperCase();
  const roleDisplay =
    roleName === 'FACILITY_MANAGER'
      ? 'Quản Lý Chi Nhánh'
      : roleName === 'SYSTEM_ADMINISTRATOR' || roleName === 'ADMIN'
      ? 'Quản Trị Viên Hệ Thống'
      : roleName === 'BUSINESS_OPERATIONS_MANAGER'
      ? 'Quản Lý Kinh Doanh Toàn Chuỗi'
      : 'Nhân Viên Vận Hành Kho';

  const rawFacilityDisplay =
    currentUser?.assignedFacility?.name ||
    currentUser?.facilityName ||
    'Trụ Sở Chính Võ Nguyên Giáp';
  const facilityDisplay = rawFacilityDisplay.replace(/^Kho\s+Tự\s+Quản\s+/i, '').trim();

  const getInitials = (name?: string, em?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (em) return em.slice(0, 2).toUpperCase();
    return 'NV';
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 pb-12 animate-slide-up-fade">
      {/* ================= 1. CLEAN MINIMALIST HEADER (MATCHING DASHBOARD PROFILE) ================= */}
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
                {fullName || 'Nhân Viên Vận Hành'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                {roleDisplay}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                {email || 'staff@selfstorage.vn'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {facilityDisplay}
              </span>
              {createdAt && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tham gia từ {new Date(createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ================= 2. TWO EQUAL-WIDTH CARDS SPANNING FULL SCREEN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD A: THÔNG TIN NHÂN SỰ */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông Tin Nhân Sự</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật họ tên và số điện thoại công tác của bạn
                </p>
              </div>
            </div>

            {/* Thông báo lỗi / thành công */}
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
            <form id="staff-profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Họ và tên nhân viên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Vận Hành"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-sm text-slate-800 transition outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Email đăng nhập hệ thống</span>
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
                <p className="text-[11px] text-slate-400 mt-1">
                  Email nội bộ do Quản trị viên cấp. Liên hệ quản lý cơ sở nếu cần đổi email.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Vai trò vận hành:</span>
                  <span className="font-bold text-blue-700">{roleDisplay}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Cơ sở trực thuộc:</span>
                  <span className="font-bold text-slate-900">{facilityDisplay}</span>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              form="staff-profile-form"
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

        {/* CARD B: BẢO MẬT & ĐỔI MẬT KHẨU NHÂN VIÊN */}
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
                  Tăng cường an toàn khi đăng nhập cổng bàn giao cơ sở
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
            <form id="staff-password-form" onSubmit={handleChangePassword} className="space-y-4">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
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
              form="staff-password-form"
              disabled={isSavingPass}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 active:scale-95 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSavingPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
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

      {/* Phiên làm việc & Đăng xuất */}
      {onLogout && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Phiên Làm Việc Hiện Tại</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Đăng xuất khỏi cổng nhân viên trên thiết bị này và chuyển hướng về trang chủ.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Khỏi Hệ Thống</span>
          </button>
        </div>
      )}
    </div>
  );
}
