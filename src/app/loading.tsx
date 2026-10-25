'use client';

import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Background ambient glow - subtle and organic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-600/15 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Brand Icon with smooth layered animation */}
        <div className="relative mb-8">
          {/* Subtle outer breathing ring */}
          <div className="absolute -inset-2.5 rounded-3xl bg-indigo-500/20 blur-md animate-pulse" style={{ animationDuration: '3s' }} />
          
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl flex items-center justify-center">
            {/* Minimalist Smart Storage Lock / Cube Icon (SVG) */}
            <svg
              className="w-8 h-8 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Storage Unit Door with Smart Lock */}
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" />
              <path d="M3 9h18" stroke="currentColor" strokeOpacity="0.5" />
              <path d="M3 15h18" stroke="currentColor" strokeOpacity="0.5" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <line x1="12" y1="14" x2="12" y2="15" />
            </svg>

            {/* Micro active status indicator */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900" />
            </span>
          </div>
        </div>

        {/* Brand Title & Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>SelfStorage Cloud OS</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Đang tải dữ liệu hệ thống
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Đồng bộ hóa phiên làm việc, trạng thái kho và đối soát dữ liệu an toàn theo thời gian thực...
          </p>
        </div>

        {/* Minimalist Progress Track */}
        <div className="w-48 h-1 bg-slate-800/80 rounded-full mt-6 overflow-hidden relative border border-slate-700/40">
          <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-indigo-500 to-indigo-400 w-24 rounded-full animate-[shimmer_1.6s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}
