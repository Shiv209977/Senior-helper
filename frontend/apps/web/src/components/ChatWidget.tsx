'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Send, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { sendChatMessage, getChatHistory } from '@/lib/api/chat';
import type { ChatMessage as ChatMsg } from '@/lib/api/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const EMERGENCY_BANNER_THRESHOLD = 8;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-lavender [animation-delay:0ms]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-lavender [animation-delay:150ms]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-lavender [animation-delay:300ms]" />
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [lastConcern, setLastConcern] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // patientId is only defined for patients; widget is hidden for other roles below
  const patientId = user?.role === 'patient' ? user.id : undefined;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const handleOpenChange = useCallback(
    async (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen && messages.length === 0) {
        setInitialLoading(true);
        try {
          const history = await getChatHistory(patientId);
          setMessages(history);
        } catch {
          // silent — will show empty state
        } finally {
          setInitialLoading(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    },
    [patientId, messages.length],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // All hooks are above — safe to bail out now
  if (!user || user.role !== 'patient') return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Optimistic user bubble
    const optimistic: ChatMsg = {
      id: Date.now(),
      patient: user.id,
      sender: user.id,
      role: 'user',
      content: text,
      concern_level: null,
      unstructured_notes: '',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await sendChatMessage(text, patientId);
      const assistant: ChatMsg = {
        id: Date.now() + 1,
        patient: user.id,
        sender: user.id,
        role: 'assistant',
        content: res.response,
        concern_level: res.concern_level,
        unstructured_notes: res.unstructured_notes,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistant]);
      setLastConcern(res.concern_level);
    } catch (err: any) {
      const errorMsg: ChatMsg = {
        id: Date.now() + 1,
        patient: user.id,
        sender: user.id,
        role: 'assistant',
        content: 'Sorry, I could not process your message. Please try again.',
        concern_level: null,
        unstructured_notes: '',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* Trigger button — positioned above SOS button */}
      <button
        onClick={() => handleOpenChange(true)}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2.5 rounded-full bg-teal px-5 py-3.5 text-[15px] font-bold text-white shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
        aria-label="Open health chat"
      >
        <MessageCircle className="h-5 w-5" /> Chat
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={true}
          className="flex w-full flex-col p-0 sm:max-w-[380px]"
        >
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-ink">
              <MessageCircle className="h-5 w-5 text-teal" />
              Health Chat
            </SheetTitle>
          </SheetHeader>

          {/* Emergency banner */}
          {lastConcern !== null && lastConcern >= EMERGENCY_BANNER_THRESHOLD && (
            <div className="flex items-center gap-2 border-b border-coral/20 bg-coral-soft px-5 py-3 text-[14px] font-medium text-coral">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              High concern detected. If this is urgent, please also alert your care team or call 112.
            </div>
          )}

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {initialLoading && (
              <p className="py-8 text-center text-[15px] text-muted-foreground">Loading chat…</p>
            )}
            {!initialLoading && messages.length === 0 && (
              <div className="py-12 text-center">
                <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-teal-soft">
                  <MessageCircle className="h-6 w-6 text-teal" />
                </span>
                <p className="text-[15px] text-ink">How are you feeling today?</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Type a message to start chatting about your health.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-soft ${
                    msg.role === 'user'
                      ? 'bg-teal-soft text-ink'
                      : 'bg-lavender-soft text-ink'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-lavender-soft shadow-soft">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border px-5 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                disabled={isLoading}
                className="flex-1 rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[15px] text-ink transition-colors placeholder:text-muted-foreground/55 focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal text-white transition-colors hover:bg-teal-deep disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
