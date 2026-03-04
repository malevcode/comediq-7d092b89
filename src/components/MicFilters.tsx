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
      city: "New York",
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
        className={`flex items-center gap-2 text-sm px-4 py-4 relative transition-all ${
          hasActiveFilters 
            ? 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100' 
            : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
        }`}
      >
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters</span>
        {hasActiveFilters && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs flex items-center justify-center">
            <span className="w-1 h-1 bg-white rounded-full"></span>
          </Badge>
        )}
      </Button>

      {showFilters && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden" 
            onClick={() => setShowFilters(false)}
          />
          
          <div className={`
            fixed md:absolute 
            inset-0 md:inset-auto
            md:top-full md:right-0 md:mt-2 
            z-[9999] 
            md:w-80 
            ${showFilters ? 'block' : 'hidden'}
          `}>
            <Card className="h-full md:h-auto md:shadow-lg border-0 md:border rounded-none md:rounded-lg">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg text-foreground">Filter Open Mics</h3>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto">
                  {/* Mic Status Filter */}
                  <div>
                    <label className="text-base font-medium mb-3 block text-foreground">Mic Status</label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(opt => (
                        <Button
                          key={opt.value}
                          onClick={() => onFiltersChange({ ...filters, micStatus: opt.value })}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${(filters.micStatus || 'all') === opt.value ? 'bg-cyan-50 border-cyan-300' : 'border-border'}`}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Filter */}
                  <div>
                    <label className="text-base font-medium mb-3 block text-foreground">Frequency</label>
                    <select
                      value={filters.frequency || 'all'}
                      onChange={(e) => onFiltersChange({ ...filters, frequency: e.target.value as MicFrequency | 'all' })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                    >
                      {FREQUENCY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-foreground">
                      Cost Range: {formatCostValue(filters.costRange[0])} - {formatCostValue(filters.costRange[1])}
                    </label>
                    <div className="px-2">
                      <Slider
                        value={filters.costRange}
                        onValueChange={(value) => onFiltersChange({ ...filters, costRange: value as [number, number] })}
                        max={maxCost}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-3 px-2">
                      <span>Free</span>
                      <span>{formatCostValue(maxCost)}</span>
                    </div>
                  </div>

                  {/* Borough Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-foreground">Borough</label>
                    <select
                      value={filters.borough}
                      onChange={(e) => onFiltersChange({ ...filters, borough: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border border-border rounded-md border-l-4 ${
                        filters.borough === "Manhattan" ? "border-l-cyan-500" :
                        filters.borough === "Brooklyn" ? "border-l-amber-800" :
                        filters.borough === "Queens" ? "border-l-purple-600" :
                        filters.borough === "Bronx" ? "border-l-orange-600" :
                        filters.borough === "Staten Island" ? "border-l-gray-500" :
                        "border-l-gray-400"
                      }`}
                    >
                      {boroughs.map((borough) => (
                        <option key={borough} value={borough}>{borough}</option>
                      ))}
                    </select>
                  </div>

                  {/* City Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-foreground">City</label>
                    <select
                      value={filters.city}
                      onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                    >
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time of Day Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-foreground">Time of Day</label>
                    <div className="space-y-3">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          onClick={() => toggleTimeSlot(slot.id)}
                          variant="outline"
                          size="lg"
                          className={`w-full justify-start text-sm py-3 h-auto relative ${
                            filters.timeOfDay.includes(slot.id)
                              ? 'bg-cyan-50 border-cyan-300 hover:bg-cyan-100'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {filters.timeOfDay.includes(slot.id) && (
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-cyan-500 rounded-sm flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <span className={filters.timeOfDay.includes(slot.id) ? 'ml-8' : 'ml-0'}>
                            {slot.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="lg"
                      className="w-full text-sm py-3"
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
