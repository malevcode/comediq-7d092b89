import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import MicDatePicker from '@/components/MicDatePicker';
import { toIsoDate } from '@/utils/micOccurrences';
import { MicFrequency, FREQUENCY_LABELS } from '@/types/openMic';
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

const LINEUP_OPTIONS: { value: string; label: string }[] = [
  { value: 'bucket', label: 'Bucket / random' },
  { value: 'arrival', label: 'List in order of arrival' },
  { value: 'host', label: 'Host chooses' },
];

/** The first web link in the sign-up box, with https:// added when it starts with www. */
function findLink(text: string): { raw: string; url: string } | null {
  const match = text.match(/(https?:\/\/\S+|www\.\S+)/i);
  if (!match) return null;
  const raw = match[1];
  return { raw, url: /^https?:\/\//i.test(raw) ? raw : `https://${raw}` };
}

/** Label on top, control below. Lives outside the card so inputs keep focus while typing. */
function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

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
  const [lineup, setLineup] = useState('');
  const [frequencyCustomText, setFrequencyCustomText] = useState('');
  const [dates, setDates] = useState<Date[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bi-weekly, pop-up and custom mics must say WHICH weeks or days, so the site
  // only shows them when they are actually happening.
  const needsDates = frequency === 'bi_weekly' || frequency === 'one_off' || frequency === 'custom';
  const datesMode = frequency === 'custom' || frequency === 'one_off' ? 'multiple' : 'single';
  const noteLimit = 60;

  const scheduleText = (): string => {
    if (frequency === 'bi_weekly') return dates[0] ? `anchor ${toIsoDate(dates[0])}` : '';
    if (frequency === 'one_off' || frequency === 'custom') {
      const list = dates.length ? `dates ${dates.map(toIsoDate).join(',')}` : '';
      const note = frequency === 'custom' ? frequencyCustomText.trim().slice(0, noteLimit) : '';
      return [note, list].filter(Boolean).join(' ');
    }
    return '';
  };

  const changeDay = (next: string) => {
    setDay(next);
    clearError('day');
    // Dates already picked must still be that weekday.
    const index = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(next);
    setDates((current) => current.filter((d) => d.getDay() === index));
  };

  const changeDates = (next: Date[]) => {
    setDates(next);
    clearError('dates');
    // No day chosen yet: take it from the first date picked.
    if (!day && next[0]) {
      setDay(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][next[0].getDay()]);
      clearError('day');
    }
  };

  const clearError = (key: string) => setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!micName.trim()) newErrors.micName = 'Mic name required';
    if (!venueQuery.trim() || !venueLocation) newErrors.venue = 'Select a venue';
    if (!day) newErrors.day = 'Day required';
    if (!startTime.trim()) newErrors.startTime = 'Start time required';
    if (needsDates && dates.length === 0) newErrors.dates = frequency === 'bi_weekly' ? 'Pick the next date it happens' : 'Pick the date(s)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (isSubmitting || !validate()) return;
    const autoEndTime = endTime.trim() || addMinutes(startTime, 90);
    // One box for how to sign up. A pasted link makes it an online sign-up; plain
    // words stay as in-person instructions. The lineup order is added as a line.
    const link = findLink(signUpInstructions);
    const typed = (link ? signUpInstructions.replace(link.raw, '') : signUpInstructions).trim();
    const lineupLabel = LINEUP_OPTIONS.find((o) => o.value === lineup)?.label;
    const signUpText = [typed, lineupLabel ? `Lineup: ${lineupLabel}` : ''].filter(Boolean).join('. ');
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
      sign_up_instructions: signUpText,
      hosts_organizers: hostInstagram.trim(),
      host_phone: '',
      changes_updates: hostInstagram.trim(),
      other_rules: '',
      frequency,
      signup_method: link ? 'online' : 'in_person',
      signup_url: link ? link.url : '',
      frequency_custom_text: scheduleText(),
    });
  };

  // One field look for every control: solid border, same height, label on top.
  const field = (invalid = false) =>
    `h-9 w-full text-sm shadow-none bg-white/70 border ${
      invalid ? 'border-red-400' : 'border-gray-300'
    } dark:bg-white/5 dark:border-white/20`;

  return (
    <div className="w-full rounded-xl border border-l-4 border-green-200/70 border-l-green-500 bg-white/25 p-3 mb-3 shadow-[0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl dark:border-white/10 dark:border-l-green-500 dark:bg-[#102a53]/20">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-4">
        <Field label="Mic name *" className="col-span-2 sm:col-span-4">
          <Input
            placeholder="5 Buddha Room Hour Mic"
            value={micName}
            onChange={(e) => { setMicName(e.target.value); clearError('micName'); }}
            className={`${field(Boolean(errors.micName))} font-semibold`}
          />
        </Field>

        <Field label="Venue *" className="col-span-2 sm:col-span-4">
          <VenueAutocomplete
            value={venueQuery}
            onChange={(v) => { setVenueQuery(v); clearError('venue'); }}
            onSelect={(loc) => { setVenueLocation(loc); clearError('venue'); }}
            error={errors.venue}
          />
        </Field>

        <Field label="Day *">
          <DayOfWeekPicker value={day} onChange={changeDay} className={field(Boolean(errors.day))} />
        </Field>
        <Field label="Starts *">
          <Input
            placeholder="4:00 PM"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); clearError('startTime'); }}
            className={field(Boolean(errors.startTime))}
          />
        </Field>
        <Field label="Ends">
          <Input placeholder="5:30 PM" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={field()} />
        </Field>
        <Field label="How often">
          <Select
            value={frequency}
            onValueChange={(v) => {
              const next = v as MicFrequency;
              setFrequency(next);
              clearError('dates');
              // Bi-weekly takes one date. Weekly and monthly schedules take none.
              setDates((current) =>
                next === 'bi_weekly' ? current.slice(0, 1) : ['one_off', 'custom'].includes(next) ? current : [],
              );
            }}
          >
            <SelectTrigger className={field()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map(f => (
                <SelectItem key={f} value={f}>{f === 'one_off' ? 'One-Off (Pop-Up)' : FREQUENCY_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {needsDates && (
          <div className="col-span-2 space-y-1 text-left sm:col-span-4">
            <p className="text-[11px] font-medium text-muted-foreground">
              {frequency === 'bi_weekly'
                ? 'Which date is the next one? We will show it every other week from then.'
                : frequency === 'one_off'
                  ? 'Which day is the pop-up?'
                  : 'Which dates does it happen? We will only show it on those days.'}
            </p>
            <MicDatePicker
              mode={datesMode}
              day={day}
              value={dates}
              onChange={changeDates}
              placeholder={frequency === 'bi_weekly' ? 'Pick the next date *' : 'Pick the date(s) *'}
              invalid={Boolean(errors.dates)}
            />
            {frequency === 'bi_weekly' && dates[0] && (
              <p className="text-[11px] text-muted-foreground">
                Shows on:{' '}
                {[0, 14, 28, 42]
                  .map((offset) => {
                    const date = new Date(dates[0]);
                    date.setDate(date.getDate() + offset);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  })
                  .join(', ')}
                , and so on
              </p>
            )}
            {frequency === 'custom' && (
              <Input
                placeholder="Optional note, e.g. 1st and 3rd Thursday"
                value={frequencyCustomText}
                maxLength={60}
                onChange={(e) => setFrequencyCustomText(e.target.value)}
                className={field()}
              />
            )}
          </div>
        )}

        <Field label="Set length">
          <Input placeholder="5 min" value={stageTime} onChange={(e) => setStageTime(e.target.value)} className={field()} />
        </Field>
        <Field label="Cost">
          <Input placeholder="Free" value={cost} onChange={(e) => setCost(e.target.value)} className={field()} />
        </Field>
        <Field label="Lineup order">
          <Select value={lineup} onValueChange={setLineup}>
            <SelectTrigger className={field()}>
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {LINEUP_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Host">
          <Input placeholder="@host" value={hostInstagram} onChange={(e) => setHostInstagram(e.target.value)} className={field()} />
        </Field>

        <Field label="Sign-up" className="col-span-2 sm:col-span-4">
          <Input
            placeholder="Paste a link, or say bucket / in person list"
            value={signUpInstructions}
            onChange={(e) => setSignUpInstructions(e.target.value)}
            className={field()}
          />
        </Field>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="mt-2 text-xs text-red-500 leading-tight">
          {Object.values(errors).join(' · ')}
        </p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-9 px-4 text-sm">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSubmitting}
          className="h-9 px-5 text-sm bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? 'Adding...' : '+ Add Mic'}
        </Button>
      </div>
    </div>
  );
}
