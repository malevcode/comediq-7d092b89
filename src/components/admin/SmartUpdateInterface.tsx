import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Sparkles, ArrowRight, Check, AlertTriangle, Plus, Clock, DollarSign, X, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ParsedUpdate {
  action: string;
  venue_name: string;
  day: string;
  old_start_time?: string;
  new_start_time?: string;
  old_cost?: string;
  new_cost?: string;
  stage_time?: string;
  open_mic_name?: string;
  latest_end_time?: string;
  host?: string;
  other_details?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
}

interface MatchedUpdate extends ParsedUpdate {
  matchedMic: any | null;
  confidence: 'exact' | 'fuzzy' | 'none';
  selected: boolean;
  applied?: boolean;
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  update_time: { label: 'Time Change', icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  update_cost: { label: 'Cost Update', icon: DollarSign, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  update_stage_time: { label: 'Stage Time', icon: Clock, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  add_new: { label: 'New Mic', icon: Plus, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  deactivate: { label: 'Deactivate', icon: X, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  update_other: { label: 'Other', icon: Zap, color: 'bg-muted text-muted-foreground' },
};

function normalizeTime(t: string | undefined): string {
  if (!t) return '';
  return t.replace(/\s+/g, ' ').trim().toUpperCase();
}

function fuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nb = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  return na.includes(nb) || nb.includes(na);
}

export function SmartUpdateInterface() {
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input');
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [matchedUpdates, setMatchedUpdates] = useState<MatchedUpdate[]>([]);
  const [allMics, setAllMics] = useState<any[]>([]);
  const [commitProgress, setCommitProgress] = useState(0);

  useEffect(() => {
    supabase.from('open_mics_historical').select('*').then(({ data }) => {
      if (data) setAllMics(data);
    });
  }, []);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-mic-updates', {
        body: { rawText },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const updates: ParsedUpdate[] = data.updates || [];
      if (updates.length === 0) {
        toast({ title: 'No updates found', description: 'AI could not extract any changes from the text.', variant: 'destructive' });
        setParsing(false);
        return;
      }

      // Match against existing mics
      const matched: MatchedUpdate[] = updates.map((u) => {
        let matchedMic: any = null;
        let confidence: 'exact' | 'fuzzy' | 'none' = 'none';

        if (u.action === 'add_new') {
          return { ...u, matchedMic: null, confidence: 'none' as const, selected: true };
        }

        // Try exact match: venue + day + old_start_time
        const exactMatch = allMics.find(
          (m) =>
            m.active &&
            fuzzyMatch(m.venue_name || '', u.venue_name) &&
            (m.day || '').toLowerCase() === (u.day || '').toLowerCase() &&
            normalizeTime(m.start_time) === normalizeTime(u.old_start_time)
        );

        if (exactMatch) {
          return { ...u, matchedMic: exactMatch, confidence: 'exact' as const, selected: true };
        }

        // Fuzzy: venue + day only
        const fuzzy = allMics.find(
          (m) =>
            m.active &&
            fuzzyMatch(m.venue_name || '', u.venue_name) &&
            (m.day || '').toLowerCase() === (u.day || '').toLowerCase()
        );

        if (fuzzy) {
          return { ...u, matchedMic: fuzzy, confidence: 'fuzzy' as const, selected: true };
        }

        return { ...u, matchedMic: null, confidence: 'none' as const, selected: true };
      });

      setMatchedUpdates(matched);
      setStep('preview');
    } catch (err: any) {
      toast({ title: 'Parse failed', description: err.message || 'Could not parse updates.', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const toggleUpdate = (index: number) => {
    setMatchedUpdates((prev) =>
      prev.map((u, i) => (i === index ? { ...u, selected: !u.selected } : u))
    );
  };

  const handleCommit = async () => {
    const selected = matchedUpdates.filter((u) => u.selected && !u.applied);
    if (selected.length === 0) return;

    setCommitting(true);
    setCommitProgress(0);
    let completed = 0;

    for (const update of selected) {
      try {
        if (update.action === 'add_new') {
          const { error } = await supabase.from('open_mics_historical').insert({
            open_mic: update.open_mic_name || `${update.venue_name} ${update.day} Mic`,
            venue_name: update.venue_name,
            day: update.day,
            start_time: update.new_start_time || '',
            cost: update.new_cost || '',
            stage_time: update.stage_time || '',
            latest_end_time: update.latest_end_time || '',
            hosts_organizers: update.host || '',
            active: true,
            status: 'trial',
            last_verified: new Date().toLocaleDateString('en-US'),
          });
          if (error) throw error;
        } else if (update.matchedMic) {
          const dbUpdates: any = {};
          if (update.action === 'update_time' && update.new_start_time) {
            dbUpdates.start_time = update.new_start_time;
          }
          if (update.action === 'update_cost' && update.new_cost) {
            dbUpdates.cost = update.new_cost;
          }
          if (update.action === 'update_stage_time' && update.stage_time) {
            dbUpdates.stage_time = update.stage_time;
          }
          if (update.action === 'deactivate') {
            dbUpdates.active = false;
          }
          if (update.action === 'update_other' && update.field_name && update.new_value) {
            const fieldMap: Record<string, string> = {
              'end_time': 'latest_end_time',
              'host': 'hosts_organizers',
              'cost': 'cost',
              'stage_time': 'stage_time',
              'rules': 'other_rules',
            };
            const dbField = fieldMap[update.field_name] || update.field_name;
            dbUpdates[dbField] = update.new_value;
          }

          dbUpdates.last_verified = new Date().toLocaleDateString('en-US');

          if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase
              .from('open_mics_historical')
              .update(dbUpdates)
              .eq('unique_identifier', update.matchedMic.unique_identifier);
            if (error) throw error;
          }
        }

        // Mark as applied
        setMatchedUpdates((prev) =>
          prev.map((u) => (u === update ? { ...u, applied: true } : u))
        );
      } catch (err: any) {
        console.error('Failed to apply update:', err);
        toast({ title: 'Error', description: `Failed: ${update.venue_name} ${update.day} — ${err.message}`, variant: 'destructive' });
      }

      completed++;
      setCommitProgress(Math.round((completed / selected.length) * 100));
    }

    setCommitting(false);
    setStep('done');
    toast({ title: 'Updates applied!', description: `${completed} change(s) committed to the database.` });
  };

  const handleReset = () => {
    setRawText('');
    setMatchedUpdates([]);
    setStep('input');
    setCommitProgress(0);
  };

  const selectedCount = matchedUpdates.filter((u) => u.selected && !u.applied).length;

  return (
    <div className="space-y-6">
      {/* Input Step */}
      {step === 'input' && (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Smart Update
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste any unstructured message about mic changes — AI will parse it into actionable updates.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`e.g., "Monday 4 PM @ The Buddha Room is now 4:30 PM\nAdd Monday 9 PM 6 Minute Mic @ The Buddha Room ($5)"`}
              className="min-h-[180px] font-mono text-sm"
            />
            <Button
              onClick={handleParse}
              disabled={!rawText.trim() || parsing}
              className="w-full"
              size="lg"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse Updates
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {matchedUpdates.length} Update{matchedUpdates.length !== 1 ? 's' : ''} Found
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Start Over
              </Button>
              <Button
                size="sm"
                onClick={handleCommit}
                disabled={selectedCount === 0 || committing}
              >
                {committing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Apply {selectedCount} Update{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>

          {committing && (
            <Progress value={commitProgress} className="h-2" />
          )}

          <div className="space-y-3">
            {matchedUpdates.map((update, idx) => {
              const config = ACTION_CONFIG[update.action] || ACTION_CONFIG.update_other;
              const Icon = config.icon;

              return (
                <Card
                  key={idx}
                  className={`transition-all ${update.applied ? 'opacity-60 border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''} ${!update.selected ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={update.selected}
                        onCheckedChange={() => toggleUpdate(idx)}
                        disabled={update.applied}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${config.color} border-0 text-xs`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="font-semibold text-sm">{update.venue_name}</span>
                          <span className="text-xs text-muted-foreground">• {update.day}</span>
                          {update.applied && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                              <Check className="w-3 h-3 mr-1" /> Applied
                            </Badge>
                          )}
                        </div>

                        {/* Diff row */}
                        <div className="flex items-center gap-2 text-sm">
                          {update.action === 'update_time' && (
                            <>
                              <span className="line-through text-muted-foreground">{update.old_start_time}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="font-semibold text-primary">{update.new_start_time}</span>
                            </>
                          )}
                          {update.action === 'update_cost' && (
                            <>
                              <span className="line-through text-muted-foreground">{update.old_cost || 'unknown'}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="font-semibold text-primary">{update.new_cost}</span>
                            </>
                          )}
                          {update.action === 'add_new' && (
                            <span className="text-muted-foreground">
                              New mic at {update.new_start_time}
                              {update.stage_time && ` • ${update.stage_time}`}
                              {update.new_cost && ` • ${update.new_cost}`}
                            </span>
                          )}
                          {update.action === 'deactivate' && (
                            <span className="text-destructive">Deactivate this mic</span>
                          )}
                          {update.action === 'update_stage_time' && (
                            <span className="text-muted-foreground">Stage time → {update.stage_time}</span>
                          )}
                          {update.action === 'update_other' && (
                            <>
                              <span className="text-muted-foreground">{update.field_name}:</span>
                              <span className="line-through text-muted-foreground">{update.old_value}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="font-semibold text-primary">{update.new_value}</span>
                            </>
                          )}
                        </div>

                        {/* Match confidence */}
                        <div className="flex items-center gap-1 text-xs">
                          {update.action === 'add_new' ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Will create new record
                            </span>
                          ) : update.confidence === 'exact' ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Exact match: {update.matchedMic?.open_mic}
                            </span>
                          ) : update.confidence === 'fuzzy' ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Fuzzy match: {update.matchedMic?.open_mic} ({update.matchedMic?.start_time})
                            </span>
                          ) : (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> No match found — will skip
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Done Step */}
      {step === 'done' && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold">Updates Applied!</h3>
            <p className="text-sm text-muted-foreground">
              {matchedUpdates.filter((u) => u.applied).length} change(s) committed successfully.
            </p>
            <Button onClick={handleReset} variant="outline">
              Process More Updates
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
