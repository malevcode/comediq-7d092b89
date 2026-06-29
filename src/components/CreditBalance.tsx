import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { invokeSupabaseFunction } from '@/utils/supabaseFunctions';

interface Props {
  compact?: boolean;
}

const planLabel: Record<string, string> = {
  free:     'Free',
  premium:  'Full Pass',
};

export function CreditBalance({ compact = false }: Props) {
  const { creditsBalance, subscriptionPlan, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  if (!user) return null;

  const isSubscriber = subscriptionPlan !== 'free';
  const returnPath = `${location.pathname}${location.search}`;
  const upgradePath = `/auth?next=${encodeURIComponent(returnPath)}&plans=true`;

  const getFunctionErrorMessage = async (error: unknown, data: unknown) => {
    if (data && typeof data === 'object' && 'error' in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === 'string') return message;
    }

    if (error && typeof error === 'object' && 'context' in error) {
      const context = (error as { context?: unknown }).context;
      if (context && typeof context === 'object' && 'json' in context && typeof context.json === 'function') {
        try {
          const response = context as Response;
          const body = await response.clone().json();
          if (body && typeof body.error === 'string') return body.error;
        } catch {
          // Fall through to text parsing below.
        }
      }

      if (context && typeof context === 'object' && 'text' in context && typeof context.text === 'function') {
        try {
          const response = context as Response;
          const text = await response.clone().text();
          if (text) return text;
        } catch {
          // Fall through to generic error parsing below.
        }
      }
    }

    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }

    return 'Please try again or contact support.';
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    const portalReturnPath = '/profile?billing=portal';
    const { data, error } = await invokeSupabaseFunction<{ url?: string }>('create-billing-portal-session', {
      body: {
        returnPath: portalReturnPath,
        returnUrl: `${window.location.origin}${portalReturnPath}`,
      },
    });
    setIsOpeningPortal(false);

    if (error || !data?.url) {
      const description = await getFunctionErrorMessage(error, data);
      toast({
        title: 'Could not open billing portal',
        description,
        variant: 'destructive',
      });
      return;
    }

    window.location.assign(data.url);
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
        {creditsBalance}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Plan</p>
          <p className="text-sm font-semibold text-gray-900">{planLabel[subscriptionPlan] ?? subscriptionPlan}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Credits</p>
          <p className="text-2xl font-bold text-gray-900 flex items-center gap-1 justify-end">
            <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            {creditsBalance}
          </p>
        </div>
      </div>

      {subscriptionPlan === 'free' && (
        <p className="text-xs text-gray-500">
          Full Pass unlocks monthly Comediq open mic access and subscriber benefits.
        </p>
      )}
      {!isSubscriber && (
        <Link
          to={upgradePath}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-medium bg-[#1a5fb4] hover:bg-[#1550a0] transition-colors"
        >
          Subscribe to Full Pass
        </Link>
      )}

      {isSubscriber && (
        <button
          type="button"
          onClick={handleManageSubscription}
          disabled={isOpeningPortal}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Settings className="w-3.5 h-3.5" />
          {isOpeningPortal ? 'Opening billing...' : 'Manage Subscription'}
        </button>
      )}
    </div>
  );
}
