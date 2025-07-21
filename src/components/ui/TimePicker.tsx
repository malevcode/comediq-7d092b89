import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const minutes = ['00', '15', '30', '45'];
const ampm = ['AM', 'PM'];

function parseTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (match) {
    return {
      hour: match[1],
      minute: match[2],
      ampm: match[3],
    };
  }
  return { hour: '7', minute: '00', ampm: 'PM' };
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const { hour, minute, ampm: ampmValue } = parseTime(value || '7:00 PM');
  const [open, setOpen] = React.useState(false);

  const handleChange = (h: string, m: string, a: string) => {
    onChange(`${h}:${m} ${a}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-32 justify-start">
          {value || 'Select time'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex gap-2 p-2 w-auto">
        <Select value={hour} onValueChange={h => handleChange(h, minute, ampmValue)}>
          <SelectTrigger className="w-14"><SelectValue placeholder="Hour" /></SelectTrigger>
          <SelectContent>
            {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="self-center">:</span>
        <Select value={minute} onValueChange={m => handleChange(hour, m, ampmValue)}>
          <SelectTrigger className="w-14"><SelectValue placeholder="Min" /></SelectTrigger>
          <SelectContent>
            {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ampmValue} onValueChange={a => handleChange(hour, minute, a)}>
          <SelectTrigger className="w-16"><SelectValue placeholder="AM/PM" /></SelectTrigger>
          <SelectContent>
            {ampm.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  );
};

export default TimePicker; 