import { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { OpenMic } from '@/types/openMic';

export default function SuggestEditButton({ mic }: { mic: OpenMic }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to suggest an edit.' });
      navigate('/auth');
      return;
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setDescription('');
    setDay('');
    setTime('');
    setLocation('');
    setCost('');
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: 'Required', description: 'Please describe what needs to be changed.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('open_mics_requests').insert({
        show_title: mic.openMic,
        venue_name: mic.venueName,
        borough: mic.borough,
        date: day || mic.day,
        time: time || mic.startTime,
        location: location || mic.location,
        cost: cost || mic.cost,
        changes_updates: `[EDIT SUGGESTION – Ref: ${mic.uniqueIdentifier}]\n${description.trim()}`,
        status: 'edit_suggestion',
        user_id: user!.id,
      });
      if (error) throw error;
      toast({ title: 'Thanks!', description: 'Your suggestion has been submitted for review.' });
      handleClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="text-muted-foreground hover:text-foreground text-xs w-full justify-start px-0"
      >
        <Pencil className="w-3 h-3 mr-1" />
        Suggest a correction
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest a Correction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{mic.openMic}</span> @ {mic.venueName}
            </p>
            <div>
              <Label className="text-sm font-medium">What needs to be updated? *</Label>
              <Textarea
                placeholder="e.g. The show moved to Tuesdays, the address is wrong, it's no longer free..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Optionally fill in corrected values:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Day</Label>
                <Input
                  placeholder={mic.day}
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input
                  placeholder={mic.startTime}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Address</Label>
                <Input
                  placeholder={mic.location}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cost</Label>
                <Input
                  placeholder={mic.cost}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
