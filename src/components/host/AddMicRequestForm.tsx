import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { MicFrequency, SignupMethod, FREQUENCY_LABELS, SIGNUP_METHOD_LABELS } from '@/types/openMic';

export interface MicRequestFormData {
  open_mic: string;
  venue_name: string;
  city: string;
  borough: string;
  neighborhood: string;
  location: string;
  day: string;
  start_time: string;
  latest_end_time: string;
  stage_time: string;
  cost: string;
  venue_type: string;
  sign_up_instructions: string;
  hosts_organizers: string;
  host_phone: string;
  changes_updates: string;
  other_rules: string;
  frequency: MicFrequency;
  signup_method: SignupMethod;
  signup_url: string;
}

interface AddMicRequestFormProps {
  onSubmit: (data: MicRequestFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function addMinutes(timeStr: string, minutes: number): string {
  const cleaned = timeStr.trim();
  let hours: number, mins: number;
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    hours = parseInt(match12[1]);
    mins = parseInt(match12[2]);
    const isPM = match12[3].toUpperCase() === 'PM';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      hours = parseInt(match24[1]);
      mins = parseInt(match24[2]);
    } else {
      return '';
    }
  }
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  const period = newHours >= 12 ? 'PM' : 'AM';
  const displayHour = newHours % 12 || 12;
  return `${displayHour}:${newMins.toString().padStart(2, '0')} ${period}`;
}

const FREQUENCY_OPTIONS: MicFrequency[] = ['weekly', 'bi_weekly', '1st_of_month', '2nd_of_month', '3rd_of_month', '4th_of_month', 'last_of_month', 'one_off'];

