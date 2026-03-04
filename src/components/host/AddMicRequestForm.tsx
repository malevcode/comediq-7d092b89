import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import { X } from 'lucide-react';

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
}

interface AddMicRequestFormProps {
  onSubmit: (data: MicRequestFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * Adds 90 minutes to a time string like "7:00 PM" or "19:00"
 */
function addMinutes(timeStr: string, minutes: number): string {
  const cleaned = timeStr.trim();
  let hours: number, mins: number;

  // Try 12-hour format first (e.g. "7:00 PM")
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    hours = parseInt(match12[1]);
    mins = parseInt(match12[2]);
    const isPM = match12[3].toUpperCase() === 'PM';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    // Try 24-hour format (e.g. "19:00")
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

  // Return in 12-hour format
  const period = newHours >= 12 ? 'PM' : 'AM';
  const displayHour = newHours % 12 || 12;
  return `${displayHour}:${newMins.toString().padStart(2, '0')} ${period}`;
}

const AddMicRequestForm: React.FC<AddMicRequestFormProps> = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const [micName, setMicName] = useState('');
  const [venueQuery, setVenueQuery] = useState('');
  const [venueLocation, setVenueLocation] = useState<VenueLocation | null>(null);
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [cost, setCost] = useState('');
  const [hostInstagram, setHostInstagram] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!micName.trim()) newErrors.micName = 'Mic name is required';
    if (!venueQuery.trim() || !venueLocation) newErrors.venue = 'Select a venue from the dropdown';
    if (!day) newErrors.day = 'Day is required';
    if (!startTime.trim()) newErrors.startTime = 'Start time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting || !validate()) return;

    // Auto-calculate latest_end_time (+90 min from start)
    const autoEndTime = addMinutes(startTime.trim(), 90);

    // Build full form data, auto-filling from venue selection
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
      stage_time: '',
      cost: cost.trim(),
      venue_type: venueLocation?.venueType || '',
      sign_up_instructions: '',
      hosts_organizers: hostInstagram.trim(),
      host_phone: '',
      changes_updates: hostInstagram.trim(),
      other_rules: notes.trim(),
    };

    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Request New Mic
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Venue Autocomplete */}
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Anything else? Sign-up instructions, rules, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit Mic Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMicRequestForm;
