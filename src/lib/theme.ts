/**
 * SelfStorage Shared Design System & Color Tokens
 * Bộ quy chuẩn màu sắc và kiểu giao diện dùng chung cho toàn bộ website (Landing Page, /locations, v.v.)
 */

export const THEME = {
  // Mã màu HEX
  colors: {
    primary: {
      orange: "#f97316", // Tailwind orange-500
      amber: "#f59e0b",  // Tailwind amber-500
      yellow: "#facc15", // Tailwind yellow-400
    },
    accent: {
      blue: "#2563eb",   // Tailwind blue-600
      indigo: "#4f46e5", // Tailwind indigo-600
      sky: "#0284c7",    // Tailwind sky-600
    },
    status: {
      activeBg: "#ecfdf5",   // emerald-50
      activeText: "#047857", // emerald-700
      activeDot: "#10b981",  // emerald-500
      warningBg: "#fffbeb",  // amber-50
      warningText: "#b45309",// amber-700
      dangerBg: "#fef2f2",   // rose-50
      dangerText: "#b91c1c", // rose-700
    },
    dark: {
      bg: "#0f172a",         // slate-900
      navBg: "#020617",      // slate-950
      blueDeep: "#172554",   // blue-950
    },
  },

  // Bộ class CSS Tailwind chuẩn hóa để dùng nhất quán giữa các trang
  classes: {
    // Nền & Toàn trang
    pageWrapper: "min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white",

    // Hero Section
    heroBg: "bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white",
    heroHeadingGradient: "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400",
    heroGlow: "bg-blue-500/20 rounded-full blur-[180px]",
    heroSpecPill: "flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur text-xs sm:text-sm",

    // Nút bấm chuẩn thương hiệu (Buttons)
    btnPrimary: "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 transition-all text-center uppercase tracking-wider whitespace-nowrap",
    btnSecondary: "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm sm:text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur transition-all text-center whitespace-nowrap",
    btnActionDark: "inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-blue-600 transition-colors shadow-sm",
    btnActionOrange: "inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5",

    // Thẻ & Card
    card: "bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300",
    cardFeatured: "p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all",

    // Huy hiệu & Trạng thái (Badges)
    badgeSection: "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2",
    badgeSectionDot: "w-2 h-2 rounded-full bg-orange-500",
    badgeActive: "px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700",
    badgeCode: "px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs",

    // Dải trang trí đa sắc đặc trưng (Signature Gradient Stripe)
    brandStripe: "h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600",
  }
};

export default THEME;