const AddMicRequestForm: React.FC<AddMicRequestFormProps> = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const [page, setPage] = useState(1);

  // Page 1 fields
  const [micName, setMicName] = useState('');
  const [venueQuery, setVenueQuery] = useState('');
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null);
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [cost, setCost] = useState('');
  const [hostInstagram, setHostInstagram] = useState('');
  const [frequency, setFrequency] = useState<MicFrequency>('weekly');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('in_person');
  const [signupUrl, setSignupUrl] = useState('');

  // Page 2 fields
  const [stageTime, setStageTime] = useState('');
  const [signUpInstructions, setSignUpInstructions] = useState('');
  const [otherRules, setOtherRules] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePage1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!micName.trim()) newErrors.micName = 'Mic name is required';
    if (!venueQuery.trim() || !venueLocation) newErrors.venue = 'Select a venue from the dropdown';
    if (!day) newErrors.day = 'Day is required';
    if (!startTime.trim()) newErrors.startTime = 'Start time is required';
    if (signupMethod === 'online' && !signupUrl.trim()) newErrors.signupUrl = 'URL is required for online signup';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage1()) setPage(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;

    // Page 2 doesn't have required fields, submit directly
    const autoEndTime = addMinutes(startTime.trim(), 90);

    const formData: MicRequestFormData = {
      open_mic: micName.trim(),
      venue_name: venueLocation?.venueName || venueQuery.trim(),
      city: venueLocation?.city || 'New York',
      borough: venueLocation?.borough || '',
      neighborhood: venueLocation?.neighborhood || '',
      location: venueLocation?.address || '',
      day,
      start_time: startTime.trim(),
      latest_end_time: autoEndTime,
      stage_time: stageTime.trim(),
      cost: cost.trim(),
      venue_type: venueLocation?.venueType || '',
      sign_up_instructions: signUpInstructions.trim(),
      hosts_organizers: hostInstagram.trim(),
      host_phone: '',
      changes_updates: hostInstagram.trim(),
      other_rules: otherRules.trim(),
      frequency,
      signup_method: signupMethod,
      signup_url: signupUrl.trim(),
    };

    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Request New Mic {page === 2 ? '— Details' : ''}</span>
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-1">
            <div className={`h-1.5 flex-1 rounded-full ${page >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${page >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DialogHeader>

        <form onSubmit={page === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
          {page === 1 && (
            <>
              {/* Mic Name */}
              <div className="space-y-1.5">
                <Label htmlFor="mic_name">Mic Name *</Label>
                <Input
                  id="mic_name"
                  placeholder="e.g., Comedy Night at Joe's"
                  value={micName}
                  onChange={(e) => { setMicName(e.target.value); if (errors.micName) setErrors(p => ({ ...p, micName: '' })); }}
                  className={errors.micName ? 'border-destructive' : ''}
                />
                {errors.micName && <p className="text-xs text-destructive">{errors.micName}</p>}
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <Label>Venue *</Label>
                <VenueAutocomplete
                  value={venueQuery}
                  onChange={(v) => { setVenueQuery(v); if (errors.venue) setErrors(p => ({ ...p, venue: '' })); }}
                  onSelect={(loc) => { setVenueLocation(loc); setErrors(p => ({ ...p, venue: '' })); }}
                  error={errors.venue}
                />
              </div>

              {/* Day + Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Day *</Label>
                  <DayOfWeekPicker
                    value={day}
                    onChange={(v) => { setDay(v); if (errors.day) setErrors(p => ({ ...p, day: '' })); }}
                  />
                  {errors.day && <p className="text-xs text-destructive">{errors.day}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    placeholder="e.g., 7:00 PM"
                    value={startTime}
                    onChange={(e) => { setStartTime(e.target.value); if (errors.startTime) setErrors(p => ({ ...p, startTime: '' })); }}
                    className={errors.startTime ? 'border-destructive' : ''}
                  />
                  {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
                </div>
              </div>

              {/* Cost */}
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  placeholder="e.g., Free, $5, 1 drink min"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              {/* Host Instagram */}
              <div className="space-y-1.5">
                <Label htmlFor="host_ig">Host Instagram</Label>
                <Input
                  id="host_ig"
                  placeholder="@instagram_handle"
                  value={hostInstagram}
                  onChange={(e) => setHostInstagram(e.target.value)}
                />
              </div>

              {/* Frequency */}
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as MicFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(f => (
                      <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Signup Method */}
              <div className="space-y-2">
                <Label>Signup Method</Label>
                <RadioGroup value={signupMethod} onValueChange={(v) => setSignupMethod(v as SignupMethod)} className="grid grid-cols-2 gap-2">
                  {(Object.entries(SIGNUP_METHOD_LABELS) as [SignupMethod, string][]).map(([value, label]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={`signup-${value}`} />
                      <Label htmlFor={`signup-${value}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {signupMethod === 'online' && (
                  <div className="space-y-1">
                    <Input
                      placeholder="Signup URL"
                      value={signupUrl}
                      onChange={(e) => { setSignupUrl(e.target.value); if (errors.signupUrl) setErrors(p => ({ ...p, signupUrl: '' })); }}
                      className={errors.signupUrl ? 'border-destructive' : ''}
                    />
                    {errors.signupUrl && <p className="text-xs text-destructive">{errors.signupUrl}</p>}
                  </div>
                )}
                {signupMethod === 'other' && (
                  <Input
                    placeholder="Describe signup method"
                    value={signupUrl}
                    onChange={(e) => setSignupUrl(e.target.value)}
                  />
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  Next: Add Details <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {page === 2 && (
            <>
              <p className="text-sm text-muted-foreground">These fields are optional but help us maintain clean data.</p>

              <div className="space-y-1.5">
                <Label htmlFor="stage_time">Stage Time</Label>
                <Input
                  id="stage_time"
                  placeholder="e.g., 5 minutes"
                  value={stageTime}
                  onChange={(e) => setStageTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup_instructions">Sign-Up Instructions</Label>
                <Textarea
                  id="signup_instructions"
                  placeholder="How do comedians sign up? (e.g., bucket pull, first come first served)"
                  value={signUpInstructions}
                  onChange={(e) => setSignUpInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="other_rules">Other Rules / Notes</Label>
                <Textarea
                  id="other_rules"
                  placeholder="Any house rules, drink minimums, etc."
                  value={otherRules}
                  onChange={(e) => setOtherRules(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPage(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Mic Request'}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMicRequestForm;
