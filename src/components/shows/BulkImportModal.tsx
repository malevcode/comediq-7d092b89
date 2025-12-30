import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Sparkles, Upload, Check, X } from 'lucide-react';
import ParsedShowsTable from './ParsedShowsTable';

interface ParsedShow {
  id: string;
  date: string;
  venue: string;
  borough: string | null;
  stage_time_minutes: number | null;
  notes: string;
  schedule_type: 'completed' | 'upcoming';
  selected: boolean;
}

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export default function BulkImportModal({ open, onOpenChange, onImportComplete }: BulkImportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedShows, setParsedShows] = useState<ParsedShow[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = async () => {
    if (!notes.trim()) {
      toast({ title: 'Please paste your notes first', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-notes', {
        body: { notes }
      });

      if (error) throw error;

      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }

      const shows = (data.shows || []).map((show: any, index: number) => ({
        ...show,
        id: `parsed-${index}-${Date.now()}`,
        selected: true
      }));

      if (shows.length === 0) {
        toast({ title: 'No shows found', description: 'Could not parse any performances from your notes. Try adding more detail.', variant: 'destructive' });
        return;
      }

      setParsedShows(shows);
      setStep('preview');
      toast({ title: `Found ${shows.length} performances!` });
    } catch (error: any) {
      console.error('Parse error:', error);
      toast({ 
        title: 'Error parsing notes', 
        description: error.message || 'Please try again', 
        variant: 'destructive' 
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!user) return;

    const selectedShows = parsedShows.filter(s => s.selected);
    if (selectedShows.length === 0) {
      toast({ title: 'No shows selected', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const showsToInsert = selectedShows.map(show => ({
        profile_id: user.id,
        title: show.venue,
        venue: show.venue,
        borough: show.borough,
        date: show.date ? new Date(show.date).toISOString() : null,
        stage_time_minutes: show.stage_time_minutes,
        notes: show.notes,
        schedule_type: show.schedule_type as 'completed' | 'upcoming'
      }));

      const { error } = await supabase
        .from('profile_custom_shows')
        .insert(showsToInsert);

      if (error) throw error;

      toast({ title: `Imported ${selectedShows.length} shows!` });
      onImportComplete?.();
      handleClose();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ 
        title: 'Error importing shows', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setParsedShows([]);
    setStep('input');
    onOpenChange(false);
  };

  const handleUpdateShow = (id: string, updates: Partial<ParsedShow>) => {
    setParsedShows(shows => 
      shows.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  };

  const handleRemoveShow = (id: string) => {
    setParsedShows(shows => shows.filter(s => s.id !== id));
  };

  const handleToggleAll = (selected: boolean) => {
    setParsedShows(shows => shows.map(s => ({ ...s, selected })));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Bulk Import Shows
          </DialogTitle>
          <DialogDescription>
            {step === 'input' 
              ? 'Paste your Apple Notes or any text with your comedy performances. Our AI will parse them into structured data.'
              : 'Review and edit the parsed shows before importing.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="flex flex-col gap-4 flex-1">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Paste your notes here. Examples:

12/5 Comedy Cellar - 5 min, killed it
Got bumped at The Stand 12/12
Did 10 min at Greenwich Village Comedy Club last Tuesday
1/15/25 - West Side Comedy Club, 7 min set, new crowd work bit
Creek and the Cave Jan 20 - tried new closer, needs work`}
              className="flex-1 min-h-[300px] font-mono text-sm"
            />
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleParse} 
                disabled={isParsing || !notes.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Parse with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {parsedShows.filter(s => s.selected).length} of {parsedShows.length} selected
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggleAll(true)}>
                  <Check className="h-4 w-4 mr-1" /> Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggleAll(false)}>
                  <X className="h-4 w-4 mr-1" /> Deselect All
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <ParsedShowsTable 
                shows={parsedShows}
                onUpdate={handleUpdateShow}
                onRemove={handleRemoveShow}
              />
            </div>

            <div className="flex justify-between gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep('input')}>
                ← Back to Notes
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isImporting || parsedShows.filter(s => s.selected).length === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {parsedShows.filter(s => s.selected).length} Shows
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
