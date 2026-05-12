import React, { useState } from 'react';
import { MapPin, Calendar, Clock, CircleUser, DollarSign, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import { MicFrequency, SignupMethod, FREQUENCY_LABELS } from '@/types/openMic';
import { MicRequestFormData } from '@/components/host/AddMicRequestForm';

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

const FREQUENCY_OPTIONS: MicFrequency[] = [
  'weekly', 'one_off', 'bi_weekly',
  '1st_of_month', '2nd_of_month', '3rd_of_month', '4th_of_month', 'last_of_month', 'custom',
];

const SIGNUP_OPTIONS: { value: SignupMethod; label: string }[] = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'online', label: 'Online' },
  { value: 'comediq_slots', label: 'Comediq Slots!' },
  { value: 'other', label: 'Other' },
];

interface EditableMicCardProps {
  onSave: (data: MicRequestFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditableMicCard({ onSave, onCancel, isSubmitting = false }: EditableMicCardProps) {
  const [micName, setMicName] = useState('');
  const [venueQuery, setVenueQuery] = useState('');
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null);
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cost, setCost] = useState('');
  const [hostInstagram, setHostInstagram] = useState('');
  const [stageTime, setStageTime] = useState('');
  const [signUpInstructions, setSignUpInstructions] = useState('');
  const [frequency, setFrequency] = useState<MicFrequency>('weekly');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('in_person');
  const [signupUrl, setSignupUrl] = useState('');
  const [frequencyCustomText, setFrequencyCustomText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) => setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!micName.trim()) newErrors.micName = 'Mic name required';
    if (!venueQuery.trim() || !venueLocation) newErrors.venue = 'Select a venue';
    if (!day) newErrors.day = 'Day required';
    if (!startTime.trim()) newErrors.startTime = 'Start time required';
    if (signupMethod === 'online' && !signupUrl.trim()) newErrors.signupUrl = 'Signup URL required';
    if (frequency === 'custom' && !frequencyCustomText.trim()) newErrors.frequencyCustom = 'Describe frequency';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (isSubmitting || !validate()) return;
    const autoEndTime = endTime.trim() || addMinutes(startTime, 90);
    onSave({
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
    });
  };

  const ghostInput = (extraClass = '') =>
    `border-0 border-b border-dashed bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-1 ${extraClass}`;

  return (
    <div className="flex flex-col md:flex-row w-full border rounded-xl shadow-sm p-2.5 gap-1.5 md:gap-3 overflow-x-hidden bg-gradient-to-br from-green-50 to-white border-green-200 border-l-4 border-l-green-500 mb-3 ring-1 ring-green-200/60">

      {/* Left: Name, Venue, Day, Host */}
      <div className="flex-1 min-w-0 mr-1 text-center">
        <div className="flex items-center w-full mb-1.5">
          <div className="flex-1" />
          <Input
            placeholder="Mic name *"
            value={micName}
            onChange={(e) => { setMicName(e.target.value); clearError('micName'); }}
            className={`font-semibold text-base text-center max-w-xs ${ghostInput(errors.micName ? 'border-red-400 h-7' : 'border-gray-300 h-7')}`}
          />
          <div className="flex-1" />
        </div>

        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-start gap-1 justify-center">
            <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400 mt-2" />
            <div className="flex-1 max-w-xs text-left">
              <VenueAutocomplete
                value={venueQuery}
                onChange={(v) => { setVenueQuery(v); clearError('venue'); }}
                onSelect={(loc) => { setVenueLocation(loc); clearError('venue'); }}
                error={errors.venue}
              />
            </div>
          </div>

          <div className="flex flex-row gap-2 justify-center items-center flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <DayOfWeekPicker
                value={day}
                onChange={(v) => { setDay(v); clearError('day'); }}
              />
            </span>
            <span className="flex items-center gap-1">
              <CircleUser className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <Input
                placeholder="@host"
                value={hostInstagram}
                onChange={(e) => setHostInstagram(e.target.value)}
                className={ghostInput('w-24 h-6 text-xs border-gray-300')}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Times, Stage Time, Cost */}
      <div className="flex-1 flex flex-col justify-center min-w-0 text-xs text-gray-700 mr-1 gap-2">
        <div className="flex flex-row gap-1.5 items-center justify-center">
          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <Input
            placeholder="4:00 PM *"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); clearError('startTime'); }}
            className={ghostInput(`w-20 h-6 ${errors.startTime ? 'border-red-400' : 'border-gray-300'}`)}
          />
          <span className="text-gray-400 text-[10px]">–</span>
          <Input
            placeholder="5:30 PM"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={ghostInput('w-20 h-6 border-gray-300')}
          />
        </div>
        <div className="flex flex-row gap-3 items-center justify-center">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="5 min"
              value={stageTime}
              onChange={(e) => setStageTime(e.target.value)}
              className={ghostInput('w-16 h-6 border-gray-300')}
            />
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Free"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={ghostInput('w-16 h-6 border-gray-300')}
            />
          </span>
        </div>
      </div>

      {/* Right: Details + Save */}
      <div className="w-full md:flex-[1.2] flex flex-col justify-center gap-0">
        <div className="bg-green-50 border border-green-100 rounded-md p-2 flex flex-col gap-2">
          <div className="flex items-center gap-1 text-xs">
            <UserRoundCheck className="w-3 h-3 flex-shrink-0 text-gray-500" />
            <span className="whitespace-nowrap text-muted-foreground text-[11px]">Sign-Up:</span>
            <Input
              placeholder="bucket pull, list, etc."
              value={signUpInstructions}
              onChange={(e) => setSignUpInstructions(e.target.value)}
              className={ghostInput('flex-1 h-6 border-gray-300')}
            />
          </div>

          {venueLocation?.address && (
            <div className="text-[11px] flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{venueLocation.address}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as MicFrequency)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map(f => (
                  <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={signupMethod} onValueChange={(v) => setSignupMethod(v as SignupMethod)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIGNUP_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(signupMethod === 'online' || signupMethod === 'other') && (
            <Input
              placeholder={signupMethod === 'online' ? 'https://...' : 'Describe how to sign up'}
              value={signupUrl}
              onChange={(e) => { setSignupUrl(e.target.value); clearError('signupUrl'); }}
              className={`h-7 text-xs ${errors.signupUrl ? 'border-red-400' : ''}`}
            />
          )}

          {frequency === 'custom' && (
            <Input
              placeholder="e.g., Every other Thursday"
              value={frequencyCustomText}
              onChange={(e) => { setFrequencyCustomText(e.target.value); clearError('frequencyCustom'); }}
              className={`h-7 text-xs ${errors.frequencyCustom ? 'border-red-400' : ''}`}
            />
          )}

          {Object.keys(errors).length > 0 && (
            <p className="text-[10px] text-red-500 leading-tight">
              {Object.values(errors).join(' · ')}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Adding...' : '+ Add Mic'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
