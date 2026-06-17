import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

export function SubscriberBadge({ className }: { className?: string }) {
  return (
    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-300 ${className ?? ''}`}>
      <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-500 text-amber-500" />
      Subscriber
    </Badge>
  );
}
