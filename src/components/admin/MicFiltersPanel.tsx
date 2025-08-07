import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { SortAsc, SortDesc, X } from 'lucide-react';
import { format } from 'date-fns';
import { MicFilters } from './hooks/useMicFilters';

interface MicFiltersPanelProps {
  showFilters: boolean;
  filters: MicFilters;
  setFilters: (filters: MicFilters) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

export const MicFiltersPanel = ({
  showFilters,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  resetFilters,
}: MicFiltersPanelProps) => {
  if (!showFilters) return null;

  return (
    <div className="mb-4 p-4 bg-gray-50 border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Borough Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Borough</label>
          <Select value={filters.borough} onValueChange={(value) => setFilters({ ...filters, borough: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Boroughs</SelectItem>
              <SelectItem value="Manhattan">Manhattan</SelectItem>
              <SelectItem value="Brooklyn">Brooklyn</SelectItem>
              <SelectItem value="Queens">Queens</SelectItem>
              <SelectItem value="Bronx">Bronx</SelectItem>
              <SelectItem value="Staten Island">Staten Island</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Day Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Day</label>
          <Select value={filters.day} onValueChange={(value) => setFilters({ ...filters, day: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              <SelectItem value="Monday">Monday</SelectItem>
              <SelectItem value="Tuesday">Tuesday</SelectItem>
              <SelectItem value="Wednesday">Wednesday</SelectItem>
              <SelectItem value="Thursday">Thursday</SelectItem>
              <SelectItem value="Friday">Friday</SelectItem>
              <SelectItem value="Saturday">Saturday</SelectItem>
              <SelectItem value="Sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cost Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Cost</label>
          <Select value={filters.cost} onValueChange={(value) => setFilters({ ...filters, cost: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Costs</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="venue">Venue</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="verified">Last Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Order</label>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full justify-between"
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>

        {/* Reset Filters */}
        <div className="flex items-end">
          <Button variant="outline" onClick={resetFilters} className="w-full">
            <X className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Verified From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {filters.verifiedFrom ? format(filters.verifiedFrom, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.verifiedFrom}
                onSelect={(date) => setFilters({ ...filters, verifiedFrom: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Verified To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {filters.verifiedTo ? format(filters.verifiedTo, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.verifiedTo}
                onSelect={(date) => setFilters({ ...filters, verifiedTo: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.borough !== 'all' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Borough: {filters.borough}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, borough: 'all' })} />
          </Badge>
        )}
        {filters.day !== 'all' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Day: {filters.day}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, day: 'all' })} />
          </Badge>
        )}
        {filters.cost !== 'all' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Cost: {filters.cost}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, cost: 'all' })} />
          </Badge>
        )}
        {filters.verifiedFrom && (
          <Badge variant="secondary" className="flex items-center gap-1">
            From: {format(filters.verifiedFrom, 'MMM d')}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, verifiedFrom: null })} />
          </Badge>
        )}
        {filters.verifiedTo && (
          <Badge variant="secondary" className="flex items-center gap-1">
            To: {format(filters.verifiedTo, 'MMM d')}
            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, verifiedTo: null })} />
          </Badge>
        )}
      </div>
    </div>
  );
}; 