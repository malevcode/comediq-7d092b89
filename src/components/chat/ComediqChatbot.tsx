import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MessageCircle, X, Send, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useComediqChat } from '@/hooks/useComediqChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const SUGGESTIONS = [
  'Free mics in Brooklyn tonight?',
  'What time is the Greenpoint mic?',
  'Report a mic time change',
];

export function ComediqChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { messages, isLoading, usage, error, sendMessage } = useComediqChat();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput('');
    await sendMessage(msg);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSuggestion(suggestion: string) {
    await sendMessage(suggestion);
  }

  const isLimitReached = usage?.tokens_remaining === 0;
  const usagePct = usage
    ? Math.min(100, ((usage.daily_limit - usage.tokens_remaining) / usage.daily_limit) * 100)
    : 0;

  return (
    <div className="fixed bottom-20 right-3 z-40 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-background border rounded-2xl shadow-2xl w-[340px] sm:w-[380px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Comediq AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Token usage bar — shown after first exchange */}
          {usage && (
            <div className="px-4 pt-2 pb-1 border-b bg-muted/20 shrink-0">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Daily usage</span>
                <span>{usage.tokens_remaining.toLocaleString()} tokens left</span>
              </div>
              <Progress value={usagePct} className="h-1" />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px]">
            {!user ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mb-2 opacity-25" />
                <p className="text-sm font-medium">Sign in to use Comediq AI</p>
                <p className="text-xs mt-1 mb-3">Ask about mics, report changes, and more</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Sign in</Link>
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Ask me anything about open mics, or report a change you heard about.
                </p>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-foreground"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-center">
                    {error}
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t bg-background shrink-0">
            {!user ? null : isLimitReached ? (
              <p className="text-xs text-center text-muted-foreground py-1">
                Daily limit reached. Come back tomorrow!
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about open mics..."
                  className="flex-1 text-sm h-9"
                  disabled={isLoading}
                  maxLength={500}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open Comediq AI'}
      >
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </Button>
    </div>
  );
}
