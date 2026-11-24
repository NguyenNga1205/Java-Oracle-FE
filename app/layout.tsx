import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/app/auth";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-face",
});
const mono = JetBrains_Mono({
  subsets: ["vietnamese", "latin"],
  variable: "--font-mono-face",
});

export const metadata: Metadata = {
  title: "UniVerse · Quản lý sinh viên",
  description: "Hệ thống quản lý sinh viên, giảng viên, lớp học và lịch giảng dạy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`dark ${sans.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
