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
    <div className="space-y-3 mb-6 rounded-xl bg-white/55 p-3 text-gray-700 shadow-[0_12px_38px_rgba(2,10,30,0.12)] backdrop-blur-xl dark:bg-[#102a53]/70 dark:text-white dark:shadow-[0_12px_38px_rgba(2,10,30,0.24)]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 dark:text-white/45" />
        <Input
          placeholder="Search shows, venues, comedians..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-0 bg-white/80 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-200 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45 dark:focus-visible:ring-[#8ec5ff]/45"
        />
      </div>
      
      <div className="flex gap-2">
        <Select value={borough} onValueChange={onBoroughChange}>
          <SelectTrigger className="flex-1 border-0 bg-white/80 text-gray-900 data-[placeholder]:text-gray-400 dark:border-white/12 dark:bg-white/10 dark:text-white">
            <SelectValue placeholder="Borough" />
          </SelectTrigger>
          <SelectContent className="z-50 border-gray-200 bg-white text-gray-900 dark:border-white/12 dark:bg-[#102a53] dark:text-white">
            {boroughs.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={showType} onValueChange={onShowTypeChange}>
          <SelectTrigger className="flex-1 border-0 bg-white/80 text-gray-900 data-[placeholder]:text-gray-400 dark:border-white/12 dark:bg-white/10 dark:text-white">
            <SelectValue placeholder="Show Type" />
          </SelectTrigger>
          <SelectContent className="z-50 border-gray-200 bg-white text-gray-900 dark:border-white/12 dark:bg-[#102a53] dark:text-white">
            {showTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
