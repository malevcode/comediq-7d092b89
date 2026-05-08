import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import { MicFrequency, SignupMethod, FREQUENCY_LABELS } from '@/types/openMic';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  X, MapPin, DollarSign, Clock, ChevronDown, Calendar,
  CircleUser, ClipboardList, UserRoundCheck,
} from 'lucide-react';

interface EditableMicCardProps {
  onClose: () => void;
  onSubmitted?: () => void;
  userName?: string;
  userId: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCY_OPTIONS: MicFrequency[] = ['weekly', 'one_off', 'bi_weekly', '1st_of_month', '2nd_of_month', '3rd_of_month', '4th_of_month', 'last_of_month', 'custom'];
const SIGNUP_OPTIONS: { value: SignupMethod; label: string }[] = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'online', label: 'Online' },
  { value: 'comediq_slots', label: 'Comediq Slots' },
  { value: 'other', label: 'Other' },
];

// Shared inline input class helpers
const inlineBase = 'bg-transparent border-0 border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-400 w-full';
const inlineTitle = `font-semibold text-base ${inlineBase} placeholder:text-gray-300`;
const inlineMuted = `text-xs text-muted-foreground ${inlineBase} placeholder:text-gray-300`;
const inlinePill = `text-xs ${inlineBase} placeholder:text-gray-300 w-20`;
const inlineArea = `text-xs ${inlineBase} placeholder:text-gray-300 resize-none w-full`;

