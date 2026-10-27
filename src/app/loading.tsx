'use client';

import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed top-0 inset-x-0 z-[9999] pointer-events-none">
      {/* Sleek top transition progress bar */}
      <div className="h-1 w-full bg-slate-100/60 overflow-hidden backdrop-blur-xs">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 animate-[shimmer_1.2s_infinite_linear] w-full origin-left shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
      </div>
    </div>
  );
}
