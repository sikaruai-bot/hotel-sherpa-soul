"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { trackEvent } from '@/lib/analytics';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1952950858737501';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Capture UTM parameters & trigger page view on route change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Capture UTM params into sessionStorage
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      utmKeys.forEach(k => {
        const val = searchParams?.get(k);
        if (val) {
          sessionStorage.setItem(`hss_${k}`, val);
        }
      });

      // 2. Track page_view
      trackEvent('page_view', {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  return (
    <>
      {/* Google Analytics 4 Script */}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager Script */}
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      )}

      {/* Meta Pixel Script */}
      {PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Meta Pixel NoScript Fallback */}
      {PIXEL_ID && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      )}
    </>
  );
}
