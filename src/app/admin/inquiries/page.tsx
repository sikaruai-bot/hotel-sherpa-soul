import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Mail, Phone, Clock, CheckCircle2 } from 'lucide-react';

export const revalidate = 0;

export default async function AdminInquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Guest Inquiries & Messages</h1>
        <p className="text-xs text-slate-500">
          Direct messages and inquiries received via the website contact form.
        </p>
      </div>

      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
            No inquiries received yet.
          </div>
        ) : (
          inquiries.map(inq => (
            <div key={inq.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{inq.name}</h3>
                  <span className="text-xs text-slate-500">{inq.subject || 'General Inquiry'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">
                    {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    inq.status === 'NEW' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {inq.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {inq.message}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                <a href={`mailto:${inq.email}`} className="text-sky-600 hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{inq.email}</span>
                </a>
                {inq.phone && (
                  <a href={`tel:${inq.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{inq.phone}</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
