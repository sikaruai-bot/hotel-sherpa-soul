import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Send } from 'lucide-react';
import ContactForm from '@/components/public/ContactForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Hotel Sherpa Soul Thamel Kathmandu',
  description: 'Get in touch with Hotel Sherpa Soul in Thamel, Kathmandu. Contact owner Mingma Sherpa via WhatsApp (+977 9851068219), phone, or online inquiry form.',
  alternates: { canonical: 'https://hotelsherpasoul.com/contact' },
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          We Are Here To Help
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Contact Hotel Sherpa Soul
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Have questions about room availability, long stays with shared kitchen access, or trekking luggage storage? Reach out to us anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Direct Channels</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Location</span>
                  <span>Thamel, Kathmandu, Nepal</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Phone</span>
                  <a href="tel:+9779851068219" className="text-blue-600 hover:underline block">
                    +977 9851068219 (Mobile)
                  </a>
                  <a href="tel:+97714530311" className="text-slate-600 hover:underline block text-sm">
                    +977-1 4530311 (Landline)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">WhatsApp</span>
                  <a
                    href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    +977 9851068219
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Email</span>
                  <a href="mailto:info@hotelsherpasoul.com" className="text-sky-600 hover:underline">
                    info@hotelsherpasoul.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Facebook</span>
                  <a
                    href="https://www.facebook.com/Sherpasoul/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    facebook.com/Sherpasoul
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-2 text-xs text-amber-900">
            <h4 className="font-bold text-sm">Check-in & Hours</h4>
            <p><strong>Standard Check-in:</strong> 14:00 PM</p>
            <p><strong>Standard Check-out:</strong> 12:00 PM</p>
            <p>Front desk operates 24/7. Early check-in or late luggage drop can be arranged with advance notice.</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Send Us an Inquiry</h2>
            <p className="text-xs text-slate-500 mb-6">Fill in your inquiry below and we will respond promptly.</p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
