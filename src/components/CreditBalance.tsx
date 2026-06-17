import { Star, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriberBadge } from '@/components/SubscriberBadge';

const STRIPE_SUBSCRIBER_LINK = import.meta.env.VITE_STRIPE_SUBSCRIBER_LINK ?? '';

interface Props {
  compact?: boolean;
}

export function CreditBalance({ compact = false }: Props) {
  const { isSubscriber, user } = useAuth();
  if (!user) return null;

  if (compact) {
    return isSubscriber ? <SubscriberBadge /> : null;
  }

  if (isSubscriber) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          <p className="text-sm font-semibold text-gray-900">Subscriber</p>
        </div>
        <p className="text-xs text-gray-600">
          Mic fees waived at participating mics. Show this screen at the door.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Plan</p>
        <p className="text-sm font-semibold text-gray-900">Free</p>
      </div>
      <p className="text-xs text-gray-500">
        Subscribe to get your mic fees waived at participating mics.
      </p>
      {STRIPE_SUBSCRIBER_LINK && (
        <a
          href={STRIPE_SUBSCRIBER_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-medium bg-[#1a5fb4] hover:bg-[#1550a0] transition-colors"
        >
          Subscribe — $20/mo
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
