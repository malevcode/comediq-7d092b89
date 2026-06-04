import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatUsage {
  tokens_remaining: number;
  daily_limit: number;
}

export function useComediqChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error: fnError } = await supabase.functions.invoke<{
        reply: string;
        tokens_used: number;
        tokens_remaining: number;
        daily_limit: number;
        change_submitted?: boolean;
        error?: string;
      }>('comediq-chat', {
        body: { message: content.trim(), history },
      });

      if (fnError) {
        // FunctionsHttpError carries the response; try to read the body
        let errMsg = 'Something went wrong. Please try again.';
        try {
          const body = await (fnError as { context?: Response }).context?.json?.() as { error?: string; tokens_remaining?: number; daily_limit?: number } | undefined;
          if (body?.error) errMsg = body.error;
          if (body?.tokens_remaining === 0) {
            setUsage({ tokens_remaining: 0, daily_limit: body.daily_limit ?? 10000 });
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errMsg);
      }

      if (!data || data.error) {
        throw new Error(data?.error ?? 'No response from AI');
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setUsage({ tokens_remaining: data.tokens_remaining, daily_limit: data.daily_limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, usage, error, sendMessage, clearMessages };
}
