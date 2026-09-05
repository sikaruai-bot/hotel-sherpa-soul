import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PmsProvider } from "@/context/PmsContext";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hotel Sherpa Soul | PMS & Channel Manager",
  description: "Cloud-Based Hotel Property Management System, Reservation Engine & Shared Kitchen Manager - Thamel, Kathmandu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 antialiased`}>
        <AuthProvider>
          <PmsProvider>
            <AppShell>{children}</AppShell>
          </PmsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
