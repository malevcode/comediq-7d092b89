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
      <div className="bg-comediq-cream/90 backdrop-blur-xl rounded-2xl shadow-lg border border-comediq-blue/20 p-2.5">
        <div className="flex flex-row gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-comediq-blue/50" />
            <Input
              placeholder="Search mics, venues, neighborhoods..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 py-2 text-sm bg-white/60 border-comediq-blue/20 rounded-xl text-comediq-blue placeholder:text-comediq-blue/40"
            />
          </div>
          <Button
            onClick={onAddMic}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 px-3 py-2 rounded-xl border-comediq-blue/30 bg-comediq-blue text-comediq-cream hover:bg-comediq-blue-dark"
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
