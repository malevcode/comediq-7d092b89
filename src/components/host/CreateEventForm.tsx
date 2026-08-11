import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createSignupEvent } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateEventFormProps {
  hostId: string;
  micId: string;
}

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:hover:bg-white/20";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

export function CreateEventForm({ hostId, micId }: CreateEventFormProps) {
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [totalSpots, setTotalSpots] = useState(15);
  const [signupMode, setSignupMode] = useState<'first_come' | 'lottery' | 'bucket'>('first_come');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createSignupEvent,
    onSuccess: () => {
      toast({
        title: 'Event created',
        description: 'Your signup event is now live!',
      });
      queryClient.invalidateQueries({ queryKey: ['signupEvents'] });
      // Reset form
      setEventDate('');
      setEventTime('');
      setTotalSpots(15);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      mic_id: micId,
      host_id: hostId,
      event_date: eventDate,
      event_time: eventTime || undefined,
      total_spots: totalSpots,
      signup_mode: signupMode,
      notes: notes || undefined,
    });
  };

  return (
    <Card className={glassCardClass}>
      <CardHeader className={glassHeaderClass}>
        <CardTitle>Create Signup Event</CardTitle>
        <CardDescription className={mutedTextClass}>
          Set up a new signup list for your mic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              type="date"
              className={glassFieldClass}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="eventTime">Event Time (optional)</Label>
            <Input
              id="eventTime"
              type="time"
              className={glassFieldClass}
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="totalSpots">Total Spots</Label>
            <Input
              id="totalSpots"
              type="number"
              min={1}
              className={glassFieldClass}
              value={totalSpots}
              onChange={(e) => setTotalSpots(parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="signupMode">Signup Mode</Label>
            <Select value={signupMode} onValueChange={(value: any) => setSignupMode(value)}>
              <SelectTrigger id="signupMode" className={glassFieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_come">First Come, First Served</SelectItem>
                <SelectItem value="lottery">Lottery</SelectItem>
                <SelectItem value="bucket">Bucket Draw</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              className={glassFieldClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or rules..."
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
