import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "CodeBridge — 비개발자를 위한 코딩 입문",
  description:
    "코드를 몰라도 괜찮습니다. CodeBridge는 비개발자가 AI 도구로 실제 서비스를 만들 수 있도록 돕는 인터랙티브 학습 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} antialiased`}
        style={{ backgroundColor: "var(--terminal-bg)" }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
