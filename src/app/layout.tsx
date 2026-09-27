import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SelfStorage | Cho Thuê Kho Tự Quản Thông Minh 24/7 TP.HCM",
  description: "Hệ thống cho thuê kho tự quản thông minh 24/7 tại TP.HCM. Kho máy lạnh 23-25°C, hút ẩm, camera giám sát AI và mở cửa Smart Key độc lập.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
