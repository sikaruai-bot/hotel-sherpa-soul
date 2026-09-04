import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PmsProvider } from "@/context/PmsContext";

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
        <PmsProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
              <Header />
              <main className="flex-1 p-4 md:p-6 ml-64 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </PmsProvider>
      </body>
    </html>
  );
}
