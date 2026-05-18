import { useState, useEffect, useRef } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MicStatus, MicFrequency, FREQUENCY_LABELS } from "@/types/openMic";

export interface MicFilters {
  costRange: [number, number];
  timeOfDay: string[];
  borough: string;
  city: string;
  frequency?: MicFrequency | 'all';
  micStatus?: MicStatus | 'all';
}

interface MicFiltersProps {
  filters: MicFilters;
  onFiltersChange: (filters: MicFilters) => void;
  maxCost: number;
  boroughs: string[];
  cities: string[];
}

const STATUS_OPTIONS: { value: MicStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified / Legacy' },
  { value: 'trial', label: 'Trial (New)' },
];

const FREQUENCY_OPTIONS: { value: MicFrequency | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value: value as MicFrequency, label })),
];

export default function MicFilters({ filters, onFiltersChange, maxCost, boroughs, cities }: MicFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const timeSlots = [
    { id: "daytime", label: "Daytime (Before 5pm)", hours: [0, 17] },
    { id: "evening", label: "Evening (5-9pm)", hours: [17, 21] },
    { id: "late", label: "Late Night (9pm+)", hours: [21, 24] }
  ];

  const formatCostValue = (value: number) => {
    if (value === 0) return "Free";
    if (value <= 10) return `$${value}`;
    if (value <= 15) return "1 drink";
    if (value <= 20) return "2 drinks";
    return `$${value}`;
  };

  const toggleTimeSlot = (timeSlotId: string) => {
    const newTimeSlots = filters.timeOfDay.includes(timeSlotId)
      ? filters.timeOfDay.filter(id => id !== timeSlotId)
      : [...filters.timeOfDay, timeSlotId];
    onFiltersChange({ ...filters, timeOfDay: newTimeSlots });
  };

  const clearFilters = () => {
    onFiltersChange({
      costRange: [0, maxCost],
      timeOfDay: [],
      borough: "All",
      city: filters.city,
      frequency: 'all',
      micStatus: 'all',
    });
  };

  const hasActiveFilters = filters.costRange[0] > 0 || filters.costRange[1] < maxCost || filters.timeOfDay.length > 0 || filters.borough !== "All" || (filters.frequency && filters.frequency !== 'all') || (filters.micStatus && filters.micStatus !== 'all');

  return (
    <div className="relative" ref={filterRef}>
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        size="sm"
        className={`flex items-center justify-center text-[11px] font-bold px-2 py-1 h-7 relative transition-all ${
          hasActiveFilters 
            ? 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100' 
            : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
        }`}
      >
        <span>Filter</span>
        {hasActiveFilters && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs flex items-center justify-center">
            <span className="w-1 h-1 bg-white rounded-full"></span>
          </Badge>
        )}
      </Button>

      {showFilters && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-50 md:hidden" 
            onClick={() => setShowFilters(false)}
          />
          
          <div className="fixed md:absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto top-20 md:top-full md:right-0 md:mt-2 z-[9999] w-[92vw] max-w-sm md:w-72">
            <Card className="shadow-lg border rounded-lg">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">Filter Open Mics</h3>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Frequency + City Row */}
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="text-xs font-medium mb-1 block text-foreground">Frequency</label>
                      <select
                        value={filters.frequency || 'all'}
                        onChange={(e) => onFiltersChange({ ...filters, frequency: e.target.value as MicFrequency | 'all' })}
                        className="w-auto px-2 py-1 text-xs border border-border rounded-md bg-background"
                      >
                        {FREQUENCY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block text-foreground">City</label>
                      <select
                        value={filters.city}
                        onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
                        className="w-auto px-2 py-1 text-xs border border-border rounded-md bg-background"
                      >
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cost Filter */}
                  <div>
                    <label className="text-xs font-medium mb-2 block text-foreground">
                      Cost: {formatCostValue(filters.costRange[0])} - {formatCostValue(filters.costRange[1])}
                    </label>
                    <div className="px-1">
                      <Slider
                        value={filters.costRange}
                        onValueChange={(value) => onFiltersChange({ ...filters, costRange: value as [number, number] })}
                        max={maxCost}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Borough Filter — NYC only */}
                  {filters.city === "New York" && (
                  <div>
                    <label className="text-xs font-medium mb-1 block text-foreground">Borough</label>
                    <select
                      value={filters.borough}
                      onChange={(e) => onFiltersChange({ ...filters, borough: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background"
                    >
                      {boroughs.map((borough) => (
                        <option key={borough} value={borough}>{borough}</option>
                      ))}
                    </select>
                  </div>
                  )}

                  {/* Time of Day Filter */}
                  <div>
                    <label className="text-xs font-medium mb-1 block text-foreground">Time of Day</label>
                    <div className="grid grid-cols-3 gap-1">
                      {timeSlots.map((slot) => {
                        const active = filters.timeOfDay.includes(slot.id);
                        const short = slot.id === 'daytime' ? 'Day' : slot.id === 'evening' ? 'Eve' : 'Late';
                        return (
                          <Button
                            key={slot.id}
                            onClick={() => toggleTimeSlot(slot.id)}
                            variant="outline"
                            size="sm"
                            className={`text-xs h-7 px-1 ${
                              active
                                ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            {short}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 pt-2 border-t border-border">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-7"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
