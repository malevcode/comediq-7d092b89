import { useState, useEffect, useRef } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export interface MicFilters {
  costRange: [number, number];
  timeOfDay: string[];
  borough: string;
}

interface MicFiltersProps {
  filters: MicFilters;
  onFiltersChange: (filters: MicFilters) => void;
  maxCost: number;
  boroughs: string[];
}

export default function MicFilters({ filters, onFiltersChange, maxCost, boroughs }: MicFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filters when clicking outside
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
    if (value <= 5) return `$${value}`;
    if (value <= 10) return `$${value}`;
    // For drink values, we'll use a simple mapping
    if (value <= 15) return "1 drink";
    if (value <= 20) return "2 drinks";
    return `$${value}`;
  };

  const toggleTimeSlot = (timeSlotId: string) => {
    const newTimeSlots = filters.timeOfDay.includes(timeSlotId)
      ? filters.timeOfDay.filter(id => id !== timeSlotId)
      : [...filters.timeOfDay, timeSlotId];
    
    onFiltersChange({
      ...filters,
      timeOfDay: newTimeSlots
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      costRange: [0, maxCost],
      timeOfDay: [],
      borough: "All",
    });
  };

  const hasActiveFilters = filters.costRange[0] > 0 || filters.costRange[1] < maxCost || filters.timeOfDay.length > 0 || filters.borough !== "All";

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
          {/* Mobile overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden" 
            onClick={() => setShowFilters(false)}
          />
          
          {/* Filter panel */}
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
                  <h3 className="font-semibold text-lg text-gray-900">Filter Open Mics</h3>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 space-y-8">
                  {/* Cost Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-gray-900">
                      Cost Range: {formatCostValue(filters.costRange[0])} - {formatCostValue(filters.costRange[1])}
                    </label>
                    <div className="px-2">
                      <Slider
                        value={filters.costRange}
                        onValueChange={(value) => onFiltersChange({ ...filters, costRange: value as [number, number] })}
                        max={maxCost}
                        min={0}
                        step={1}
                        className="w-full [&_.range-slider]:h-2 [&_.range-slider]:rounded-full [&_.range-slider]:bg-orange-200 [&_.range-fill]:bg-orange-500 [&_.range-thumb]:h-6 [&_.range-thumb]:w-6 [&_.range-thumb]:bg-white [&_.range-thumb]:border-2 [&_.range-thumb]:border-orange-500 [&_.range-thumb]:shadow-lg"
                        style={{
                          "--slider-track-color": "rgb(254 215 170)",
                          "--slider-range-color": "rgb(249 115 22)",
                          "--slider-thumb-color": "white",
                        } as any}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-3 px-2">
                      <span>Free</span>
                      <span>{formatCostValue(maxCost)}</span>
                    </div>
                  </div>

                  {/* Borough Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-gray-900">Borough</label>
                    <select
                      value={filters.borough}
                      onChange={(e) => onFiltersChange({ ...filters, borough: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md border-l-4 ${
                        filters.borough === "Manhattan" ? "border-l-cyan-500" :
                        filters.borough === "Brooklyn" ? "border-l-amber-800" :
                        filters.borough === "Queens" ? "border-l-purple-600" :
                        filters.borough === "Bronx" ? "border-l-orange-600" :
                        filters.borough === "Staten Island" ? "border-l-gray-500" :
                        "border-l-gray-400"
                      }`}
                    >
                      {boroughs.map((borough) => (
                        <option key={borough} value={borough}>
                          {borough}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time of Day Filter */}
                  <div>
                    <label className="text-base font-medium mb-4 block text-gray-900">Time of Day</label>
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
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
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

                  {/* Sort By Filter */}
                  {/* <div>
                    <label className="text-base font-medium mb-4 block text-gray-900">Sort By</label>
                    <div className="space-y-3">
                      <Button
                        onClick={() => onFiltersChange({ ...filters, sortBy: 'upcoming' })}
                        variant="outline"
                        size="lg"
                        className="w-full justify-start text-sm py-3 h-auto relative bg-cyan-50 border-cyan-300 hover:bg-cyan-100"
                      >
                        <span>
                          Upcoming (Next)
                        </span>
                      </Button>
                    </div>
                  </div> */}
                </div>

                {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="lg"
                      className="w-full text-sm py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
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