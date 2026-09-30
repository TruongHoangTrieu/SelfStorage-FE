import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SelfStorage | Thuê Kho Lưu Trữ Tự Phục Vụ",
  description: "Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ",
  icons: {
    icon: "/logo-web.png",
    shortcut: "/logo-web.png",
    apple: "/logo-web.png",
  },
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
