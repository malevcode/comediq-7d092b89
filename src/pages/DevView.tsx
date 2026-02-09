import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Column definitions — order matches the plan
const COLUMNS = [
  { key: "day", label: "Day", width: "w-20" },
  { key: "start_time", label: "Start", width: "w-20" },
  { key: "latest_end_time", label: "End", width: "w-20" },
  { key: "open_mic", label: "Name", width: "w-40" },
  { key: "venue_name", label: "Venue", width: "w-36" },
  { key: "borough", label: "Borough", width: "w-24" },
  { key: "neighborhood", label: "Neighborhood", width: "w-28" },
  { key: "location", label: "Address", width: "w-44" },
  { key: "city", label: "City", width: "w-24" },
  { key: "venue_type", label: "Type", width: "w-24" },
  { key: "cost", label: "Cost", width: "w-24" },
  { key: "stage_time", label: "Stage Time", width: "w-24" },
  { key: "sign_up_instructions", label: "Sign-Up", width: "w-48" },
  { key: "hosts_organizers", label: "Host(s)", width: "w-32" },
  { key: "changes_updates", label: "IG/Updates", width: "w-36" },
  { key: "other_rules", label: "Other Rules", width: "w-36" },
  { key: "last_verified", label: "Last Verified", width: "w-28" },
] as const;

type ColumnKey = typeof COLUMNS[number]["key"];

interface RawMic {
  unique_identifier: string;
  [key: string]: unknown;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const useDevViewMics = () => {
  return useQuery({
    queryKey: ["devViewMics"],
    queryFn: async (): Promise<RawMic[]> => {
      const { data, error } = await supabase
        .from("open_mics_historical")
        .select("unique_identifier, day, start_time, latest_end_time, open_mic, venue_name, borough, neighborhood, location, city, venue_type, cost, stage_time, sign_up_instructions, hosts_organizers, changes_updates, other_rules, last_verified, active")
        .eq("active", true);

      if (error) throw error;
      return (data || []) as RawMic[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

const DevView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: mics = [], isLoading, error } = useDevViewMics();

  // Filters
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("__all__");
  const [boroughFilter, setBoroughFilter] = useState("__all__");

  // Editing state
  const [editingCell, setEditingCell] = useState<{ id: string; col: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingCell, setSavingCell] = useState<{ id: string; col: ColumnKey } | null>(null);
  const [savedCell, setSavedCell] = useState<{ id: string; col: ColumnKey } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // Unique filter options
  const uniqueDays = [...new Set(mics.map(m => String(m.day || "")))].filter(Boolean).sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
  const uniqueBoroughs = [...new Set(mics.map(m => String(m.borough || "").trim()))].filter(Boolean).sort();

  // Filter and search
  const filtered = mics.filter(mic => {
    if (dayFilter !== "__all__" && String(mic.day || "") !== dayFilter) return false;
    if (boroughFilter !== "__all__" && String(mic.borough || "").trim() !== boroughFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return COLUMNS.some(col => String(mic[col.key] || "").toLowerCase().includes(s));
    }
    return true;
  });

  // Sort by day then start time
  const sorted = [...filtered].sort((a, b) => {
    const dayA = DAY_ORDER.indexOf(String(a.day || ""));
    const dayB = DAY_ORDER.indexOf(String(b.day || ""));
    if (dayA !== dayB) return dayA - dayB;
    return String(a.start_time || "").localeCompare(String(b.start_time || ""));
  });

  const startEdit = useCallback((id: string, col: ColumnKey, currentValue: string) => {
    if (!user) return;
    setEditingCell({ id, col });
    setEditValue(currentValue);
  }, [user]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingCell) return;
    const { id, col } = editingCell;

    // Find original value
    const mic = mics.find(m => m.unique_identifier === id);
    const originalValue = String(mic?.[col] || "");
    
    if (editValue === originalValue) {
      cancelEdit();
      return;
    }

    setSavingCell({ id, col });
    setEditingCell(null);

    const { error } = await supabase
      .from("open_mics_historical")
      .update({ [col]: editValue || null })
      .eq("unique_identifier", id);

    if (error) {
      console.error("Save error:", error);
      toast({
        title: "Edit failed",
        description: error.message || "Could not save change. You may not have permission.",
        variant: "destructive",
      });
    } else {
      setSavedCell({ id, col });
      // Update cache optimistically
      queryClient.setQueryData<RawMic[]>(["devViewMics"], (old) =>
        old?.map(m => m.unique_identifier === id ? { ...m, [col]: editValue || null } : m) || []
      );
      setTimeout(() => setSavedCell(null), 1200);
    }

    setSavingCell(null);
    setEditValue("");
  }, [editingCell, editValue, mics, cancelEdit, toast, queryClient]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }, [saveEdit, cancelEdit]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-destructive">
        Failed to load data. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full px-1 pb-20">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 py-2 px-1 sticky top-0 z-30 bg-background">
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search mics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Days</SelectItem>
            {uniqueDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={boroughFilter} onValueChange={setBoroughFilter}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue placeholder="Borough" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Boroughs</SelectItem>
            {uniqueBoroughs.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {sorted.length} mics {!user && "· Log in to edit"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-max min-w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-muted/60">
                <th className="sticky left-0 z-20 bg-muted/90 px-2 py-1 text-left font-semibold border-b border-r w-8 text-muted-foreground">#</th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={`px-2 py-1 text-left font-semibold border-b border-r whitespace-nowrap ${col.width}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((mic, idx) => (
                <tr key={mic.unique_identifier} className="hover:bg-accent/30 border-b">
                  <td className="sticky left-0 z-10 bg-background px-2 py-0.5 text-muted-foreground border-r text-[10px]">
                    {idx + 1}
                  </td>
                  {COLUMNS.map(col => {
                    const cellValue = String(mic[col.key] || "");
                    const isEditing = editingCell?.id === mic.unique_identifier && editingCell?.col === col.key;
                    const isSaving = savingCell?.id === mic.unique_identifier && savingCell?.col === col.key;
                    const isSaved = savedCell?.id === mic.unique_identifier && savedCell?.col === col.key;

                    return (
                      <td
                        key={col.key}
                        className={`px-1 py-0.5 border-r ${col.width} max-h-6 truncate ${
                          user ? "cursor-text" : ""
                        } ${isSaved ? "ring-1 ring-green-500 bg-green-50/50" : ""} ${
                          isSaving ? "opacity-60" : ""
                        }`}
                        onClick={() => !isEditing && startEdit(mic.unique_identifier, col.key, cellValue)}
                        title={cellValue}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="w-full h-5 px-1 text-[11px] border border-primary rounded-sm bg-background outline-none"
                          />
                        ) : isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin inline" />
                        ) : (
                          <span className="block truncate max-w-full">{cellValue}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="text-center py-8 text-muted-foreground">
                    No mics match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DevView;
