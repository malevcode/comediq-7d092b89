import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { type ParsedShow } from "@/utils/showParser";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

interface ParsedShowPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsed: ParsedShow;
  rawInput: string;
  onSaved: () => void;
}

export default function ParsedShowPreview({
  open,
  onOpenChange,
  parsed,
  rawInput,
  onSaved,
}: ParsedShowPreviewProps) {
  const { user } = useAuth();

  const [date, setDate] = useState(parsed.date ?? "");
  const [time, setTime] = useState(parsed.time ?? "");
  const [venue, setVenue] = useState(parsed.venue ?? "");
  const [borough, setBorough] = useState(parsed.borough ?? "");
  const [stageTime, setStageTime] = useState(parsed.stageTime);
  const [rating, setRating] = useState<number>(parsed.rating ?? 7);
  const [hasRating, setHasRating] = useState(parsed.rating !== null);
  const [notes, setNotes] = useState(parsed.notes ?? rawInput);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    if (!date || !venue) {
      toast({ title: "Required fields missing", description: "Date and venue are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const dateTime = time ? new Date(`${date}T${time}`).toISOString() : new Date(date).toISOString();

    const { error } = await supabase.from("profile_custom_shows").insert({
      profile_id: user.id,
      title: venue,
      venue,
      borough: borough || null,
      date: dateTime,
      notes,
      schedule_type: "completed",
      stage_time_minutes: stageTime,
      rating: hasRating ? rating : null,
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      toast({ title: "Error saving show", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Show saved!", description: `${venue} added to your sets.` });
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Confirm Show Details
          </SheetTitle>
          <SheetDescription>
            Review and adjust the parsed details before saving.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Confidence indicators */}
          <div className="flex flex-wrap gap-1.5">
            {parsed.date && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Date</Badge>}
            {parsed.time && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Time</Badge>}
            {parsed.venue && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Venue</Badge>}
            {parsed.stageTime !== 5 && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Stage time</Badge>}
            {parsed.rating !== null && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Rating</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qs-date" className="text-xs">Date</Label>
              <Input
                id="qs-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="qs-time" className="text-xs">Time (optional)</Label>
              <Input
                id="qs-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="qs-venue" className="text-xs">Venue</Label>
            <Input
              id="qs-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Comedy Cellar"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="qs-borough" className="text-xs">Borough</Label>
            <select
              id="qs-borough"
              value={borough}
              onChange={(e) => setBorough(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select borough…</option>
              {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-xs">Stage Time: <span className="font-semibold">{stageTime} min</span></Label>
            <Slider
              min={1}
              max={60}
              step={1}
              value={[stageTime]}
              onValueChange={([v]) => setStageTime(v)}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Rating: <span className="font-semibold">{hasRating ? `${rating}/10` : "none"}</span></Label>
              <button
                className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                onClick={() => setHasRating(!hasRating)}
              >
                {hasRating ? "Remove rating" : "Add rating"}
              </button>
            </div>
            {hasRating && (
              <Slider
                min={1}
                max={10}
                step={0.5}
                value={[rating]}
                onValueChange={([v]) => setRating(v)}
                className="mt-1"
              />
            )}
          </div>

          <div>
            <Label htmlFor="qs-notes" className="text-xs">Notes</Label>
            <Textarea
              id="qs-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 text-sm resize-none"
              placeholder="Optional notes…"
            />
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2 flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !date || !venue}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {saving ? "Saving…" : "Save to My Sets"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
