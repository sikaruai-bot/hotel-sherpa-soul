"use client";

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeImageProps {
  data: string;
  size?: number;
  className?: string;
  color?: {
    dark?: string;
    light?: string;
  };
  alt?: string;
}

export default function QrCodeImage({
  data,
  size = 256,
  className = '',
  color = { dark: '#0f172a', light: '#ffffff' },
  alt = 'QR Code',
}: QrCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!data) return;

    QRCode.toDataURL(data, {
      width: size * 2, // 2x for retina crispness
      margin: 1,
      color: {
        dark: color.dark || '#0f172a',
        light: color.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate local QR code:', err);
        if (isMounted) {
          // Fallback to online QR API if client generation fails for any rare reason
          const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
            data
          )}&color=${(color.dark || '0f172a').replace('#', '')}&bgcolor=${(color.light || 'ffffff').replace('#', '')}&margin=1`;
          setDataUrl(fallbackUrl);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [data, size, color.dark, color.light]);

  if (!dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`flex items-center justify-center bg-slate-100 rounded-xl animate-pulse text-slate-400 text-xs ${className}`}
      >
        <span>Loading QR...</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain select-none ${className}`}
      onError={() => setError(true)}
    />
  );
}
