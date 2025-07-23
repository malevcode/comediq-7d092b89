import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const boroughs = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
];

const BoroughPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select borough" />
    </SelectTrigger>
    <SelectContent>
      {boroughs.map(b => (
        <SelectItem key={b} value={b}>{b}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default BoroughPicker; 