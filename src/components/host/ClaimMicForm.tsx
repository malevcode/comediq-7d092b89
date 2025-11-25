import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { claimHostStatus } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOpenMics } from '@/hooks/useOpenMics';

export function ClaimMicForm() {
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const { data: mics } = useOpenMics();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: claimHostStatus,
    onSuccess: () => {
      toast({
        title: 'Claim submitted',
        description: 'Your host claim is pending admin verification.',
      });
      queryClient.invalidateQueries({ queryKey: ['hostStatus'] });
      setSelectedMicId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMicId) {
      claimMutation.mutate(selectedMicId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim a Mic</CardTitle>
        <CardDescription>
          Request to be verified as a host for an open mic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select value={selectedMicId} onValueChange={setSelectedMicId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a mic to claim" />
            </SelectTrigger>
            <SelectContent>
              {mics?.map((mic) => (
                <SelectItem key={mic.uniqueIdentifier} value={mic.uniqueIdentifier}>
                  {mic.openMic} at {mic.venueName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!selectedMicId || claimMutation.isPending}>
            {claimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
