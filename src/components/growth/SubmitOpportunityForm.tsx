import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmitOpportunity } from "@/hooks/useGrowthOpportunities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { GrowthOpportunityType } from "@/api/growthOpportunities";

export function SubmitOpportunityForm() {
  const { user } = useAuth();
  const submitMutation = useSubmitOpportunity();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'barking' as GrowthOpportunityType,
    title: '',
    description: '',
    venue_name: '',
    borough: '',
    date: '',
    time: '',
    compensation: '',
    contact_info: '',
    external_url: '',
    // Podcast-specific fields (mapped to existing DB columns)
    podcast_name: '',
    host_name: '',
    episode_frequency: '',
    instagram_handle: '',
    youtube_link: '',
  });

  const isPodcast = form.type === 'podcast';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const payload: any = {
      type: form.type,
      title: form.title,
      submitted_by: user.id,
      description: form.description || undefined,
    };

    if (isPodcast) {
      payload.venue_name = form.podcast_name || undefined;
      payload.contact_info = form.instagram_handle ? `@${form.instagram_handle.replace(/^@/, '')}` : undefined;
      payload.external_url = form.youtube_link || undefined;
      payload.compensation = form.episode_frequency || undefined;
    } else {
      payload.venue_name = form.venue_name || undefined;
      payload.borough = form.borough || undefined;
      payload.date = form.date || undefined;
      payload.time = form.time || undefined;
      payload.compensation = form.compensation || undefined;
      payload.contact_info = form.contact_info || undefined;
      payload.external_url = form.external_url || undefined;
    }

    try {
      await submitMutation.mutateAsync(payload);
      toast({ title: "Submitted!", description: "Your opportunity has been posted." });
      setOpen(false);
      setForm({ type: 'barking', title: '', description: '', venue_name: '', borough: '', date: '', time: '', compensation: '', contact_info: '', external_url: '', podcast_name: '', host_name: '', episode_frequency: '', instagram_handle: '', youtube_link: '' });
    } catch {
      toast({ title: "Error submitting", variant: "destructive" });
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (!user) {
    return (
      <Button onClick={() => window.location.href = '/auth'}>
        <Plus className="h-4 w-4 mr-2" /> Add Your Listing
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Your Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit an Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => update('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="barking">Booking Opportunity</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="school_ad">Training / School</SelectItem>
                <SelectItem value="festival">Festival / Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
              <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder={isPodcast ? "e.g. Likeable with David Stickle" : "e.g. Comic needed for Saturday show"} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder={isPodcast ? "What's the podcast about?" : "Details about the opportunity..."} rows={3} />
          </div>

          {/* Podcast-specific fields */}
          {isPodcast && (
            <>
              <div>
                <Label>Podcast Name</Label>
                <Input value={form.podcast_name} onChange={e => update('podcast_name', e.target.value)} placeholder="e.g. Likeable Pod" />
              </div>
              <div>
                <Label>Host Name</Label>
                <Input value={form.host_name} onChange={e => update('host_name', e.target.value)} placeholder="e.g. David Stickle" />
              </div>
              <div>
                <Label>Episode Frequency</Label>
                <Input value={form.episode_frequency} onChange={e => update('episode_frequency', e.target.value)} placeholder="e.g. Every Wednesday" />
              </div>
              <div>
                <Label>Instagram Handle</Label>
                <Input value={form.instagram_handle} onChange={e => update('instagram_handle', e.target.value)} placeholder="e.g. @likeablepod" />
              </div>
              <div>
                <Label>YouTube Link</Label>
                <Input value={form.youtube_link} onChange={e => update('youtube_link', e.target.value)} placeholder="https://youtube.com/..." />
              </div>
            </>
          )}

          {/* Venue & Borough — barking, school_ad, festival */}
          {!isPodcast && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Venue</Label>
                <Input value={form.venue_name} onChange={e => update('venue_name', e.target.value)} placeholder="Venue name" />
              </div>
              <div>
                <Label>Borough</Label>
                <Select value={form.borough} onValueChange={(v) => update('borough', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhattan">Manhattan</SelectItem>
                    <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                    <SelectItem value="Queens">Queens</SelectItem>
                    <SelectItem value="Bronx">Bronx</SelectItem>
                    <SelectItem value="Staten Island">Staten Island</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Date — barking & festival */}
          {(form.type === 'barking' || form.type === 'festival') && (
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
          )}

          {/* Time — barking only */}
          {form.type === 'barking' && (
            <div>
              <Label>Time</Label>
              <Input value={form.time} onChange={e => update('time', e.target.value)} placeholder="e.g. 7:00 PM" />
            </div>
          )}

          {/* Compensation — barking & festival */}
          {(form.type === 'barking' || form.type === 'festival') && (
            <div>
              <Label>Compensation</Label>
              <Input value={form.compensation} onChange={e => update('compensation', e.target.value)} placeholder="e.g. $20/hr, Free entry" />
            </div>
          )}

          {/* Contact Info — barking & school_ad */}
          {(form.type === 'barking' || form.type === 'school_ad') && (
            <div>
              <Label>Contact Info</Label>
              <Input value={form.contact_info} onChange={e => update('contact_info', e.target.value)} placeholder="Instagram, email, or phone" />
            </div>
          )}

          {/* Website / Link — school_ad, festival, barking */}
          {(form.type === 'school_ad' || form.type === 'festival') && (
            <div>
              <Label>Website Link</Label>
              <Input value={form.external_url} onChange={e => update('external_url', e.target.value)} placeholder="https://..." />
            </div>
          )}
          {form.type === 'barking' && (
            <div>
              <Label>Link (optional)</Label>
              <Input value={form.external_url} onChange={e => update('external_url', e.target.value)} placeholder="https://..." />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
