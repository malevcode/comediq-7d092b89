import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventSignups } from '@/hooks/useSignupEvents';
import { format } from 'date-fns';
import { GripVertical, Download, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RunOfShowProps {
  eventId: string;
  eventDate: string;
  totalSpots: number;
}

function SortableSignupItem({ signup, index }: { signup: any; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: signup.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border border-border rounded-md bg-card"
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="font-semibold text-sm text-muted-foreground w-6">#{index + 1}</span>
        <span className="text-foreground text-sm">
          {signup.profiles?.username || signup.guest_name || 'Comedian'}
        </span>
        {signup.guest_name && !signup.profiles?.username && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">Guest</Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {signup.notes && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">{signup.notes}</span>
        )}
        <Badge variant="outline" className="text-[10px]">{signup.status}</Badge>
      </div>
    </div>
  );
}

export function RunOfShow({ eventId, eventDate, totalSpots }: RunOfShowProps) {
  const { data: signups, isLoading } = useEventSignups(eventId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmedSignups = signups?.filter((s: any) => s.status === 'confirmed') || [];
  const [orderedSignups, setOrderedSignups] = useState<any[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const displaySignups = orderedSignups || confirmedSignups;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentItems = orderedSignups || [...confirmedSignups];
    const oldIndex = currentItems.findIndex((s: any) => s.id === active.id);
    const newIndex = currentItems.findIndex((s: any) => s.id === over.id);

    const newOrder = arrayMove(currentItems, oldIndex, newIndex);
    setOrderedSignups(newOrder);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!orderedSignups) return;
    try {
      const updates = orderedSignups.map((s: any, i: number) =>
        supabase.from('mic_signups').update({ signup_order: i + 1 }).eq('id', s.id)
      );
      await Promise.all(updates);
      toast({ title: 'Order saved!', description: 'Lineup order has been updated.' });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['eventSignups', eventId] });
    } catch {
      toast({ title: 'Error saving order', variant: 'destructive' });
    }
  };

  const handleExportCSV = () => {
    const items = orderedSignups || confirmedSignups;
    const csv = [
      'Order,Name,Status,Notes',
      ...items.map((s: any, i: number) =>
        `${i + 1},"${s.profiles?.username || s.guest_name || 'Comedian'}",${s.status},"${s.notes || ''}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lineup-${eventDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Run of Show — {format(new Date(eventDate + 'T00:00:00'), 'MMM d, yyyy')}</CardTitle>
            <CardDescription className="text-xs">
              {confirmedSignups.length} / {totalSpots} spots · Drag to reorder
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={handleExportCSV}>
              <Download className="h-3 w-3" /> CSV
            </Button>
            {hasChanges && (
              <Button size="sm" className="gap-1 text-xs h-8" onClick={handleSave}>
                <Save className="h-3 w-3" /> Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : displaySignups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No signups yet</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displaySignups.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {displaySignups.map((signup: any, index: number) => (
                  <SortableSignupItem key={signup.id} signup={signup} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
