import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SelfStorage | Cho Thuê Kho Tự Quản Thông Minh 24/7 TP.HCM",
  description: "Hệ thống cho thuê kho tự quản thông minh 24/7 tại TP.HCM. Kho máy lạnh 23-25°C, hút ẩm, camera giám sát AI và mở cửa Smart Key độc lập.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
