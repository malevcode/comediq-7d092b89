import React, { useState } from 'react';
import { Clock, CircleUser, DollarSign } from 'lucide-react';
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

/**
 * Turns what a comic types into the format the database uses everywhere: "7:30 PM".
 * "7", "7pm", "7:30p", "19:30" all work. Hours 1 to 11 with no AM or PM are read as PM,
 * since open mics are almost never in the morning. Anything unreadable is left alone.
 */
function normalizeTime(raw: string): string {
  const text = raw.trim();
  const m = text.match(/^(\d{1,2})(?::?(\d{2}))?\s*([ap])?\.?m?\.?$/i);
  if (!m) return text;
  let hours = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  if (mins > 59 || hours > 23) return text;
  const pm = m[3] ? m[3].toLowerCase() === 'p' : hours !== 0;
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${mins.toString().padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
}

/** "5" becomes "5 min". Anything with words in it ("3-5 min", "5+") is kept as typed. */
function normalizeSetLength(raw: string): string {
  const text = raw.trim();
  return /^\d+$/.test(text) ? `${text} min` : text;
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
    const start = normalizeTime(startTime);
    const autoEndTime = endTime.trim() ? normalizeTime(endTime) : addMinutes(start, 90);
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
      start_time: start,
      latest_end_time: autoEndTime,
      stage_time: normalizeSetLength(stageTime),
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

  // Funnel layout: each row is narrower and smaller than the one above it, so the
  // form gets easier to finish as you go. Placeholders and icons are the labels.
  const field = (size: string, invalid = false) =>
    `${size} shadow-none bg-white/70 border ${
      invalid ? 'border-red-400' : 'border-gray-300'
    } dark:bg-white/5 dark:border-white/20`;
  const row = 'mx-auto flex w-full flex-wrap items-center justify-center gap-2';

  return (
    <div className="w-full rounded-xl border border-l-4 border-blue-200/70 border-l-primary bg-white/25 px-3 py-3 mb-3 shadow-[0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl dark:border-white/10 dark:border-l-[#8ec5ff] dark:bg-[#102a53]/20">
      <div className="flex flex-col gap-2">
        {/* Widest and biggest: the two things everyone has to answer */}
        <Input
          placeholder="Mic name *"
          value={micName}
          onChange={(e) => { setMicName(e.target.value); clearError('micName'); }}
          className={`${field('h-11 text-base', Boolean(errors.micName))} text-center font-semibold`}
        />
        <div className="mx-auto w-full sm:w-[92%]">
          <VenueAutocomplete
            value={venueQuery}
            onChange={(v) => { setVenueQuery(v); clearError('venue'); }}
            onSelect={(loc) => { setVenueLocation(loc); clearError('venue'); }}
            error={errors.venue}
          />
        </div>

        {/* When */}
        <div className={`${row} sm:w-[78%]`}>
          <DayOfWeekPicker value={day} onChange={changeDay} className={field('h-9 w-28 text-sm sm:w-36', Boolean(errors.day))} />
          <Input
            placeholder="7:00 PM *"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); clearError('startTime'); }}
            onBlur={() => setStartTime((t) => normalizeTime(t))}
            className={`${field('h-9 w-[5.5rem] px-2 text-sm sm:w-24', Boolean(errors.startTime))} text-center`}
          />
          <span className="text-gray-400 text-xs">–</span>
          <Input
            placeholder="5:30 PM"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onBlur={() => setEndTime((t) => normalizeTime(t))}
            className={`${field('h-9 w-[5.5rem] px-2 text-sm sm:w-24')} text-center`}
          />
        </div>

        {/* How it runs */}
        <div className={`${row} sm:w-[62%]`}>
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
            <SelectTrigger className={field('h-8 w-40 text-xs')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map(f => (
                <SelectItem key={f} value={f}>{f === 'one_off' ? 'One-Off (Pop-Up)' : FREQUENCY_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lineup} onValueChange={setLineup}>
            <SelectTrigger className={field('h-8 w-40 text-xs')}>
              <SelectValue placeholder="Lineup order" />
            </SelectTrigger>
            <SelectContent>
              {LINEUP_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsDates && (
          <div className="mx-auto w-full space-y-1 text-center sm:w-[78%]">
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
                className={field('h-8 text-xs')}
              />
            )}
          </div>
        )}

        {/* Small extras, all optional */}
        <div className={`${row} sm:w-[50%]`}>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0 text-gray-400" />
            <Input placeholder="5 min" value={stageTime} onChange={(e) => setStageTime(e.target.value)} onBlur={() => setStageTime((t) => normalizeSetLength(t))} className={`${field('h-7 w-16 px-1 text-xs')} text-center`} />
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 shrink-0 text-gray-400" />
            <Input placeholder="Free" value={cost} onChange={(e) => setCost(e.target.value)} className={`${field('h-7 w-16 px-1 text-xs')} text-center`} />
          </span>
          <span className="flex items-center gap-1">
            <CircleUser className="h-3 w-3 shrink-0 text-gray-400" />
            <Input placeholder="@host" value={hostInstagram} onChange={(e) => setHostInstagram(e.target.value)} className={`${field('h-7 w-24 text-xs')} text-center`} />
          </span>
        </div>
        <div className="mx-auto w-full sm:w-[50%]">
          <Input
            placeholder="Sign-up: paste a link, or say bucket / in person list"
            value={signUpInstructions}
            onChange={(e) => setSignUpInstructions(e.target.value)}
            className={`${field('h-7 text-xs')} text-center`}
          />
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="mt-2 text-center text-xs text-red-500 leading-tight">
          {Object.values(errors).join(' · ')}
        </p>
      )}

      <div className="mt-2.5 flex justify-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSubmitting}
          className="h-8 px-6 text-sm dark:text-[#07111f]"
        >
          {isSubmitting ? 'Adding...' : '+ Add Mic'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-8 px-4 text-sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}
