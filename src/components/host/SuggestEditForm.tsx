import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Pencil } from 'lucide-react';
import { OpenMic, MicFrequency, SignupMethod, FREQUENCY_LABELS } from '@/types/openMic';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SuggestEditFormProps {
  mic: OpenMic;
  onClose: () => void;
}

const FREQUENCY_OPTIONS: MicFrequency[] = [
  'weekly', 'one_off', 'bi_weekly',
  '1st_of_month', '2nd_of_month', '3rd_of_month', '4th_of_month',
  'last_of_month', 'custom',
];

const SIGNUP_OPTIONS: { value: SignupMethod; label: string }[] = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'online', label: 'Online' },
  { value: 'comediq_slots', label: 'Comediq Slots' },
  { value: 'other', label: 'Other' },
];

const SuggestEditForm: React.FC<SuggestEditFormProps> = ({ mic, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [micName, setMicName] = useState(mic.openMic || '');
  const [venueName, setVenueName] = useState(mic.venueName || '');
  const [location, setLocation] = useState(mic.location || '');
  const [borough, setBorough] = useState(mic.borough || '');
  const [neighborhood, setNeighborhood] = useState(mic.neighborhood || '');
  const [day, setDay] = useState(mic.day || '');
  const [startTime, setStartTime] = useState(mic.startTime || '');
  const [cost, setCost] = useState(mic.cost || '');
  const [stageTime, setStageTime] = useState(mic.stageTime || '');
  const [signUpInstructions, setSignUpInstructions] = useState(mic.signUpInstructions || '');
  const [hosts, setHosts] = useState(mic.hosts || '');
  const [instagramHandle, setInstagramHandle] = useState(mic.instagramHandle || '');
  const [frequency, setFrequency] = useState<MicFrequency>(mic.frequency || 'weekly');
  const [frequencyCustomText, setFrequencyCustomText] = useState(mic.frequencyCustomText || '');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>(mic.signupMethod || 'in_person');
  const [signupUrl, setSignupUrl] = useState(mic.signupUrl || '');
  const [otherRules, setOtherRules] = useState(mic.otherRules || '');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('open_mics_requests').insert([{
        open_mic: micName.trim(),
        show_title: micName.trim(),
        venue_name: venueName.trim(),
        location: location.trim() || null,
        borough: borough.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: mic.city || 'New York',
        day: day.trim(),
        start_time: startTime.trim(),
        cost: cost.trim() || null,
        stage_time: stageTime.trim() || null,
        sign_up_instructions: signUpInstructions.trim() || null,
        hosts_organizers: hosts.trim() || null,
        changes_updates: instagramHandle.trim() || null,
        other_rules: otherRules.trim() || null,
        frequency: frequency || null,
        frequency_custom_text: frequencyCustomText.trim() || null,
        signup_method: signupMethod || null,
        signup_url: signupUrl.trim() || null,
        venue_type: mic.venueType || null,
        // host_phone stores the target mic UUID so admin can apply the edit
        host_phone: mic.uniqueIdentifier,
        status: 'edit_suggestion',
        reviewed: false,
        user_id: user?.id || null,
      }]);

      if (error) throw error;

      setSubmitted(true);
      toast({ title: 'Thanks!', description: 'Your correction has been submitted for review.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not submit. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-sm p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Pencil className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">Edit Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              Thanks for keeping Comediq accurate. Your correction will be reviewed shortly.
            </p>
            <Button onClick={onClose} className="w-full mt-2">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const fieldClass = 'h-9 text-sm';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Suggest an Edit
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">
            Correcting: <span className="font-medium">{mic.openMic}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <Label className="text-xs">Mic Name</Label>
            <Input value={micName} onChange={(e) => setMicName(e.target.value)} className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Day</Label>
              <Input value={day} onChange={(e) => setDay(e.target.value)} placeholder="Monday" className={fieldClass} />
            </div>
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="7:00 PM" className={fieldClass} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Venue Name</Label>
            <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} className={fieldClass} />
          </div>

          <div>
            <Label className="text-xs">Address</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="123 Main St, New York, NY" className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Borough</Label>
              <Input value={borough} onChange={(e) => setBorough(e.target.value)} placeholder="Manhattan" className={fieldClass} />
            </div>
            <div>
              <Label className="text-xs">Neighborhood</Label>
              <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="East Village" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Cost</Label>
              <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Free, $5, etc." className={fieldClass} />
            </div>
            <div>
              <Label className="text-xs">Stage Time</Label>
              <Input value={stageTime} onChange={(e) => setStageTime(e.target.value)} placeholder="5 min" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as MicFrequency)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Signup Method</Label>
              <Select value={signupMethod} onValueChange={(v) => setSignupMethod(v as SignupMethod)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SIGNUP_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === 'custom' && (
            <div>
              <Label className="text-xs">Custom Frequency Description</Label>
              <Input value={frequencyCustomText} onChange={(e) => setFrequencyCustomText(e.target.value)} placeholder="e.g., Every other Thursday" className={fieldClass} />
            </div>
          )}

          {(signupMethod === 'online' || signupMethod === 'other') && (
            <div>
              <Label className="text-xs">{signupMethod === 'online' ? 'Signup URL' : 'Signup Description'}</Label>
              <Input value={signupUrl} onChange={(e) => setSignupUrl(e.target.value)} placeholder="https://..." className={fieldClass} />
            </div>
          )}

          <div>
            <Label className="text-xs">Sign-Up Instructions</Label>
            <Input value={signUpInstructions} onChange={(e) => setSignUpInstructions(e.target.value)} placeholder="Bucket pull, list at door, etc." className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Host(s)</Label>
              <Input value={hosts} onChange={(e) => setHosts(e.target.value)} placeholder="Host name(s)" className={fieldClass} />
            </div>
            <div>
              <Label className="text-xs">Host Instagram</Label>
              <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@handle" className={fieldClass} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Other Rules / Notes</Label>
            <Input value={otherRules} onChange={(e) => setOtherRules(e.target.value)} placeholder="Any other info" className={fieldClass} />
          </div>

          <div>
            <Label className="text-xs">What did you correct? (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., The start time changed to 8 PM, the venue moved..."
              className="text-sm min-h-[60px] resize-none"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-9 text-sm mt-1">
            {submitting ? 'Submitting...' : 'Submit Correction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestEditForm;
