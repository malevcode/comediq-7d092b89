import { Zap, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getValidStripePaymentLink } from '@/utils/stripeLinks';

const STRIPE_PAID_LINK = getValidStripePaymentLink(import.meta.env.VITE_STRIPE_PAID_LINK);

interface Props {
  compact?: boolean;
}

const planLabel: Record<string, string> = {
  free:     'Free',
  standard: 'Standard',
  premium:  'Premium',
};

export function CreditBalance({ compact = false }: Props) {
  const { creditsBalance, subscriptionPlan, user } = useAuth();
  if (!user) return null;

  const upgradeUrl = subscriptionPlan === 'premium' ? null : STRIPE_PAID_LINK;

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
      {subscriptionPlan === 'standard' && (
        <p className="text-xs text-gray-500">
          Upgrade to Full Pass for the complete monthly comedy subscription.
        </p>
      )}

      {upgradeUrl && (
        <a
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-medium bg-[#1a5fb4] hover:bg-[#1550a0] transition-colors"
        >
          Subscribe to Full Pass
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
