import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface TicketPurchaseButtonProps {
  showId: string;
  priceCents: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function TicketPurchaseButton({ 
  priceCents, 
  variant = 'default',
  size = 'default',
  className = ''
}: TicketPurchaseButtonProps) {
  const priceFormatted = `$${(priceCents / 100).toFixed(0)}`;

  const handleClick = () => {
    // Stripe integration coming soon
    toast.info('Ticket purchasing coming soon! For now, contact the venue directly.');
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <Ticket className="w-4 h-4 mr-2" />
      Buy Tickets ({priceFormatted})
    </Button>
  );
}
