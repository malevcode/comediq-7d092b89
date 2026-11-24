import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  approveDeal,
  fetchOutreach,
  fetchPendingDeals,
  fetchVenueHistory,
  pendingDealsQueryKey,
  rejectDeal,
  saveOutreach,
  venueHistoryQueryKey,
  type OpenToNew,
} from "@/api/venueHistory";
import { formatDoorPrice, judgeMinimum, judgeSplit } from "@/utils/venueHistory";

/**
 * Deal reports and venue outreach, for the admin area.
 *
 * Reports arrive pending and are invisible on the public page until approved
 * here. Rejecting records the decision in the note rather than deleting the
 * row, because nothing in this project deletes what someone told us.
 */
export default function AdminVenueDealsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: pendingDealsQueryKey,
    queryFn: fetchPendingDeals,
  });
  const { data: venues = [] } = useQuery({
    queryKey: venueHistoryQueryKey,
    queryFn: fetchVenueHistory,
    staleTime: 5 * 60 * 1000,
  });
  const { data: outreach = [] } = useQuery({ queryKey: ["venue-outreach"], queryFn: fetchOutreach });

  const venueName = useMemo(() => {
    const map = new Map(venues.map((v) => [v.slug, v.name]));
    return (slug: string) => map.get(slug) ?? slug;
  }, [venues]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["venue-deals"] });
    queryClient.invalidateQueries({ queryKey: ["venue-outreach"] });
    queryClient.invalidateQueries({ queryKey: ["venue-open-to-new"] });
  };

  const decide = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      if (action === "approve") {
        await approveDeal(id);
        toast({ title: "Deal approved", description: "It is now visible to signed-in users." });
      } else {
        await rejectDeal(id, "Rejected by an admin.");
        toast({ title: "Deal rejected", description: "The report is kept but stays unapproved." });
      }
      refresh();
    } catch (error) {
      toast({
        title: `Could not ${action} that report`,
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------ outreach ------------------------------ */

  const [slug, setSlug] = useState("");
  const [openToNew, setOpenToNew] = useState<OpenToNew>("unknown");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactIg, setContactIg] = useState("");
  const [notes, setNotes] = useState("");

  const loadVenue = (nextSlug: string) => {
    setSlug(nextSlug);
    const existing = outreach.find((row) => row.venue_slug === nextSlug);
    setOpenToNew(existing?.open_to_new ?? "unknown");
    setContactName(existing?.contact_name ?? "");
    setContactEmail(existing?.contact_email ?? "");
    setContactIg(existing?.contact_ig ?? "");
    setNotes(existing?.notes ?? "");
  };

  const save = useMutation({
    mutationFn: () =>
      saveOutreach({ venueSlug: slug, openToNew, contactName, contactEmail, contactIg, notes }),
    onSuccess: () => {
      toast({ title: "Outreach saved", description: "The venue page shows your answer now." });
      refresh();
    },
    onError: (error) =>
      toast({
        title: "Could not save that",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      }),
  });

  const field = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm";

  return (
    <>
      <Card className="mb-8 rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Deal reports</h2>
            <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-1 text-xs font-bold leading-none text-white">
              {pending.length}
            </span>
          </div>

          {isLoading && <div className="text-muted-foreground">Loading reports...</div>}
          {!isLoading && pending.length === 0 && (
            <div className="text-muted-foreground">No deal reports waiting.</div>
          )}

          <ul className="flex w-full flex-col gap-3">
            {pending.map((deal) => {
              const split = judgeSplit(deal);
              const minimum = judgeMinimum(deal);
              const door = formatDoorPrice(deal);
              return (
                <li
                  key={deal.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {venueName(deal.venue_slug)}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {deal.show_type}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[door, split?.text, minimum?.text].filter(Boolean).join(" · ") ||
                        "No figures given"}
                    </div>
                    {deal.notes && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{deal.notes}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void decide(deal.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy !== null}
                      onClick={() => void decide(deal.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8 rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <h2 className="mb-2 text-xl font-bold text-foreground">Outreach</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Whether a room is open to a new mic. Your answer replaces the estimate on the
            Historical mics page. Contact details stay admin-only.
          </p>

          <div className="flex flex-col gap-3">
            <select value={slug} onChange={(event) => loadVenue(event.target.value)} className={field}>
              <option value="">Pick a venue</option>
              {venues.map((venue) => (
                <option key={venue.slug} value={venue.slug}>
                  {venue.name}
                </option>
              ))}
            </select>

            {slug && (
              <>
                <select
                  value={openToNew}
                  onChange={(event) => setOpenToNew(event.target.value as OpenToNew)}
                  className={field}
                  aria-label="Open to a new mic"
                >
                  <option value="unknown">Unknown, use the estimate</option>
                  <option value="yes">Yes, likely</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">No, unlikely</option>
                </select>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    className={field}
                    placeholder="Contact name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="Contact email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="Contact Instagram"
                    value={contactIg}
                    onChange={(event) => setContactIg(event.target.value)}
                  />
                </div>

                <input
                  className={field}
                  placeholder="Notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />

                <Button
                  className="w-fit"
                  disabled={save.isPending}
                  onClick={() => save.mutate()}
                >
                  {save.isPending ? "Saving..." : "Save outreach"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
