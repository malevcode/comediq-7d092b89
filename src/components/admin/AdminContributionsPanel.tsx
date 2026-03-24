import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AdminContributionsPanel() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [creatorId, setCreatorId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'date' | 'user'>('date');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleDeleteByDate = () => {
    if (!startDate || !endDate) {
      toast({ title: 'Select both dates', variant: 'destructive' });
      return;
    }
    setDeleteMode('date');
    setConfirmOpen(true);
  };

  const handleDeleteByUser = () => {
    if (!creatorId.trim()) {
      toast({ title: 'Enter a user ID', variant: 'destructive' });
      return;
    }
    setDeleteMode('user');
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    setLoading(true);
    setConfirmOpen(false);
    try {
      let query = supabase
        .from('open_mics_historical')
        .delete()
        .eq('status', 'trial');

      if (deleteMode === 'date' && startDate && endDate) {
        query = query
          .gte('submission_date', startDate.toISOString())
          .lte('submission_date', endDate.toISOString());
      } else if (deleteMode === 'user') {
        query = query.eq('creator_id', creatorId.trim());
      }

      const { error, count } = await query;

      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      } else {
        const msg = `Deleted trial mics${deleteMode === 'date' ? ` from ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}` : ` by user ${creatorId.slice(0, 8)}...`}`;
        setLastResult(msg);
        toast({ title: 'Done', description: msg });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delete Trial Mics by Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div>
              <Label className="text-xs">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal h-9", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal h-9", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button onClick={handleDeleteByDate} variant="destructive" size="sm" disabled={loading || !startDate || !endDate}>
            {loading && deleteMode === 'date' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
            Delete Trial Mics in Range
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delete Trial Mics by Creator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Creator User ID</Label>
            <Input placeholder="Paste user UUID" value={creatorId} onChange={(e) => setCreatorId(e.target.value)} className="h-9 max-w-sm" />
          </div>
          <Button onClick={handleDeleteByUser} variant="destructive" size="sm" disabled={loading || !creatorId.trim()}>
            {loading && deleteMode === 'user' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
            Delete All Trial Mics by This User
          </Button>
        </CardContent>
      </Card>

      {lastResult && (
        <p className="text-sm text-muted-foreground">{lastResult}</p>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'date'
                ? `This will permanently delete all trial-status mics submitted between ${startDate ? format(startDate, 'PP') : '?'} and ${endDate ? format(endDate, 'PP') : '?'}.`
                : `This will permanently delete all trial-status mics created by user ${creatorId.slice(0, 8)}...`}
              {' '}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
