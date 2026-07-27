import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { signUpForEvent, guestSignUpForEvent } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Zap, ExternalLink } from 'lucide-react';
import { getValidStripePaymentLink } from '@/utils/stripeLinks';

const STRIPE_PAID_LINK = getValidStripePaymentLink(import.meta.env.VITE_STRIPE_PAID_LINK);

interface SignupButtonProps {
  eventId: string;
  isFull: boolean;
}

export function SignupButton({ eventId, isFull }: SignupButtonProps) {
  const [notes, setNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [open, setOpen] = useState(false);
  const { user, creditsBalance, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const noCredits = !!user && creditsBalance < 1;

  const signupMutation = useMutation({
    mutationFn: async () => {
      // Deduct 1 credit atomically before signup
      if (user) {
        const { data: ok } = await (supabase as any).rpc('spend_credit', {
          p_user_id: user.id,
          p_reference: eventId,
        });
        if (!ok) throw new Error('no_credits');
      }
      return signUpForEvent(eventId, notes);
    },
    onSuccess: () => {
      toast({ title: 'Signed up!', description: "You're on the list!" });
      queryClient.invalidateQueries({ queryKey: ['eventSignups', eventId] });
      queryClient.invalidateQueries({ queryKey: ['allSignupEvents'] });
      refreshProfile();
      setOpen(false);
      setNotes('');
    },
    onError: (error: any) => {
      if (error.message === 'no_credits') return; // handled by noCredits UI
      // Refund credit if signup failed after deduction
      if (user) {
        (supabase as any).rpc('admin_add_credits', {
          p_user_id: user.id, p_delta: 1, p_reason: 'refund', p_reference: eventId,
        }).then(() => refreshProfile());
      }
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const guestMutation = useMutation({
    mutationFn: () => guestSignUpForEvent(eventId, {
      name: guestName.trim(),
      email: guestEmail.trim(),
      phone: guestPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    }),
    onSuccess: () => {
      toast({ title: 'Signed up!', description: "You're on the list!" });
      queryClient.invalidateQueries({ queryKey: ['eventSignups', eventId] });
      queryClient.invalidateQueries({ queryKey: ['allSignupEvents'] });
      setOpen(false);
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setNotes('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const isPending = signupMutation.isPending || guestMutation.isPending;

  const handleSubmit = () => {
    if (user) {
      signupMutation.mutate();
    } else {
      if (!guestName.trim() || !guestEmail.trim()) {
        toast({ title: 'Name and email are required', variant: 'destructive' });
        return;
      }
      guestMutation.mutate();
    }
  };

  if (noCredits && STRIPE_PAID_LINK) {
    return (
      <a href={STRIPE_PAID_LINK} target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
          <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          Subscribe
          <ExternalLink className="h-3 w-3" />
        </Button>
      </a>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isFull} size="sm" className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          {isFull ? 'Full' : 'Sign Up'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Up for a Spot</DialogTitle>
          <DialogDescription>
            {user ? 'Add any notes for the host (optional)' : 'Enter your info to get on the list'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!user && (
            <>
              <div>
                <Label htmlFor="guestName" className="text-xs">Name *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="your name"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="guestEmail" className="text-xs">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your email"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="guestPhone" className="text-xs">Phone (optional)</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="your phone number"
                  className="h-9"
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., First time, working on new material..."
              className="h-9"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Signing up...' : 'Confirm Signup'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
