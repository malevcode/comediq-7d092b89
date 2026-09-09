import { Button } from '@/components/ui/button';
import { Loader2, Ticket } from 'lucide-react';
import { useTicketCheckout } from '@/hooks/useTicketCheckout';
import { AudienceShow } from '@/api/audienceShows';

interface TicketPurchaseButtonProps {
  show: AudienceShow;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function TicketPurchaseButton({
  show,
  variant = 'default',
  size = 'default',
  className = '',
}: TicketPurchaseButtonProps) {
  const { buyTickets, loadingShowId } = useTicketCheckout();
  const isLoading = loadingShowId === show.id;
  const priceFormatted = show.price_cents ? `$${(show.price_cents / 100).toFixed(0)}` : '';

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading}
      onClick={() => buyTickets(show)}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Ticket className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Starting checkout...' : `Buy Tickets${priceFormatted ? ` (${priceFormatted})` : ''}`}
    </Button>
  );
}
