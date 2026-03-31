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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    try {
      await submitMutation.mutateAsync({
        ...form,
        submitted_by: user.id,
        description: form.description || undefined,
        venue_name: form.venue_name || undefined,
        borough: form.borough || undefined,
        date: form.date || undefined,
        time: form.time || undefined,
        compensation: form.compensation || undefined,
        contact_info: form.contact_info || undefined,
        external_url: form.external_url || undefined,
      });
      toast({ title: "Submitted!", description: "Your opportunity has been posted." });
      setOpen(false);
      setForm({ type: 'barking', title: '', description: '', venue_name: '', borough: '', date: '', time: '', compensation: '', contact_info: '', external_url: '' });
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
                <SelectItem value="school_ad">Training / School</SelectItem>
                <SelectItem value="barking">Barking Gig</SelectItem>
                <SelectItem value="festival">Festival / Event</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Barker needed for Saturday show" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Details about the opportunity..." rows={3} />
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input value={form.time} onChange={e => update('time', e.target.value)} placeholder="e.g. 7:00 PM" />
            </div>
          </div>
          <div>
            <Label>Compensation</Label>
            <Input value={form.compensation} onChange={e => update('compensation', e.target.value)} placeholder="e.g. $20/hr, Free entry" />
          </div>
          <div>
            <Label>Contact Info</Label>
            <Input value={form.contact_info} onChange={e => update('contact_info', e.target.value)} placeholder="Instagram, email, or phone" />
          </div>
          <div>
            <Label>Link (optional)</Label>
            <Input value={form.external_url} onChange={e => update('external_url', e.target.value)} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
