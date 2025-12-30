import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface ParsedShow {
  id: string;
  date: string;
  venue: string;
  borough: string | null;
  stage_time_minutes: number | null;
  notes: string;
  schedule_type: 'completed' | 'upcoming';
  selected: boolean;
}

interface ParsedShowsTableProps {
  shows: ParsedShow[];
  onUpdate: (id: string, updates: Partial<ParsedShow>) => void;
  onRemove: (id: string) => void;
}

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export default function ParsedShowsTable({ shows, onUpdate, onRemove }: ParsedShowsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead className="w-32">Date</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead className="w-32">Borough</TableHead>
          <TableHead className="w-20">Minutes</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shows.map((show) => (
          <TableRow key={show.id} className={!show.selected ? 'opacity-50' : ''}>
            <TableCell>
              <Checkbox 
                checked={show.selected}
                onCheckedChange={(checked) => onUpdate(show.id, { selected: !!checked })}
              />
            </TableCell>
            <TableCell>
              <Input
                type="date"
                value={show.date || ''}
                onChange={(e) => onUpdate(show.id, { date: e.target.value })}
                className="h-8 text-sm"
              />
            </TableCell>
            <TableCell>
              <Input
                value={show.venue || ''}
                onChange={(e) => onUpdate(show.id, { venue: e.target.value })}
                className="h-8 text-sm"
              />
            </TableCell>
            <TableCell>
              <Select 
                value={show.borough || 'none'} 
                onValueChange={(v) => onUpdate(show.id, { borough: v === 'none' ? null : v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Borough" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {BOROUGHS.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                value={show.stage_time_minutes || ''}
                onChange={(e) => onUpdate(show.id, { stage_time_minutes: e.target.value ? parseInt(e.target.value) : null })}
                className="h-8 text-sm w-16"
                min={1}
                max={120}
              />
            </TableCell>
            <TableCell>
              <Input
                value={show.notes || ''}
                onChange={(e) => onUpdate(show.id, { notes: e.target.value })}
                className="h-8 text-sm"
                placeholder="Notes..."
              />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(show.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
