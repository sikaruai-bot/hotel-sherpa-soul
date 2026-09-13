declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (typeof window === 'undefined') return;

  // 1. Google Analytics 4 (gtag)
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, params);
    } catch (e) {
      console.error('GA4 track error:', e);
    }
  }

  // 2. Google Tag Manager (dataLayer)
  if (Array.isArray(window.dataLayer)) {
    try {
      window.dataLayer.push({
        event: eventName,
        ...params,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('GTM track error:', e);
    }
  }

  // 3. Meta Pixel (fbq)
  if (typeof window.fbq === 'function') {
    try {
      // Map to standard Facebook Pixel events where applicable
      if (eventName === 'page_view') {
        window.fbq('track', 'PageView');
      } else if (eventName === 'view_room') {
        window.fbq('track', 'ViewContent', {
          content_name: params.room_type,
          value: params.price_usd,
          currency: 'USD',
        });
      } else if (eventName === 'check_availability') {
        window.fbq('track', 'Search', {
          checkin_date: params.check_in,
          checkout_date: params.check_out,
          num_adults: params.adults,
          num_children: params.children,
        });
      } else if (eventName === 'begin_booking') {
        window.fbq('track', 'InitiateCheckout', {
          content_name: params.room_type,
          value: params.booking_value,
          currency: 'USD',
        });
      } else if (eventName === 'booking_submit') {
        window.fbq('track', 'Lead', {
          content_name: params.room_type,
          value: params.booking_value,
          currency: 'USD',
        });
      } else if (eventName === 'booking_confirmed') {
        window.fbq('track', 'Purchase', {
          content_name: params.room_type,
          value: params.booking_value,
          currency: 'USD',
        });
      } else if (eventName === 'whatsapp_click' || eventName === 'phone_click' || eventName === 'email_click') {
        window.fbq('track', 'Contact');
      } else {
        window.fbq('trackCustom', eventName, params);
      }
    } catch (e) {
      console.error('Meta Pixel track error:', e);
    }
  }
}
