import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

interface AudienceShowFiltersProps {
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

const selectTriggerClass =
  "h-9 border-0 bg-white/80 text-xs text-gray-900 data-[placeholder]:text-gray-400 dark:bg-white/10 dark:text-white";
const selectContentClass =
  "z-[120] border-gray-200 bg-white text-gray-900 dark:border-white/10 dark:bg-[#102a53] dark:text-white";

/**
 * The two show filters live behind one icon button so they never claim a row
 * of their own on the Laugh tab. The dot marks that a filter is narrowing the
 * list while the popover is shut.
 */
export function AudienceShowFilters({
  borough,
  onBoroughChange,
  showType,
  onShowTypeChange,
}: AudienceShowFiltersProps) {
  const activeCount = (borough !== 'all' ? 1 : 0) + (showType !== 'all' ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={activeCount > 0 ? `Filter shows, ${activeCount} active` : 'Filter shows'}
          className="relative h-8 w-8 shrink-0 border-0 bg-white/70 p-0 text-gray-700 hover:bg-white/90 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {activeCount > 0 && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#1a5fb4] dark:bg-[#8ec5ff]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 space-y-2 border-gray-200 bg-white p-2 text-gray-900 dark:border-white/10 dark:bg-[#102a53] dark:text-white"
      >
        <Select value={borough} onValueChange={onBoroughChange}>
          <SelectTrigger className={selectTriggerClass}>
            <SelectValue placeholder="Borough" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {boroughs.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={showType} onValueChange={onShowTypeChange}>
          <SelectTrigger className={selectTriggerClass}>
            <SelectValue placeholder="Show Type" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {showTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  );
}
