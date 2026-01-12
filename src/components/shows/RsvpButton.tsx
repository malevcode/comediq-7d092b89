import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Users, Loader2 } from 'lucide-react';
import { useRsvpMutation, useUserRsvpForShow } from '@/hooks/useShowRsvp';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RsvpButtonProps {
  showId: string;
  showTitle: string;
  capacity?: number | null;
  rsvpCount?: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function RsvpButton({ 
  showId, 
  showTitle, 
  capacity, 
  rsvpCount = 0,
  variant = 'default',
  size = 'default',
  className = ''
}: RsvpButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partySize, setPartySize] = useState('1');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: existingRsvp, isLoading: isCheckingRsvp } = useUserRsvpForShow(showId);
  const { rsvpMutation, cancelMutation } = useRsvpMutation();

  const isAtCapacity = capacity && rsvpCount >= capacity;
  const hasRsvp = !!existingRsvp;

  const handleRsvpClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (hasRsvp) {
      // Cancel existing RSVP
      cancelMutation.mutate(existingRsvp.id);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleConfirmRsvp = () => {
    rsvpMutation.mutate(
      { showId, partySize: parseInt(partySize, 10) },
      { onSuccess: () => setIsModalOpen(false) }
    );
  };

  if (isCheckingRsvp) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (hasRsvp) {
    return (
      <Button 
        variant="outline" 
        size={size}
        onClick={handleRsvpClick}
        disabled={cancelMutation.isPending}
        className={`border-green-500 text-green-600 hover:bg-green-50 ${className}`}
      >
        {cancelMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        RSVP'd ({existingRsvp.party_size})
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant={variant}
        size={size}
        onClick={handleRsvpClick}
        disabled={isAtCapacity}
        className={className}
      >
        <Users className="w-4 h-4 mr-2" />
        {isAtCapacity ? 'Full' : 'RSVP (Free)'}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>RSVP for {showTitle}</DialogTitle>
            <DialogDescription>
              Reserve your free spot! How many people are coming?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Party Size</label>
            <Select value={partySize} onValueChange={setPartySize}>
              <SelectTrigger>
                <SelectValue placeholder="Select party size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Just me</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="3">3 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRsvp}
              disabled={rsvpMutation.isPending}
            >
              {rsvpMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm RSVP'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
