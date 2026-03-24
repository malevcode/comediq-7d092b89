import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import { X } from 'lucide-react';
import { MicFrequency, SignupMethod, FREQUENCY_LABELS } from '@/types/openMic';

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
  frequency_custom_text: string;
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

const FREQUENCY_OPTIONS: MicFrequency[] = ['weekly', 'one_off', 'bi_weekly', '1st_of_month', '2nd_of_month', '3rd_of_month', '4th_of_month', 'last_of_month', 'custom'];

const SIGNUP_OPTIONS: { value: SignupMethod; label: string }[] = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'online', label: 'Online' },
  { value: 'comediq_slots', label: 'Comediq Slots!' },
  { value: 'other', label: 'Other' },
];

const AddMicRequestForm: React.FC<AddMicRequestFormProps> = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const [micName, setMicName] = useState('');
  const [venueQuery, setVenueQuery] = useState('');
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null);
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [cost, setCost] = useState('');
  const [hostInstagram, setHostInstagram] = useState('');
  const [frequency, setFrequency] = useState<MicFrequency>('weekly');
  const [frequencyCustomText, setFrequencyCustomText] = useState('');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('in_person');
  const [signupUrl, setSignupUrl] = useState('');
  const [stageTime, setStageTime] = useState('');
  const [signUpInstructions, setSignUpInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!micName.trim()) newErrors.micName = 'Required';
    if (!venueQuery.trim() || !venueLocation) newErrors.venue = 'Select a venue';
    if (!day) newErrors.day = 'Required';
    if (!startTime.trim()) newErrors.startTime = 'Required';
    if (signupMethod === 'online' && !signupUrl.trim()) newErrors.signupUrl = 'URL required';
    if (frequency === 'custom' && !frequencyCustomText.trim()) newErrors.frequencyCustom = 'Describe frequency';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting || !validate()) return;

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
      cost: cost.trim() || 'Free',
      venue_type: venueLocation?.venueType || '',
      sign_up_instructions: signUpInstructions.trim(),
      hosts_organizers: hostInstagram.trim(),
      host_phone: '',
      changes_updates: hostInstagram.trim(),
      other_rules: '',
      frequency,
      signup_method: signupMethod,
      signup_url: signupUrl.trim(),
      frequency_custom_text: frequencyCustomText.trim(),
    };
    onSubmit(formData);
  };

  const fieldClass = (err?: string) => `h-9 text-sm ${err ? 'border-destructive' : ''}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center justify-between text-base">
            <span>Add a Mic</span>
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Mic Name */}
          <div>
            <Label className="text-xs">Mic Name *</Label>
            <Input
              placeholder="e.g., Comedy Night at Joe's"
              value={micName}
              onChange={(e) => { setMicName(e.target.value); if (errors.micName) setErrors(p => ({ ...p, micName: '' })); }}
              className={fieldClass(errors.micName)}
            />
            {errors.micName && <p className="text-[10px] text-destructive mt-0.5">{errors.micName}</p>}
          </div>

          {/* Venue */}
          <div>
            <Label className="text-xs">Venue *</Label>
            <VenueAutocomplete
              value={venueQuery}
              onChange={(v) => { setVenueQuery(v); if (errors.venue) setErrors(p => ({ ...p, venue: '' })); }}
              onSelect={(loc) => { setVenueLocation(loc); setErrors(p => ({ ...p, venue: '' })); }}
              error={errors.venue}
            />
          </div>

          {/* Day + Start Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Day *</Label>
              <DayOfWeekPicker
                value={day}
                onChange={(v) => { setDay(v); if (errors.day) setErrors(p => ({ ...p, day: '' })); }}
              />
              {errors.day && <p className="text-[10px] text-destructive mt-0.5">{errors.day}</p>}
            </div>
            <div>
              <Label className="text-xs">Start Time *</Label>
              <Input
                placeholder="7:00 PM"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); if (errors.startTime) setErrors(p => ({ ...p, startTime: '' })); }}
                className={fieldClass(errors.startTime)}
              />
              {errors.startTime && <p className="text-[10px] text-destructive mt-0.5">{errors.startTime}</p>}
            </div>
          </div>

          {/* Cost + Host IG */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Cost</Label>
              <Input placeholder="Free, $5, etc." value={cost} onChange={(e) => setCost(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Host Instagram</Label>
              <Input placeholder="@handle" value={hostInstagram} onChange={(e) => setHostInstagram(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Frequency + Signup Method */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as MicFrequency)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNUP_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional: custom frequency text */}
          {frequency === 'custom' && (
            <div>
              <Label className="text-xs">Describe frequency *</Label>
              <Input
                placeholder="e.g., Every other Thursday, 1st & 3rd Monday"
                value={frequencyCustomText}
                onChange={(e) => { setFrequencyCustomText(e.target.value); if (errors.frequencyCustom) setErrors(p => ({ ...p, frequencyCustom: '' })); }}
                className={fieldClass(errors.frequencyCustom)}
              />
              {errors.frequencyCustom && <p className="text-[10px] text-destructive mt-0.5">{errors.frequencyCustom}</p>}
            </div>
          )}

          {/* Conditional: signup URL */}
          {(signupMethod === 'online' || signupMethod === 'other') && (
            <div>
              <Label className="text-xs">{signupMethod === 'online' ? 'Signup URL *' : 'Describe signup'}</Label>
              <Input
                placeholder={signupMethod === 'online' ? 'https://...' : 'Describe how to sign up'}
                value={signupUrl}
                onChange={(e) => { setSignupUrl(e.target.value); if (errors.signupUrl) setErrors(p => ({ ...p, signupUrl: '' })); }}
                className={fieldClass(errors.signupUrl)}
              />
              {errors.signupUrl && <p className="text-[10px] text-destructive mt-0.5">{errors.signupUrl}</p>}
            </div>
          )}

          {/* Stage Time + Sign-Up Instructions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Stage Time</Label>
              <Input placeholder="5 min" value={stageTime} onChange={(e) => setStageTime(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Sign-Up Info</Label>
              <Input placeholder="Bucket pull, list, etc." value={signUpInstructions} onChange={(e) => setSignUpInstructions(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-9 text-sm mt-1">
            {isSubmitting ? 'Adding...' : 'Add Mic'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMicRequestForm;
