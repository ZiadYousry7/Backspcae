import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Mafaza PMS – Project Management System",
  description: "Comprehensive project management tracking for Mafaza F&B Company",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <style>{`
          :root { --font-arabic: 'Cairo', 'Segoe UI', Tahoma, sans-serif; }
          [lang="ar"] body { font-family: var(--font-arabic); }
        `}</style>
      </head>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
