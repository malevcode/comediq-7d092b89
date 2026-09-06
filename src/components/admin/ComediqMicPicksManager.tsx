import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ExternalLink, Loader2, Save, Search, Sparkles, Trash2, Trophy } from 'lucide-react';
import { CanvaAutomationWorkflow, requestCanvaAutomationRun } from '@/api/admin';
import { supabase } from '@/integrations/supabase/client';
import { OpenMic } from '@/types/openMic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type PickType = 'daily' | 'weekly_top';
type PickStatus = 'planned' | 'posted' | 'skipped';
type GeneratedLink = { label: string; url: string };

interface ComediqMicPick {
  id: string;
  pick_type: PickType;
  feature_date: string;
  rank: number;
  mic_unique_identifier: string;
  mic_snapshot: Record<string, unknown>;
  headline: string | null;
  caption: string | null;
  notes: string | null;
  status: PickStatus;
  created_at: string;
  updated_at: string;
}

interface ComediqMicPicksManagerProps {
  mics: OpenMic[];
  today: string;
}

function getWeekStartSundayNY(today: string) {
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

function getMonthSlug(date: string) {
  return date.slice(0, 7);
}

function canvaAutomationWorkflowUrl(workflow: CanvaAutomationWorkflow) {
  return `https://github.com/xq675/comediq-canva-automation/actions/workflows/${workflow}`;
}

function canvaAutomationFolderUrl(path: string) {
  return `https://github.com/xq675/comediq-canva-automation/tree/main/${path.split('/').map(encodeURIComponent).join('/')}`;
}

function getCanvaGeneratedLinks(workflow: CanvaAutomationWorkflow, inputs: Record<string, string>): GeneratedLink[] {
  if (workflow === 'generate_motd_post.yaml') {
    const date = inputs.date;
    return [
      { label: 'MOTD blue/cream assets', url: canvaAutomationFolderUrl(`motd-posts/${date}-blue-cream`) },
      { label: 'MOTD gradient assets', url: canvaAutomationFolderUrl(`motd-posts/${date}-gradient`) },
    ];
  }

  if (workflow === 'generate_motw_posts.yaml') {
    const week = inputs.week;
    return [
      { label: 'MOTW blue/cream assets', url: canvaAutomationFolderUrl(`motw-posts/${week}-blue-cream`) },
      { label: 'MOTW gradient assets', url: canvaAutomationFolderUrl(`motw-posts/${week}-gradient`) },
    ];
  }

  return [
    { label: 'Monthly mics list blue/cream assets', url: canvaAutomationFolderUrl(`monthly-open-mics-list/${inputs.month}-blue-cream`) },
    { label: 'Monthly mics list gradient assets', url: canvaAutomationFolderUrl(`monthly-open-mics-list/${inputs.month}-gradient`) },
  ];
}

function mergeGeneratedLinks(primary: GeneratedLink[] | undefined, fallback: GeneratedLink[]) {
  const byUrl = new Map<string, GeneratedLink>();
  for (const link of [...(primary || []), ...fallback]) {
    byUrl.set(link.url, link);
  }
  return Array.from(byUrl.values());
}

function makeMicSnapshot(mic: OpenMic) {
  return {
    uniqueIdentifier: mic.uniqueIdentifier,
    openMic: mic.openMic,
    venueName: mic.venueName,
    day: mic.day,
    startTime: mic.startTime,
    latestEndTime: mic.latestEndTime,
    borough: mic.borough,
    neighborhood: mic.neighborhood,
    location: mic.location,
    cost: mic.cost,
    stageTime: mic.stageTime,
    signUpInstructions: mic.signUpInstructions,
    hosts: mic.hosts,
    status: mic.status,
    frequency: mic.frequency,
    signupEnabled: mic.signupEnabled,
    slotsEnabled: mic.slotsEnabled,
  };
}

export function ComediqMicPicksManager({ mics, today }: ComediqMicPicksManagerProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const currentWeekStart = useMemo(() => getWeekStartSundayNY(today), [today]);
  const [pickType, setPickType] = useState<PickType>('daily');
  const [featureDate, setFeatureDate] = useState(today);
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [rank, setRank] = useState(1);
  const [status, setStatus] = useState<PickStatus>('planned');
  const [headline, setHeadline] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMicId, setSelectedMicId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dispatchingWorkflow, setDispatchingWorkflow] = useState<string | null>(null);
  const [latestCanvaRun, setLatestCanvaRun] = useState<{
    label: string;
    workflowUrl?: string;
    generatedLinks: GeneratedLink[];
  } | null>(null);

  const activeFeatureDate = pickType === 'daily' ? featureDate : weekStart;
  const isDailyPick = pickType === 'daily';
  const selectedMic = mics.find((mic) => mic.uniqueIdentifier === selectedMicId);

  const picks = useQuery({
    queryKey: ['admin-comediq-mic-picks', pickType, activeFeatureDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('comediq_mic_picks')
        .select('*')
        .eq('pick_type', pickType)
        .eq('feature_date', activeFeatureDate)
        .order('rank', { ascending: true });

      if (error) throw error;
      return (data || []) as ComediqMicPick[];
    },
  });

  const filteredMics = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return mics
      .filter((mic) =>
        mic.openMic.toLowerCase().includes(q)
        || mic.venueName?.toLowerCase().includes(q)
        || mic.neighborhood?.toLowerCase().includes(q)
        || mic.borough?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [mics, search]);

  const savePick = async () => {
    if (!selectedMic) {
      toast({ title: 'Choose a mic', description: 'Search for and select a mic first.', variant: 'destructive' });
      return;
    }

    const normalizedRank = pickType === 'daily' ? 1 : Math.max(1, Number(rank) || 1);
    const payload = {
      pick_type: pickType,
      feature_date: activeFeatureDate,
      rank: normalizedRank,
      mic_unique_identifier: selectedMic.uniqueIdentifier,
      mic_snapshot: makeMicSnapshot(selectedMic),
      headline: isDailyPick ? headline.trim() || null : null,
      caption: isDailyPick ? caption.trim() || null : null,
      notes: isDailyPick ? notes.trim() || null : null,
      status,
    };

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('comediq_mic_picks')
        .upsert(payload, { onConflict: 'pick_type,feature_date,rank' });

      if (error) throw error;

      toast({
        title: pickType === 'daily' ? 'Daily mic saved' : 'Weekly top mic saved',
        description: pickType === 'daily'
          ? `${selectedMic.openMic} is planned for ${activeFeatureDate}.`
          : `${selectedMic.openMic} is ranked #${normalizedRank} for week of ${activeFeatureDate}.`,
      });

      setSearch('');
      setSelectedMicId('');
      setHeadline('');
      setCaption('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['admin-comediq-mic-picks'] });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Could not save this pick.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePick = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await (supabase as any)
        .from('comediq_mic_picks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Pick removed' });
      qc.invalidateQueries({ queryKey: ['admin-comediq-mic-picks'] });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Could not remove this pick.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const dispatchCanvaAutomation = async (
    label: string,
    workflow: CanvaAutomationWorkflow,
    inputs: Record<string, string>,
  ) => {
    setDispatchingWorkflow(workflow);
    try {
      const result = await requestCanvaAutomationRun(workflow, inputs);
      const expectedLinks = getCanvaGeneratedLinks(workflow, inputs);
      setLatestCanvaRun({
        label,
        workflowUrl: result?.workflowUrl || canvaAutomationWorkflowUrl(workflow),
        generatedLinks: mergeGeneratedLinks(result?.generatedLinks, expectedLinks),
      });
      toast({
        title: 'Canva automation started',
        description: `${label} is running in GitHub Actions.`,
      });
    } catch (error: any) {
      toast({
        title: 'Canva automation failed',
        description: error?.message || `Could not start ${label}.`,
        variant: 'destructive',
      });
    } finally {
      setDispatchingWorkflow(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-blue-500" />
          Comediq Mic Picks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Pick type</Label>
            <Select value={pickType} onValueChange={(value) => setPickType(value as PickType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily mic</SelectItem>
                <SelectItem value="weekly_top">Weekly top mic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{isDailyPick ? 'Posting date' : 'Week starts Sunday'}</Label>
            <Input
              type="date"
              value={isDailyPick ? featureDate : weekStart}
              onChange={(e) => (isDailyPick ? setFeatureDate(e.target.value) : setWeekStart(e.target.value))}
              className="h-9"
            />
          </div>

          {pickType === 'weekly_top' && (
            <div className="space-y-1">
              <Label className="text-xs">Rank</Label>
              <Input
                type="number"
                min={1}
                value={rank}
                onChange={(e) => setRank(Math.max(1, Number(e.target.value) || 1))}
                className="h-9"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PickStatus)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Mic</Label>
          {selectedMic ? (
            <div className="flex items-center justify-between gap-2 rounded-md border p-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selectedMic.openMic}</p>
                <p className="truncate text-xs text-muted-foreground">{selectedMic.venueName} · {selectedMic.day}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedMicId('')}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search mic by name, venue, neighborhood..."
                  className="pl-8"
                />
              </div>
              {filteredMics.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                  {filteredMics.map((mic) => (
                    <button
                      key={mic.uniqueIdentifier}
                      type="button"
                      onClick={() => {
                        setSelectedMicId(mic.uniqueIdentifier);
                        setSearch('');
                      }}
                      className="flex w-full flex-col px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-semibold">{mic.openMic}</span>
                      <span className="text-xs text-muted-foreground">{mic.venueName} · {mic.day}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {isDailyPick && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Headline</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Optional short title" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Caption</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional social caption" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes" rows={3} />
            </div>
          </>
        )}

        {!isDailyPick && (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Weekly top mic posters use the selected mic, week start, rank, and status. Headline, caption, and notes are daily-only fields.
          </div>
        )}

        <Button type="button" onClick={savePick} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Pick
        </Button>

        <div className="rounded-md border p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Canva Posts
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatchCanvaAutomation(
                'Mic of the day post',
                'generate_motd_post.yaml',
                { date: featureDate },
              )}
              disabled={dispatchingWorkflow !== null}
            >
              {dispatchingWorkflow === 'generate_motd_post.yaml'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Sparkles className="h-4 w-4" />}
              Mic of the Day
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatchCanvaAutomation(
                'MOTW posts',
                'generate_motw_posts.yaml',
                { week: weekStart },
              )}
              disabled={dispatchingWorkflow !== null}
            >
              {dispatchingWorkflow === 'generate_motw_posts.yaml'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trophy className="h-4 w-4" />}
              MOTW
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatchCanvaAutomation(
                'Monthly open mics list posts',
                'generate_monthly_open_mics_list_posts.yaml',
                { month: getMonthSlug(featureDate) },
              )}
              disabled={dispatchingWorkflow !== null}
            >
              {dispatchingWorkflow === 'generate_monthly_open_mics_list_posts.yaml'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CalendarDays className="h-4 w-4" />}
              Monthly Mics List
            </Button>
          </div>
          {latestCanvaRun && (
            <div className="mt-3 rounded-md bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {latestCanvaRun.label} links will work after the GitHub Action finishes.
              </p>
              <div className="flex flex-wrap gap-2">
                {latestCanvaRun.workflowUrl && (
                  <Button type="button" size="sm" variant="secondary" asChild>
                    <a href={latestCanvaRun.workflowUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Workflow Runs
                    </a>
                  </Button>
                )}
                {latestCanvaRun.generatedLinks.map((link) => (
                  <Button key={link.url} type="button" size="sm" variant="outline" asChild>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      {link.label}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4" />
            {pickType === 'daily' ? `Daily pick for ${activeFeatureDate}` : `Weekly top mics for week of ${activeFeatureDate}`}
          </div>

          {picks.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading picks...
            </div>
          ) : (picks.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No picks saved for this date yet.</p>
          ) : (
            <div className="space-y-2">
              {(picks.data || []).map((pick) => {
                const mic = mics.find((m) => m.uniqueIdentifier === pick.mic_unique_identifier);
                const snapshot = pick.mic_snapshot || {};
                const name = mic?.openMic || String(snapshot.openMic || pick.mic_unique_identifier);
                const venue = mic?.venueName || String(snapshot.venueName || '');
                return (
                  <div key={pick.id} className="flex items-start justify-between gap-2 rounded-md border p-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        #{pick.rank} {name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {venue} · {pick.status}
                      </p>
                      {isDailyPick && pick.headline && <p className="mt-1 text-xs">{pick.headline}</p>}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePick(pick.id)}
                      disabled={deletingId === pick.id}
                    >
                      {deletingId === pick.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
