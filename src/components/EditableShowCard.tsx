import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock, DollarSign, ImagePlus, MapPin, Repeat, Ticket, Trash2, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import VenueAutocomplete, { type VenueLocation } from '@/components/host/VenueAutocomplete';
import MicDatePicker from '@/components/MicDatePicker';
import { REPEAT_LABELS, toIsoDate, type ShowRepeat } from '@/utils/showRecurrence';

const SHOW_TYPES = ['Stand-up', 'Variety', 'Improv', 'Sketch', 'Roast', 'Other'];
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export interface ShowCardData {
  title: string;
  venue_name: string;
  venue_address: string | null;
  borough: string | null;
  show_date: string;
  show_time: string;
  doors_time: string | null;
  ticket_price: string | null;
  ticket_url: string | null;
  instagram_handle: string | null;
  show_type: string | null;
  host_name: string | null;
  description: string | null;
  lineup: string | null;
  repeat: ShowRepeat;
  laughpass_free_ticket: boolean;
  laughpass_ticket_limit: number | null;
  confirm_active_agreed: boolean;
  /** The picked picture, not uploaded yet. The page uploads it on save. */
  imageFile: File | null;
}

interface EditableShowCardProps {
  onSave: (data: ShowCardData) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ghostInput = (extra = '') =>
  `border-0 border-b border-dashed bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-1 ${extra}`;

/**
 * The add-a-show card. Same look and feel as the add-a-mic card, with the
 * questions a show needs: a real calendar date (not a weekday), whether it
 * repeats, a picture, the LaughPass free-ticket offer, and the promise to
 * confirm the show is still on the day before.
 */
export function EditableShowCard({ onSave, onCancel, isSubmitting = false }: EditableShowCardProps) {
  const [title, setTitle] = useState('');
  const [venueQuery, setVenueQuery] = useState('');
  const [venue, setVenue] = useState<VenueLocation | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [showTime, setShowTime] = useState('');
  const [doorsTime, setDoorsTime] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [showType, setShowType] = useState('Stand-up');
  const [description, setDescription] = useState('');
  const [repeat, setRepeat] = useState<ShowRepeat>('none');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [laughpass, setLaughpass] = useState(false);
  const [laughpassLimit, setLaughpassLimit] = useState('5');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const clearError = (key: string) =>
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setErrors((p) => ({ ...p, image: 'Please choose an image file' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((p) => ({ ...p, image: 'That photo is over 15 MB' }));
      return;
    }
    clearError('image');
    setImageFile(file);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Show name required';
    if (!venueQuery.trim()) next.venue = 'Venue required';
    if (dates.length === 0) next.date = 'Pick the date';
    if (!showTime) next.time = 'Start time required';
    // A listing has to give people somewhere to go for anything we are missing.
    if (!instagram.trim() && !ticketUrl.trim()) next.contact = 'Add an Instagram or a ticket link';
    if (laughpass) {
      const limit = Number(laughpassLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) next.limit = 'Free tickets: pick 1 to 100';
    }
    if (!agreed) next.agreed = 'Please agree to confirm the show the day before';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (isSubmitting || !validate()) return;
    const url = ticketUrl.trim();
    onSave({
      title: title.trim(),
      venue_name: venue?.venueName || venueQuery.trim(),
      venue_address: venue?.address || null,
      borough: venue?.borough || null,
      show_date: toIsoDate(dates[0]),
      show_time: showTime,
      doors_time: doorsTime || null,
      ticket_price: ticketPrice.trim() || null,
      ticket_url: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null,
      instagram_handle: instagram.trim() || null,
      show_type: showType || null,
      host_name: null,
      description: description.trim() || null,
      lineup: null,
      repeat,
      laughpass_free_ticket: laughpass,
      laughpass_ticket_limit: laughpass ? Number(laughpassLimit) : null,
      confirm_active_agreed: agreed,
      imageFile,
    });
  };

  const row = 'flex items-center gap-1.5';
  const icon = 'h-3 w-3 shrink-0 text-gray-400';

  return (
    <div className="mb-3 flex w-full flex-col gap-2 overflow-x-hidden rounded-xl border border-l-4 border-green-200/70 border-l-green-500 bg-white/25 p-2.5 ring-1 ring-green-200/50 shadow-[0_30px_100px_rgba(4,20,55,0.18),0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#102a53]/20 dark:ring-white/10">
      <Input
        placeholder="Show name *"
        value={title}
        onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
        className={`mx-auto h-7 max-w-xs text-center text-base font-semibold ${ghostInput(errors.title ? 'border-red-400' : 'border-gray-300')}`}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {/* Left: where and when */}
        <div className="flex flex-col gap-2">
          <div className={row}>
            <MapPin className={icon} />
            <div className="min-w-0 flex-1">
              <VenueAutocomplete
                value={venueQuery}
                onChange={(v) => { setVenueQuery(v); setVenue(null); clearError('venue'); }}
                onSelect={(loc) => { setVenue(loc); setVenueQuery(loc.venueName); clearError('venue'); }}
                error={errors.venue}
              />
            </div>
          </div>
          {venue?.address && <p className="pl-5 text-[11px] text-muted-foreground">{venue.address}</p>}

          <div className={row}>
            <CalendarDays className={icon} />
            <div className="min-w-0 flex-1">
              <MicDatePicker
                mode="single"
                day=""
                hint=""
                value={dates}
                onChange={(d) => { setDates(d); clearError('date'); }}
                placeholder="Pick the date *"
                invalid={Boolean(errors.date)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className={row}>
              <Clock className={icon} />
              <span className="text-[11px] text-muted-foreground">Starts *</span>
              <Input
                type="time"
                value={showTime}
                onChange={(e) => { setShowTime(e.target.value); clearError('time'); }}
                className={`h-6 w-28 text-xs ${ghostInput(errors.time ? 'border-red-400' : 'border-gray-300')}`}
              />
            </span>
            <span className={row}>
              <span className="text-[11px] text-muted-foreground">Doors</span>
              <Input
                type="time"
                value={doorsTime}
                onChange={(e) => setDoorsTime(e.target.value)}
                className={`h-6 w-28 text-xs ${ghostInput('border-gray-300')}`}
              />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={repeat} onValueChange={(v) => setRepeat(v as ShowRepeat)}>
              <SelectTrigger className="h-7 text-xs" aria-label="Does it repeat?">
                <Repeat className="mr-1 h-3 w-3 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REPEAT_LABELS) as ShowRepeat[]).map((r) => (
                  <SelectItem key={r} value={r}>{REPEAT_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={showType} onValueChange={setShowType}>
              <SelectTrigger className="h-7 text-xs" aria-label="Type of show">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOW_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {repeat !== 'none' && (
            <p className="text-[11px] text-muted-foreground">
              We will list the next {repeat === 'weekly' ? '8 weeks' : repeat === 'biweekly' ? '6 shows' : '6 months'} of this show,
              starting with the date you picked.
            </p>
          )}
        </div>

        {/* Right: tickets, picture, promises */}
        <div className="flex flex-col gap-2 rounded-md border border-green-100/70 bg-white/25 p-2 backdrop-blur-2xl dark:border-white/10 dark:bg-[#102a53]/20">
          <div className="grid grid-cols-2 gap-2">
            <span className={row}>
              <DollarSign className={icon} />
              <Input
                placeholder="Price, e.g. $15"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className={`h-6 text-xs ${ghostInput('border-gray-300')}`}
              />
            </span>
            <span className={row}>
              <UserRoundCheck className={icon} />
              <Input
                placeholder="@instagram"
                value={instagram}
                onChange={(e) => { setInstagram(e.target.value); clearError('contact'); }}
                className={`h-6 text-xs ${ghostInput(errors.contact ? 'border-red-400' : 'border-gray-300')}`}
              />
            </span>
          </div>
          <span className={row}>
            <Ticket className={icon} />
            <Input
              placeholder="Ticket link (Eventbrite, Posh, your site)"
              value={ticketUrl}
              onChange={(e) => { setTicketUrl(e.target.value); clearError('contact'); }}
              className={`h-6 flex-1 text-xs ${ghostInput(errors.contact ? 'border-red-400' : 'border-gray-300')}`}
            />
          </span>
          <Textarea
            placeholder="One or two lines about the show (optional)"
            value={description}
            maxLength={280}
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-0 resize-none text-xs"
          />

          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ''; }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Your show" className="h-10 w-10 rounded object-cover" />
            ) : null}
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileInput.current?.click()}>
              <ImagePlus className="mr-1 h-3.5 w-3.5" />
              {imageFile ? 'Change image' : 'Add show image (recommended)'}
            </Button>
            {imageFile && (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Remove image" onClick={() => setImageFile(null)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-md bg-comediq-accent/15 p-2 text-left">
            <Checkbox checked={laughpass} onCheckedChange={(v) => setLaughpass(v === true)} className="mt-0.5" />
            <span className="text-[11px] leading-snug">
              <span className="font-semibold">Offer LaughPass members a free ticket.</span> Fill more seats: LaughPass
              subscribers can claim a free spot at your show. Your ticket link stays up for everyone else.
            </span>
          </label>
          {laughpass && (
            <span className={`${row} pl-6`}>
              <span className="text-[11px] text-muted-foreground">Free tickets per show</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={laughpassLimit}
                onChange={(e) => { setLaughpassLimit(e.target.value); clearError('limit'); }}
                className={`h-6 w-16 text-xs ${ghostInput(errors.limit ? 'border-red-400' : 'border-gray-300')}`}
              />
            </span>
          )}

          <label className="flex cursor-pointer items-start gap-2 text-left">
            <Checkbox checked={agreed} onCheckedChange={(v) => { setAgreed(v === true); clearError('agreed'); }} className="mt-0.5" />
            <span className={`text-[11px] leading-snug ${errors.agreed ? 'text-red-500' : ''}`}>
              I will confirm my show is still happening 1 day before each show, so it stays listed on Comediq.
            </span>
          </label>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="text-[10px] leading-tight text-red-500">{Object.values(errors).join(' · ')}</p>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSubmitting} className="h-8 flex-1 bg-green-600 text-xs text-white hover:bg-green-700">
          {isSubmitting ? 'Submitting...' : 'Submit show'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-8 text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}
