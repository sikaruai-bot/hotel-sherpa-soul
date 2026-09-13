import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If user is accessing /admin/login, don't enforce redirect
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {user && <AdminSidebar user={user} />}
      <div className={`flex-1 flex flex-col min-w-0 ${user ? 'lg:pl-64' : ''}`}>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
