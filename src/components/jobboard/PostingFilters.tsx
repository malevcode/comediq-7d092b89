import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { PostingFilters } from '@/types/jobBoard';
import { PERFORMER_ROLES, CREW_ROLES, COMPENSATION_TYPES, EXPERIENCE_LEVELS } from '@/config/roleTypes';

interface PostingFiltersProps {
  filters: PostingFilters;
  onFiltersChange: (filters: PostingFilters) => void;
}

const BOROUGHS = [
  { value: 'Manhattan', label: 'Manhattan' },
  { value: 'Brooklyn', label: 'Brooklyn' },
  { value: 'Queens', label: 'Queens' },
  { value: 'Bronx', label: 'Bronx' },
  { value: 'Staten Island', label: 'Staten Island' },
];

export function PostingFilters({ filters, onFiltersChange }: PostingFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof PostingFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="role-category" className="text-xs">Role Category</Label>
          <Select
            value={filters.roleCategory || 'all'}
            onValueChange={(value) => updateFilter('roleCategory', value)}
          >
            <SelectTrigger id="role-category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="performer">Performer</SelectItem>
              <SelectItem value="crew">Crew</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filters.roleCategory === 'performer' && (
          <div className="space-y-1.5">
            <Label htmlFor="role-type" className="text-xs">Role Type</Label>
            <Select
              value={filters.roleType || 'all'}
              onValueChange={(value) => updateFilter('roleType', value)}
            >
              <SelectTrigger id="role-type">
                <SelectValue placeholder="All performer roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All performer roles</SelectItem>
                {PERFORMER_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filters.roleCategory === 'crew' && (
          <div className="space-y-1.5">
            <Label htmlFor="role-type" className="text-xs">Role Type</Label>
            <Select
              value={filters.roleType || 'all'}
              onValueChange={(value) => updateFilter('roleType', value)}
            >
              <SelectTrigger id="role-type">
                <SelectValue placeholder="All crew roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crew roles</SelectItem>
                {CREW_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="borough" className="text-xs">Borough</Label>
          <Select
            value={filters.borough || 'all'}
            onValueChange={(value) => updateFilter('borough', value)}
          >
            <SelectTrigger id="borough">
              <SelectValue placeholder="All boroughs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All boroughs</SelectItem>
              {BOROUGHS.map(borough => (
                <SelectItem key={borough.value} value={borough.value}>
                  {borough.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="compensation" className="text-xs">Compensation</Label>
          <Select
            value={filters.compensationType || 'all'}
            onValueChange={(value) => updateFilter('compensationType', value)}
          >
            <SelectTrigger id="compensation">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {COMPENSATION_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="experience" className="text-xs">Experience Level</Label>
          <Select
            value={filters.experienceLevel || 'all'}
            onValueChange={(value) => updateFilter('experienceLevel', value)}
          >
            <SelectTrigger id="experience">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {EXPERIENCE_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
