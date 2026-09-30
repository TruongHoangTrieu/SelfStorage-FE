import React from "react";
import Link from "next/link";
import { Phone, MapPin, Clock, ShieldCheck, Mail, Lock, Boxes, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 relative z-10">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600"></div>

      <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Brand info & Hotline */}
          <div className="space-y-4">
            <Link href="/" className="relative inline-flex items-center group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-indigo-500/20 to-sky-400/25 rounded-full blur-2xl -z-10 group-hover:opacity-100 opacity-75 transition-all"></div>
              <img
                src="/logo.png"
                alt="SelfStorage Logo"
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_4px_20px_rgba(59,130,246,0.4)] transition-transform group-hover:scale-105"
              />
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Hệ thống cho thuê và quản lý kho tự quản thông minh hàng đầu. Tự do ra vào 24/7 bằng mã Smart Key độc lập.
            </p>

            <div className="pt-2">
              <a
                href="tel:02877700117"
                className="text-lg font-black text-white hover:text-orange-400 transition flex items-center gap-2"
              >
                <Phone className="w-5 h-5 text-orange-400" />
                <span>028 7770 0117</span>
              </a>
              <p className="text-xs text-slate-500 mt-1">Hỗ trợ khách hàng 24/7</p>
            </div>
          </div>

          {/* Col 2: Dịch vụ kho */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Dịch Vụ Kho Tự Quản</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li><Link href="/locations" className="hover:text-white transition">Kho tự quản cá nhân &amp; mini</Link></li>
              <li><Link href="/locations" className="hover:text-white transition">Kho tự quản gia đình &amp; nội thất</Link></li>
              <li><Link href="/locations" className="hover:text-white transition">Kho máy lạnh 23-25°C hút ẩm</Link></li>
              <li><Link href="/locations" className="hover:text-white transition">Kho tự quản hàng hóa TMĐT B2B</Link></li>
              <li><Link href="/locations" className="hover:text-white transition">Tủ locker gửi hành lý 24/7</Link></li>
            </ul>
          </div>

          {/* Col 3: Hướng Dẫn & Quy Trình */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Quy Trình &amp; Hỗ Trợ</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li><Link href="/#how-it-works" className="hover:text-white transition">Hành trình thuê kho 6 bước</Link></li>
              <li><Link href="/#services" className="hover:text-white transition">Dịch vụ kho tự quản 24/7</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition">Câu hỏi thường gặp (FAQ)</Link></li>
              <li><Link href="/#contact" className="hover:text-white transition">Đăng ký tư vấn &amp; báo giá</Link></li>
            </ul>
          </div>

          {/* Col 4: Hệ thống cơ sở */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Hệ Thống Cơ Sở</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Chi nhánh kho tại các vị trí thuận tiện</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mở cửa tự do 24/7 qua Smart Key</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Camera AI giám sát đa tầng 24/7</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SelfStorage Việt Nam. Bản quyền đã được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <span>Bảo mật dữ liệu chuẩn ISO/IEC</span>
            <span>•</span>
            <span>Thanh toán VietQR SePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
