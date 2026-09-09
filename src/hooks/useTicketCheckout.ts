import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { invokeSupabaseFunction } from '@/utils/supabaseFunctions';
import { AudienceShow } from '@/api/audienceShows';

/** True when Comediq itself can sell the ticket, rather than linking out. */
export const sellsTicketsInApp = (show: Pick<AudienceShow, 'is_paid' | 'price_cents'>) =>
  !!show.is_paid && !!show.price_cents && show.price_cents > 0;

export const outboundTicketUrl = (show: Pick<AudienceShow, 'ticket_url' | 'external_ticket_url'>) =>
  show.external_ticket_url || show.ticket_url || null;

export function useTicketCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingShowId, setLoadingShowId] = useState<string | null>(null);

  const buyTickets = async (show: AudienceShow, quantity = 1) => {
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent('/my-comedy')}`);
      return;
    }

    // Shows without in-app pricing still have somewhere to send people.
    if (!sellsTicketsInApp(show)) {
      const url = outboundTicketUrl(show);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      toast({ title: 'No tickets available', description: 'This show has no ticket link yet.' });
      return;
    }

    setLoadingShowId(show.id);

    const returnPath = '/my-comedy';
    const { data, error } = await invokeSupabaseFunction<{ url?: string }>('create-checkout-session', {
      body: {
        mode: 'ticket',
        showId: show.id,
        quantity,
        returnPath,
        returnUrl: `${window.location.origin}${returnPath}`,
      },
    });

    setLoadingShowId(null);

    if (error || !data?.url) {
      toast({
        title: 'Checkout unavailable',
        description: error instanceof Error ? error.message : 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    window.location.assign(data.url);
  };

  return { buyTickets, loadingShowId };
}
