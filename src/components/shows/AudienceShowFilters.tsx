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
    <div className="space-y-3 mb-6 rounded-xl bg-[#102a53]/70 p-3 text-white shadow-[0_12px_38px_rgba(2,10,30,0.24)] backdrop-blur-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/45 w-4 h-4" />
        <Input
          placeholder="Search shows, venues, comedians..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-white/12 bg-white/10 text-white placeholder:text-white/45 focus-visible:ring-[#8ec5ff]/45"
        />
      </div>
      
      <div className="flex gap-2">
        <Select value={borough} onValueChange={onBoroughChange}>
          <SelectTrigger className="flex-1 border-white/12 bg-white/10 text-white">
            <SelectValue placeholder="Borough" />
          </SelectTrigger>
          <SelectContent className="border-white/12 bg-[#102a53] text-white z-50">
            {boroughs.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={showType} onValueChange={onShowTypeChange}>
          <SelectTrigger className="flex-1 border-white/12 bg-white/10 text-white">
            <SelectValue placeholder="Show Type" />
          </SelectTrigger>
          <SelectContent className="border-white/12 bg-[#102a53] text-white z-50">
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
