"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, X, Send, Bot, Sparkles, ChevronRight, MessageCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface ChatAction {
  label: string;
  url: string;
  isWhatsApp?: boolean;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  actions?: ChatAction[];
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  '🛏️ Room rates & prices',
  '🔇 Why no restaurant?',
  '🍳 Shared guest kitchen',
  '📍 Hotel location & airport pickup',
  '📅 How to book direct?'
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Namaste & Welcome to Hotel Sherpa Soul! 🏔️\n\nI am your AI Concierge. I can assist you with room rates, direct reservations, our peaceful "No Restaurant" sleep promise, or Thamel directions.\n\nHow can I help you today?',
      actions: [
        { label: 'Check Room Rates', url: '/rooms' },
        { label: 'Instant Direct Booking', url: '/book' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
    trackEvent('chat_opened', { source: 'floating_widget' });
  };

  const handleClose = () => {
    setIsOpen(false);
    trackEvent('chat_closed', { message_count: messages.length });
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    trackEvent('chat_message_sent', { text: messageText.slice(0, 50) });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply,
        actions: data.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'I am experiencing a slight connection delay. You can reach owner Mr. Mingma Sherpa directly on WhatsApp for immediate assistance!',
        actions: [
          {
            label: 'Chat on WhatsApp',
            url: 'https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul',
            isWhatsApp: true
          }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {!hasInteracted && (
            <div
              onClick={handleOpen}
              className="cursor-pointer hidden sm:flex items-center gap-2 bg-slate-900/90 text-white text-xs py-2 px-3.5 rounded-full shadow-xl border border-slate-700/80 backdrop-blur-md hover:bg-slate-800 transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Ask Sherpa AI • 24/7</span>
            </div>
          )}

          <button
            onClick={handleOpen}
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-amber-500/30"
            aria-label="Open AI Chatbot Assistant"
          >
            <Bot className="w-7 h-7 group-hover:rotate-6 transition-transform" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </button>
        </div>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] h-[520px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 bg-white rounded-xl p-1 shadow-inner flex items-center justify-center">
                <Image
                  src="/images/logo-emblem.png"
                  alt="Hotel Sherpa Soul Emblem"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white leading-none">Sherpa Soul Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[11px] text-amber-400 font-medium">No Restaurant • Pure Sleep</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-thin">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Actions / CTA Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, i) => (
                        <Link
                          key={i}
                          href={act.url}
                          target={act.isWhatsApp ? '_blank' : '_self'}
                          rel={act.isWhatsApp ? 'noopener noreferrer' : undefined}
                          onClick={() => {
                            trackEvent('chat_cta_clicked', { label: act.label, url: act.url });
                            if (!act.isWhatsApp) setIsOpen(false);
                          }}
                          className={`inline-flex items-center gap-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all ${
                            act.isWhatsApp
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {act.isWhatsApp && <MessageCircle className="w-3 h-3" />}
                          <span>{act.label}</span>
                          {!act.isWhatsApp && <ChevronRight className="w-3 h-3 text-amber-700" />}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 w-16 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-[11px] text-slate-600 transition-colors border border-slate-200 shrink-0"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about rates, quiet rooms, Thamel..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-sm shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
