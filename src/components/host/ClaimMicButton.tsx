import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Clock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHostStatus } from '@/hooks/useHostStatus';
import { claimHostStatus } from '@/api/signups';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import HostMicEditForm from './HostMicEditForm';

interface ClaimMicButtonProps {
  micUniqueIdentifier: string;
  micName: string;
  venueName: string;
}

export default function ClaimMicButton({ micUniqueIdentifier, micName, venueName }: ClaimMicButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: hostData } = useHostStatus();
  const [showEdit, setShowEdit] = useState(false);

  const hostRecord = hostData?.find((h: any) => h.mic_id === micUniqueIdentifier);
  const isVerifiedHost = hostRecord?.is_verified === true;
  const isPending = hostRecord && !hostRecord.is_verified;

  const claimMutation = useMutation({
    mutationFn: () => claimHostStatus(micUniqueIdentifier),
    onSuccess: () => {
      toast({ title: 'Claim submitted!', description: 'Your request is pending admin verification.' });
      queryClient.invalidateQueries({ queryKey: ['hostStatus'] });
    },
    onError: (error: any) => {
      const msg = error.message?.includes('duplicate') 
        ? 'You have already claimed this mic.' 
        : error.message;
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const handleClaim = () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to claim this mic.' });
      navigate('/auth');
      return;
    }
    claimMutation.mutate();
  };

  // Verified host: show edit toggle
  if (isVerifiedHost) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">You manage this mic</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {showEdit ? (
            <HostMicEditForm 
              micUniqueIdentifier={micUniqueIdentifier} 
              onClose={() => setShowEdit(false)} 
            />
          ) : (
            <Button onClick={() => setShowEdit(true)} variant="outline" size="sm" className="w-full">
              Edit Mic Details
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pending claim
  if (isPending) {
    return (
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Your host claim is pending verification</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No claim yet
  return (
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Shield className="w-3 h-3" />
      <span>Are you the host?</span>
      <button
        type="button"
        onClick={handleClaim}
        disabled={claimMutation.isPending}
        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
      >
        {claimMutation.isPending ? (
          'Submitting...'
        ) : !user ? (
          <><LogIn className="w-3 h-3" /> Sign in to Claim</>
        ) : (
          'Claim This Mic'
        )}
      </button>
    </div>
  );
}
