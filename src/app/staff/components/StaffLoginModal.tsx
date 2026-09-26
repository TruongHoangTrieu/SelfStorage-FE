'use client';

import React, { useState } from 'react';
import { LogIn, Key, Mail, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { handoversApi } from '../../../lib/api/handovers';
import { StaffUser } from '../types';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: StaffUser) => void;
}

export default function StaffLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: StaffLoginModalProps) {
  const [email, setEmail] = useState('staff@selfstorage.com');
  const [password, setPassword] = useState('Staff@123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await handoversApi.loginStaff(email, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin hoặc kết nối Backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-slide-up-fade overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4f39f6]/10 text-[#4f39f6] flex items-center justify-center font-bold">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Đăng Nhập Cổng Vận Hành (Staff JWT)
              </h3>
              <p className="text-xs text-slate-500">Kết nối NestJS Backend API thật</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email nhân viên:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@selfstorage.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mật khẩu:
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4f39f6] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick 1-Click Credentials */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
              Tài khoản mẫu từ Backend (Click để điền nhanh):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('staff@selfstorage.com', 'Staff@123456')}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4f39f6] font-semibold border border-indigo-200 text-left transition-colors"
              >
                Nhân viên (Staff Q1)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@selfstorage.com', 'Manager@123456')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 text-left transition-colors"
              >
                Quản lý (Manager Q1)
              </button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#4f39f6] hover:bg-[#432fe0] rounded-xl shadow-md shadow-[#4f39f6]/25 transition-all disabled:opacity-70"
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
