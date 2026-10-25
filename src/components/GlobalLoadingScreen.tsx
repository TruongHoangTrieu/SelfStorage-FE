'use client';

import React from 'react';

interface GlobalLoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export default function GlobalLoadingScreen({
  message = 'Đang tải dữ liệu hệ thống...',
  subMessage = 'Vui lòng đợi trong giây lát trong khi chúng tôi đồng bộ hóa thông tin.',
  fullScreen = true,
}: GlobalLoadingScreenProps) {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-50' : 'w-full py-16'
      } flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white animate-in fade-in duration-200 select-none`}
    >
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Minimalist Smart Storage Lock / Cube Icon */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-2xl bg-indigo-500/20 blur-md animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center text-indigo-400">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" />
              <path d="M3 9h18" stroke="currentColor" strokeOpacity="0.4" />
              <path d="M3 15h18" stroke="currentColor" strokeOpacity="0.4" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <line x1="12" y1="14" x2="12" y2="15" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold tracking-tight text-white">{message}</h3>
          {subMessage && (
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{subMessage}</p>
          )}
        </div>

        {/* Shimmer Bar */}
        <div className="w-40 h-1 bg-slate-800 rounded-full mt-5 overflow-hidden relative border border-slate-700/50">
          <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-indigo-500 to-indigo-400 w-20 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}
