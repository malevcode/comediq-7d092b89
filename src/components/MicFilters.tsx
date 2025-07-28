import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export interface MicFilters {
  costRange: [number, number];
  timeOfDay: string[];
}

interface MicFiltersProps {
  filters: MicFilters;
  onFiltersChange: (filters: MicFilters) => void;
  maxCost: number;
}

export default function MicFilters({ filters, onFiltersChange, maxCost }: MicFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

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
      timeOfDay: []
    });
  };

  const hasActiveFilters = filters.costRange[0] > 0 || filters.costRange[1] < maxCost || filters.timeOfDay.length > 0;

  return (
    <div className="relative">
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1 text-xs px-3 py-1 relative"
      >
        <Filter className="h-3 w-3" />
        <span>Filters</span>
        {hasActiveFilters && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-2 w-2 p-0 text-xs">
            <span className="sr-only">Active filters</span>
          </Badge>
        )}
      </Button>

      {showFilters && (
        <Card className="absolute top-full left-0 z-50 mt-2 w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Filter Open Mics</h3>
              <Button
                onClick={() => setShowFilters(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cost Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Cost Range: {formatCostValue(filters.costRange[0])} - {formatCostValue(filters.costRange[1])}
              </label>
              <Slider
                value={filters.costRange}
                onValueChange={(value) => onFiltersChange({ ...filters, costRange: value as [number, number] })}
                max={maxCost}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Free</span>
                <span>{formatCostValue(maxCost)}</span>
              </div>
            </div>

            {/* Time of Day Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Time of Day</label>
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    onClick={() => toggleTimeSlot(slot.id)}
                    variant={filters.timeOfDay.includes(slot.id) ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}