import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ParsedMic {
  id: string;
  open_mic: string;
  venue_name: string;
  day: string;
  start_time: string;
  latest_end_time?: string;
  borough?: string;
  neighborhood?: string;
  location?: string;
  venue_type?: string;
  cost?: string;
  stage_time?: string;
  sign_up_instructions?: string;
  hosts?: string;
  instagram_handle?: string;
  notes?: string;
  selected: boolean;
}

interface ParsedMicsTableProps {
  mics: ParsedMic[];
  onUpdate: (id: string, field: keyof ParsedMic, value: any) => void;
  onRemove: (id: string) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export function ParsedMicsTable({ mics, onUpdate, onRemove }: ParsedMicsTableProps) {
  if (mics.length === 0) {
    return <div className="text-muted-foreground text-center py-8">No mics parsed yet.</div>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10">
              <Checkbox
                checked={mics.every(m => m.selected)}
                onCheckedChange={(checked) => {
                  mics.forEach(m => onUpdate(m.id, 'selected', !!checked));
                }}
              />
            </TableHead>
            <TableHead className="min-w-[150px]">Open Mic</TableHead>
            <TableHead className="min-w-[120px]">Venue</TableHead>
            <TableHead className="w-[100px]">Day</TableHead>
            <TableHead className="w-[90px]">Time</TableHead>
            <TableHead className="w-[100px]">Borough</TableHead>
            <TableHead className="min-w-[100px]">Neighborhood</TableHead>
            <TableHead className="w-[80px]">Cost</TableHead>
            <TableHead className="min-w-[100px]">Hosts</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mics.map((mic) => (
            <TableRow key={mic.id} className={mic.selected ? '' : 'opacity-50'}>
              <TableCell>
                <Checkbox
                  checked={mic.selected}
                  onCheckedChange={(checked) => onUpdate(mic.id, 'selected', !!checked)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={mic.open_mic}
                  onChange={(e) => onUpdate(mic.id, 'open_mic', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Mic name"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={mic.venue_name}
                  onChange={(e) => onUpdate(mic.id, 'venue_name', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Venue"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={mic.day}
                  onValueChange={(value) => onUpdate(mic.id, 'day', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={mic.start_time || ''}
                  onChange={(e) => onUpdate(mic.id, 'start_time', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="8:00 PM"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={mic.borough || ''}
                  onValueChange={(value) => onUpdate(mic.id, 'borough', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Borough" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOROUGHS.map(borough => (
                      <SelectItem key={borough} value={borough}>{borough}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={mic.neighborhood || ''}
                  onChange={(e) => onUpdate(mic.id, 'neighborhood', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Area"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={mic.cost || ''}
                  onChange={(e) => onUpdate(mic.id, 'cost', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Free"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={mic.hosts || ''}
                  onChange={(e) => onUpdate(mic.id, 'hosts', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Host(s)"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(mic.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
