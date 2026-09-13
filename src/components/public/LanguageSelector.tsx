"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' }
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (options: any, elementId: string) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

interface LanguageSelectorProps {
  variant?: 'topbar' | 'navbar' | 'mobile';
  className?: string;
}

export default function LanguageSelector({ variant = 'topbar', className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(LANGUAGES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read cookie googtrans
    const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
    if (match) {
      const parts = decodeURIComponent(match[1]).split('/');
      const target = parts[parts.length - 1];
      const found = LANGUAGES.find(l => l.code === target);
      if (found) {
        setCurrentLang(found);
      }
    } else {
      const saved = localStorage.getItem('selected_language');
      if (saved) {
        const found = LANGUAGES.find(l => l.code === saved);
        if (found) setCurrentLang(found);
      }
    }

    // Load Google Translate script once
    if (!window.googleTranslateElementInit && !document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: LANGUAGES.map(l => l.code).join(','),
              autoDisplay: false
            },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Handle outside clicks to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (lang: Language) => {
    setCurrentLang(lang);
    setIsOpen(false);
    localStorage.setItem('selected_language', lang.code);

    if (lang.code === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      const hostParts = window.location.hostname.split('.');
      if (hostParts.length > 2) {
        const domain = '.' + hostParts.slice(-2).join('.');
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      }
      window.location.reload();
      return;
    }

    const cookieValue = `/en/${lang.code}`;
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;

    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 2) {
      const domain = '.' + hostParts.slice(-2).join('.');
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain};`;
    }

    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = lang.code;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <Globe className="w-3.5 h-3.5" />
          <span>Select Language / भाषा छान्नुहोस्</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
          {LANGUAGES.map(lang => {
            const isSelected = currentLang.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => selectLanguage(lang)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'hover:bg-white text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Topbar variant (compact dark theme)
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 rounded-full px-2.5 py-0.5 transition-all shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline font-medium">{currentLang.nativeName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Globe className="w-3 h-3 text-amber-600" />
            <span>Select Language</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
            {LANGUAGES.map(lang => {
              const isSelected = currentLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang)}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
