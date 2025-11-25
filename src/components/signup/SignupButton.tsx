import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { signUpForEvent } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface SignupButtonProps {
  eventId: string;
  isFull: boolean;
}

export function SignupButton({ eventId, isFull }: SignupButtonProps) {
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: () => signUpForEvent(eventId, notes),
    onSuccess: () => {
      toast({
        title: 'Signed up!',
        description: 'You\'re on the list!',
      });
      queryClient.invalidateQueries({ queryKey: ['eventSignups', eventId] });
      setOpen(false);
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return (
      <Button variant="outline" disabled>
        Sign in to sign up
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isFull}>
          {isFull ? 'Event Full' : 'Sign Up for Spot'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Up for Spot</DialogTitle>
          <DialogDescription>
            Add any notes for the host (optional)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., First time, working on new material..."
            />
          </div>
          <Button 
            onClick={() => signupMutation.mutate()}
            disabled={signupMutation.isPending}
            className="w-full"
          >
            {signupMutation.isPending ? 'Signing up...' : 'Confirm Signup'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
