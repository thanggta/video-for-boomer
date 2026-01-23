import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GhepVideo - Ghép Âm Thanh Vào Video",
  description: "Ứng dụng giúp bạn thay đổi âm thanh trong video một cách dễ dàng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
