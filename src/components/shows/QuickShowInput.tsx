import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Zap, FileText } from "lucide-react";
import { parseShow, type ParsedShow, type VenueEntry } from "@/utils/showParser";
import { supabase } from "@/integrations/supabase/client";
import ParsedShowPreview from "./ParsedShowPreview";

interface QuickShowInputProps {
  onSaved: () => void;
}

export default function QuickShowInput({ onSaved }: QuickShowInputProps) {
  const [text, setText] = useState("");
  const [venues, setVenues] = useState<VenueEntry[]>([]);
  const [parsed, setParsed] = useState<ParsedShow | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("open_mics_historical")
      .select("venue_name, borough")
      .eq("active", true)
      .then(({ data }) => {
        if (data) setVenues(data as VenueEntry[]);
      });
  }, []);

  const handleParse = () => {
    if (!text.trim()) return;
    const result = parseShow(text, venues);
    setParsed(result);
    setPreviewOpen(true);
  };

  const handleSaved = () => {
    setPreviewOpen(false);
    setParsed(null);
    setText("");
    onSaved();
  };

  return (
    <>
      <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50/60 to-amber-50/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Quick Add
          </CardTitle>
          <CardDescription className="text-xs">
            Type naturally: "Last night Comedy Cellar 7 min killed it"
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Last night Comedy Cellar 5 min 8/10&#10;Saturday The Stand 8pm 7 min bombed'
            rows={2}
            className="text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleParse();
            }}
          />
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleParse}
              disabled={!text.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Parse &amp; Preview
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-500"
              onClick={() => setText("")}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Supports: dates (last night / Monday / 12/28), venues, "5 min", "8/10", "killed it"
          </p>
        </CardContent>
      </Card>

      {parsed && (
        <ParsedShowPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          parsed={parsed}
          rawInput={text}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
