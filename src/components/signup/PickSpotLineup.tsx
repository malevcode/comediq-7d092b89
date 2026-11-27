import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { hostUpdateLineup, pickLineupSpot, type PickLineup } from '@/api/signups';
import { Megaphone } from 'lucide-react';

const timeNY = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

/**
 * Pick your spot (steps 2 and 3 of the digital paper list).
 * - Before you check in: you see which numbers are taken, never who took them.
 * - After you check in: tap any open number. You now see every checked-in name.
 * - During the mic: "Now up" and how many comics are before you; the host moves it along and posts notes.
 */
export function PickSpotLineup({ eventId, data }: { eventId: string; data: PickLineup }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['eventLineup', 'pick', eventId] });

  const bySpot = new Map(data.spots.map((s) => [s.spot, s]));
  const nowUp = data.now_up ?? 0;
  const mySpot = data.me.spot;
  const canPick = data.me.checked_in && !(mySpot && mySpot <= nowUp);

  const pick = useMutation({
    mutationFn: (spot: number) => pickLineupSpot(eventId, spot),
    onSuccess: (res) => {
      if (res.status === 'taken') {
        toast({ title: 'Someone just grabbed that one', description: 'Pick another open number.', variant: 'destructive' });
      } else {
        toast({ title: `You're #${res.spot}`, description: res.walk_in ? 'You are on the list.' : 'Your spot is saved.' });
      }
      refresh();
      queryClient.invalidateQueries({ queryKey: ['eventSignups', eventId] });
    },
    onError: (e: any) => toast({ title: 'Could not pick that spot', description: e?.message, variant: 'destructive' }),
  });

  const host = useMutation({
    mutationFn: (change: Parameters<typeof hostUpdateLineup>[1]) => hostUpdateLineup(eventId, change),
    onSuccess: () => refresh(),
    onError: (e: any) => toast({ title: 'Could not update the lineup', description: e?.message, variant: 'destructive' }),
  });

  const nowUpRow = nowUp ? bySpot.get(nowUp) : undefined;
  const ahead = mySpot && mySpot > nowUp ? mySpot - nowUp - 1 : null;

  return (
    <div className="space-y-3">
      {/* Step 3: where the lineup is right now */}
      {(nowUp > 0 || mySpot) && (
        <div className="rounded-lg bg-[#1a5fb4] px-4 py-3 text-white">
          {nowUp > 0 && (
            <p className="text-sm">
              Now up: <span className="font-bold">#{nowUp}{nowUpRow?.name ? ` ${nowUpRow.name}` : ''}</span>
            </p>
          )}
          {mySpot && (
            <p className="text-lg font-bold">
              {mySpot === nowUp
                ? "You're up!"
                : mySpot < nowUp
                  ? `You went up at #${mySpot}`
                  : ahead === 0 && nowUp > 0
                    ? `You're #${mySpot}. You're on deck!`
                    : `You're #${mySpot}${nowUp > 0 ? `, ${ahead} ${ahead === 1 ? 'comic' : 'comics'} before you` : ''}`}
            </p>
          )}
        </div>
      )}

      {data.host_note && (
        <div className="flex gap-3 rounded-lg bg-[#8ec5ff]/30 px-4 py-3 text-sm text-[#07111f] dark:text-white">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[#1a5fb4]" />
          <div>
            <p className="font-semibold">From the host{data.host_note_at ? ` · ${timeNY(data.host_note_at)}` : ''}</p>
            <p>{data.host_note}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-[#07111f]/60 dark:text-white/60">
        {data.me.checked_in
          ? mySpot
            ? 'Tap another open number to switch, until you go up.'
            : 'You are checked in. Tap any open number to take it.'
          : `Check in at the venue to pick your number. ${data.checked_in} of ${data.total_spots} checked in so far.`}
      </p>

      {/* Step 2: the numbered list */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: data.total_spots }, (_, i) => i + 1).map((spot) => {
          const row = bySpot.get(spot);
          const gone = nowUp > 0 && spot < nowUp;
          const isNow = spot === nowUp;
          const open = !row && !gone && !isNow;
          const clickable = open && canPick && !pick.isPending;
          return (
            <button
              key={spot}
              type="button"
              disabled={!clickable}
              onClick={() => pick.mutate(spot)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
                row?.is_me ? 'bg-[#1a5fb4] text-white' : 'bg-white/30 text-[#07111f] dark:bg-[#07111f]/40 dark:text-white',
                isNow && !row?.is_me ? 'ring-2 ring-[#1a5fb4]' : '',
                gone ? 'opacity-40' : '',
                clickable ? 'cursor-pointer hover:bg-[#8ec5ff]/40' : 'cursor-default',
              ].join(' ')}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${row?.is_me ? 'bg-white text-[#1a5fb4]' : 'bg-[#1a5fb4]/15 text-[#1a5fb4] dark:text-[#8ec5ff]'}`}>
                {spot}
              </span>
              <span className="font-medium">
                {row ? (row.is_me ? 'You' : row.name ?? 'Taken') : open ? (canPick ? 'Open, tap to take' : 'Open') : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Host controls */}
      {data.is_host && (
        <div className="space-y-2 rounded-lg border border-[#1a5fb4]/30 p-3">
          <p className="text-sm font-semibold text-[#07111f] dark:text-white">Run the lineup</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[#1a5fb4] hover:bg-[#1550a0]"
              disabled={host.isPending || nowUp >= data.total_spots}
              onClick={() => host.mutate({ nowUp: nowUp + 1 })}
            >
              {nowUp === 0 ? 'Start with #1' : 'Next comic'}
            </Button>
            <Button type="button" variant="outline" disabled={host.isPending || nowUp <= 1} onClick={() => host.mutate({ nowUp: nowUp - 1 })}>
              Back one
            </Button>
            {nowUp > 0 && (
              <Button type="button" variant="ghost" disabled={host.isPending} onClick={() => host.mutate({ clearNowUp: true })}>
                Reset
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note to everyone, e.g. light is at 4 min"
              maxLength={200}
            />
            <Button
              type="button"
              variant="outline"
              disabled={host.isPending || !note.trim()}
              onClick={() => host.mutate({ note }, { onSuccess: () => setNote('') })}
            >
              Post
            </Button>
          </div>
          {data.host_note && (
            <Button type="button" variant="ghost" size="sm" disabled={host.isPending} onClick={() => host.mutate({ clearNote: true })}>
              Clear note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
