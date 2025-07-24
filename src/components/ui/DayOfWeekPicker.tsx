import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface DayOfWeekPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DayOfWeekPicker: React.FC<DayOfWeekPickerProps> = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-40">
      <SelectValue placeholder="Select day" />
    </SelectTrigger>
    <SelectContent>
      {days.map(day => (
        <SelectItem key={day} value={day}>{day}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default DayOfWeekPicker; 