import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { weekdayIndex } from '@/utils/micOccurrences';

export const MAX_MIC_DATES = 12;

interface MicDatePickerProps {
  /** "single" picks one date, "multiple" picks up to MAX_MIC_DATES. */
  mode: 'single' | 'multiple';
  /** Day of the week the mic runs, e.g. "Wednesday". Other weekdays are greyed out. */
  day: string;
  value: Date[];
  onChange: (dates: Date[]) => void;
  placeholder: string;
  invalid?: boolean;
}

const sortDates = (dates: Date[]) => [...dates].sort((a, b) => a.getTime() - b.getTime());

const MicDatePicker = ({ mode, day, value, onChange, placeholder, invalid }: MicDatePickerProps) => {
  const weekday = weekdayIndex(day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabled = (date: Date) => date < today || (weekday !== null && date.getDay() !== weekday);

  const label =
    value.length === 0
      ? placeholder
      : value.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`h-7 w-full justify-start gap-2 px-2 text-xs font-normal ${invalid ? 'border-red-400' : ''}`}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {mode === 'single' ? (
          <Calendar
            mode="single"
            selected={value[0]}
            onSelect={(date) => onChange(date ? [date] : [])}
            disabled={disabled}
            initialFocus
          />
        ) : (
          <Calendar
            mode="multiple"
            max={MAX_MIC_DATES}
            selected={value}
            onSelect={(dates) => onChange(sortDates(dates ?? []))}
            disabled={disabled}
            initialFocus
          />
        )}
        <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
          {weekday === null ? 'Pick a day first to see only those days.' : `Only ${day}s can be picked.`}
          {mode === 'multiple' ? ` Up to ${MAX_MIC_DATES} dates.` : ''}
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default MicDatePicker;
