import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MicFilters, { MicFilters as MicFiltersType } from "@/components/MicFilters";

interface FloatingSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: MicFiltersType;
  onFiltersChange: (filters: MicFiltersType) => void;
  maxCost: number;
  boroughs: string[];
  cities: string[];
  onAddMic: () => void;
}

export default function FloatingSearchBar({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  maxCost,
  boroughs,
  cities,
  onAddMic,
}: FloatingSearchBarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 z-[35]">
      <div className="bg-background/80 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-2.5">
        <div className="flex flex-row gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mics, venues, neighborhoods..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 py-2 text-sm bg-background/60 border-border/50 rounded-xl"
            />
          </div>
          <Button
            onClick={onAddMic}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 px-3 py-2 bg-green-50/80 border-green-300 text-green-700 hover:bg-green-100 rounded-xl"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <MicFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            maxCost={maxCost}
            boroughs={boroughs}
            cities={cities}
          />
        </div>
      </div>
    </div>
  );
}
