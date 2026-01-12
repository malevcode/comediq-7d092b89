import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface AudienceShowFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  borough: string;
  onBoroughChange: (value: string) => void;
  showType: string;
  onShowTypeChange: (value: string) => void;
}

const boroughs = [
  { value: 'all', label: 'All Boroughs' },
  { value: 'Manhattan', label: 'Manhattan' },
  { value: 'Brooklyn', label: 'Brooklyn' },
  { value: 'Queens', label: 'Queens' },
  { value: 'Bronx', label: 'Bronx' },
  { value: 'Staten Island', label: 'Staten Island' },
];

const showTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'Stand-up', label: 'Stand-up' },
  { value: 'Variety', label: 'Variety' },
  { value: 'Roast', label: 'Roast' },
  { value: 'Improv', label: 'Improv' },
  { value: 'Sketch', label: 'Sketch' },
  { value: 'Storytelling', label: 'Storytelling' },
];

export function AudienceShowFilters({
  searchTerm,
  onSearchChange,
  borough,
  onBoroughChange,
  showType,
  onShowTypeChange,
}: AudienceShowFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search shows, venues, comedians..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={borough} onValueChange={onBoroughChange}>
        <SelectTrigger className="w-full sm:w-[160px] bg-background">
          <SelectValue placeholder="Borough" />
        </SelectTrigger>
        <SelectContent className="bg-background border">
          {boroughs.map((b) => (
            <SelectItem key={b.value} value={b.value}>
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={showType} onValueChange={onShowTypeChange}>
        <SelectTrigger className="w-full sm:w-[160px] bg-background">
          <SelectValue placeholder="Show Type" />
        </SelectTrigger>
        <SelectContent className="bg-background border">
          {showTypes.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