export default function EditableMicCard({ onClose, onSubmitted, userName, userId }: EditableMicCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Core fields
  const [micName, setMicName] = useState('');
  const [venueQuery, setVenueQuery] = useState('');
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null);
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [stageTime, setStageTime] = useState('');
  const [cost, setCost] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [borough, setBorough] = useState('');
  const [address, setAddress] = useState('');
  const [hosts, setHosts] = useState('');
  const [signUpInstructions, setSignUpInstructions] = useState('');
  const [otherRules, setOtherRules] = useState('');
  const [frequency, setFrequency] = useState<MicFrequency>('weekly');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('in_person');
  const [signupUrl, setSignupUrl] = useState('');

  const [badgeOpen, setBadgeOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVenueSelect = (loc: VenueLocation) => {
    setVenueLocation(loc);
    setBorough(loc.borough || '');
    setNeighborhood(loc.neighborhood || '');
    setAddress(loc.address || '');
    setErrors(p => ({ ...p, venue: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!micName.trim()) e.micName = 'Required';
    if (!venueQuery.trim()) e.venue = 'Required';
    if (!day) e.day = 'Required';
    if (!startTime.trim()) e.startTime = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('open_mics_historical').insert([{
        open_mic: micName.trim(),
        venue_name: venueLocation?.venueName || venueQuery.trim(),
        borough: borough || venueLocation?.borough || null,
        neighborhood: neighborhood || venueLocation?.neighborhood || null,
        location: address || venueLocation?.address || null,
        day,
        start_time: startTime.trim(),
        latest_end_time: endTime.trim() || null,
        stage_time: stageTime.trim() || null,
        cost: cost.trim() || 'Free',
        venue_type: venueLocation?.venueType || null,
        sign_up_instructions: signUpInstructions.trim() || null,
        hosts_organizers: hosts.trim() || null,
        changes_updates: hosts.trim() || null,
        other_rules: otherRules.trim() || null,
        city: venueLocation?.city || 'New York',
        active: true,
        status: 'trial' as const,
        frequency,
        signup_method: signupMethod,
        signup_url: (signupMethod === 'online' || signupMethod === 'other') ? signupUrl.trim() || null : null,
        submission_date: new Date().toISOString(),
        creator_id: userId,
        verification_count: 0,
      }]);

      if (error) throw error;

      // Audit row
      await supabase.from('open_mics_requests').insert([{
        show_title: micName.trim(),
        open_mic: micName.trim(),
        venue_name: venueLocation?.venueName || venueQuery.trim(),
        borough: borough || null,
        neighborhood: neighborhood || null,
        location: address || null,
        date: day,
        time: startTime.trim(),
        city: venueLocation?.city || 'New York',
        user_id: userId,
        frequency,
        signup_method: signupMethod,
        signup_url: signupUrl.trim() || null,
        reviewed: true,
        status: 'approved',
      }]);

      toast({ title: 'Mic added!', description: "It's now live on the site." });
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      queryClient.invalidateQueries({ queryKey: ['userCreatedMics'] });
      onSubmitted?.();
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add mic.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full bg-white border rounded-xl shadow-md p-2.5 gap-2 md:gap-3 border-l-4 border-l-emerald-400 mb-3">

      {/* LEFT: name, venue, day/host */}
      <div className="flex-1 min-w-0 text-center">

        {/* NEWMIC badge */}
        <Collapsible open={badgeOpen} onOpenChange={setBadgeOpen}>
          <CollapsibleTrigger asChild>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer gap-1 text-[10px] mb-1">
              NEWMIC <ChevronDown className="h-2.5 w-2.5" />
            </Badge>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-1">
              1st month on Comediq · added by {userName || 'you'}
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Mic name */}
        <input
          className={inlineTitle + (errors.micName ? ' border-red-400' : '')}
          placeholder="[Mic Name]"
          value={micName}
          onChange={e => { setMicName(e.target.value); setErrors(p => ({ ...p, micName: '' })); }}
        />
        {errors.micName && <p className="text-[10px] text-red-500 mt-0.5">{errors.micName}</p>}

        {/* Venue autocomplete */}
        <div className="mt-1">
          <VenueAutocomplete
            value={venueQuery}
            onChange={v => { setVenueQuery(v); setErrors(p => ({ ...p, venue: '' })); }}
            onSelect={handleVenueSelect}
            error={errors.venue}
          />
        </div>

        {/* Day + Host */}
        <div className="flex items-center gap-2 mt-1 justify-center flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <Select value={day} onValueChange={v => { setDay(v); setErrors(p => ({ ...p, day: '' })); }}>
              <SelectTrigger className={`h-6 text-xs w-28 border-0 border-b border-dashed ${errors.day ? 'border-red-400' : 'border-gray-300'} focus:ring-0 bg-transparent px-0 rounded-none`}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CircleUser className="w-3 h-3 flex-shrink-0" />
            <input className={inlineMuted} placeholder="@host" value={hosts} onChange={e => setHosts(e.target.value)} />
          </span>
        </div>
        {errors.day && <p className="text-[10px] text-red-500">{errors.day}</p>}
      </div>

      {/* MID: time / stage / cost */}
      <div className="flex-1 flex flex-col justify-center min-w-0 gap-1">
        <div className="flex flex-row gap-3 items-center justify-center text-xs text-gray-700 bg-muted/30 rounded-md px-2 py-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <input
              className={inlinePill + (errors.startTime ? ' border-red-400' : '')}
              placeholder="7:00 PM"
              value={startTime}
              onChange={e => { setStartTime(e.target.value); setErrors(p => ({ ...p, startTime: '' })); }}
            />
            <span className="text-gray-400">-</span>
            <input className={inlinePill} placeholder="9:00 PM" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <input className={inlinePill} placeholder="5 min" value={stageTime} onChange={e => setStageTime(e.target.value)} />
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <input className={inlinePill} placeholder="Free" value={cost} onChange={e => setCost(e.target.value)} />
          </span>
        </div>
        {errors.startTime && <p className="text-[10px] text-red-500 text-center">{errors.startTime}</p>}
      </div>

      {/* RIGHT: expanded details */}
      <div className="w-full md:flex-[1.2] flex flex-col gap-2">
        <div className="bg-blue-50 border border-blue-100 rounded-md p-2 flex flex-col gap-2">

          {/* Sign-up instructions */}
          <div className="flex flex-row text-xs gap-2">
            <span className="flex items-center gap-1 shrink-0 text-gray-500">
              <UserRoundCheck className="w-3 h-3" /> Sign-Up:
            </span>
            <textarea
              className={inlineArea + ' min-h-[36px]'}
              placeholder="How do comedians sign up?"
              value={signUpInstructions}
              onChange={e => setSignUpInstructions(e.target.value)}
              rows={2}
            />
          </div>

          {/* Address */}
          <div className="flex items-center gap-1 text-xs">
            <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
            <input
              className={inlineMuted}
              placeholder="Street address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* House rules */}
          <div className="text-xs pt-1 border-t border-blue-200">
            <div className="flex items-start gap-1">
              <ClipboardList className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
              <div className="w-full">
                <span className="font-medium text-blue-800">House Rules:</span>
                <textarea
                  className={inlineArea + ' mt-0.5 min-h-[36px]'}
                  placeholder="Any rules or notes for performers?"
                  value={otherRules}
                  onChange={e => setOtherRules(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Frequency + Signup method */}
          <div className="flex gap-2 pt-1 border-t border-blue-200 flex-wrap">
            <Select value={frequency} onValueChange={v => setFrequency(v as MicFrequency)}>
              <SelectTrigger className="h-6 text-[10px] w-28 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map(f => <SelectItem key={f} value={f} className="text-xs">{FREQUENCY_LABELS[f]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={signupMethod} onValueChange={v => setSignupMethod(v as SignupMethod)}>
              <SelectTrigger className="h-6 text-[10px] w-28 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIGNUP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {(signupMethod === 'online' || signupMethod === 'other') && (
              <input
                className="text-[10px] border border-gray-300 rounded px-1.5 h-6 flex-1 min-w-[120px]"
                placeholder="https:// or description"
                value={signupUrl}
                onChange={e => setSignupUrl(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? 'Adding...' : 'Add Mic'}
          </Button>
        </div>
      </div>
    </div>
  );
}
