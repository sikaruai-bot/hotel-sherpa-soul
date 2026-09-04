import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hotel Sherpa Soul | PMS",
  description: "Property Management System and Channel Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6 ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
