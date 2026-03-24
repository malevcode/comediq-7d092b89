import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateNextEvent } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOpenMics } from '@/hooks/useOpenMics';
import { Plus } from 'lucide-react';

export function CreateSlotForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: mics } = useOpenMics();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMicId, setSelectedMicId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [totalSpots, setTotalSpots] = useState(15);
  const [signupMode, setSignupMode] = useState<'first_come' | 'lottery' | 'bucket'>('first_come');
  const [notes, setNotes] = useState('');
  const [micSearch, setMicSearch] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const event = await getOrCreateNextEvent(
        selectedMicId,
        '',
        eventTime || undefined
      );
      return event;
    },
    onSuccess: () => {
      toast({ title: 'Slot opened!', description: 'Your signup list is now live.' });
      queryClient.invalidateQueries({ queryKey: ['allSignupEvents'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredMics = mics?.filter((m: any) =>
    m.open_mic?.toLowerCase().includes(micSearch.toLowerCase()) ||
    m.venue_name?.toLowerCase().includes(micSearch.toLowerCase())
  ).slice(0, 10) || [];

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Open a Signup List
      </h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!selectedMicId) {
            toast({ title: 'Select a mic', variant: 'destructive' });
            return;
          }
          createMutation.mutate();
        }}
        className="space-y-3"
      >
        {/* Mic selector */}
        <div>
          <Label className="text-xs">Select Mic</Label>
          <Input
            placeholder="Search mics by name or venue..."
            value={micSearch}
            onChange={(e) => setMicSearch(e.target.value)}
            className="h-9 mb-1"
          />
          {micSearch && filteredMics.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {filteredMics.map((mic: any) => (
                <button
                  key={mic.unique_identifier}
                  type="button"
                  onClick={() => {
                    setSelectedMicId(mic.unique_identifier);
                    setMicSearch(mic.open_mic);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
                    selectedMicId === mic.unique_identifier ? 'bg-accent font-medium' : ''
                  }`}
                >
                  <div className="font-medium text-xs">{mic.open_mic}</div>
                  <div className="text-[11px] text-muted-foreground">{mic.venue_name} · {mic.borough}</div>
                </button>
              ))}
            </div>
          )}
          {selectedMicId && (
            <Badge variant="secondary" className="mt-1 text-[10px]">Selected ✓</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Event Date</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Event Time</Label>
            <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Total Spots</Label>
            <Input type="number" min={1} max={50} value={totalSpots} onChange={(e) => setTotalSpots(parseInt(e.target.value))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Signup Mode</Label>
            <Select value={signupMode} onValueChange={(v: any) => setSignupMode(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_come">First Come</SelectItem>
                <SelectItem value="lottery">Lottery</SelectItem>
                <SelectItem value="bucket">Bucket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rules, instructions, etc." rows={2} />
        </div>

        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Opening...' : 'Open Signup List'}
        </Button>
      </form>
    </div>
  );
}
