import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCreatedMics } from '@/hooks/useUserCreatedMics';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddMicRequestForm, { MicRequestFormData } from '@/components/host/AddMicRequestForm';
import HostMicEditForm from '@/components/host/HostMicEditForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mic, Edit, Clock, MapPin } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  verified: 'default',
  trial: 'secondary',
  pending: 'outline',
};

export function UserMicManagement() {
  const { user } = useAuth();
  const { data: mics = [], isLoading } = useUserCreatedMics(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMic, setEditingMic] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitMic = async (formData: MicRequestFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('open_mics_historical').insert([{
        open_mic: formData.open_mic,
        venue_name: formData.venue_name,
        borough: formData.borough || null,
        neighborhood: formData.neighborhood || null,
        location: formData.location || null,
        day: formData.day,
        start_time: formData.start_time,
        latest_end_time: formData.latest_end_time || null,
        stage_time: formData.stage_time || null,
        cost: formData.cost || 'Free',
        venue_type: formData.venue_type || null,
        sign_up_instructions: formData.sign_up_instructions || null,
        hosts_organizers: formData.hosts_organizers || null,
        changes_updates: formData.changes_updates || null,
        other_rules: null,
        city: formData.city || 'New York',
        active: true,
        status: 'trial' as const,
        frequency: formData.frequency || 'weekly',
        signup_method: formData.signup_method || 'in_person',
        signup_url: formData.signup_url || null,
        frequency_custom_text: formData.frequency_custom_text || null,
        submission_date: new Date().toISOString(),
        creator_id: user.id,
        verification_count: 0,
      }]);

      if (error) throw error;

      await supabase.from('open_mics_requests').insert([{
        show_title: formData.open_mic,
        open_mic: formData.open_mic,
        venue_name: formData.venue_name,
        borough: formData.borough || null,
        neighborhood: formData.neighborhood || null,
        location: formData.location || null,
        date: formData.day,
        time: formData.start_time,
        latest_end_time: formData.latest_end_time || null,
        stage_time: formData.stage_time || null,
        cost: formData.cost || null,
        venue_type: formData.venue_type || null,
        sign_up_instructions: formData.sign_up_instructions || null,
        hosts_organizers: formData.hosts_organizers || null,
        changes_updates: formData.changes_updates || null,
        city: formData.city || 'New York',
        user_id: user.id,
        frequency: formData.frequency || 'weekly',
        signup_method: formData.signup_method || 'in_person',
        signup_url: formData.signup_url || null,
        frequency_custom_text: formData.frequency_custom_text || null,
        reviewed: true,
        status: 'approved',
      }]);

      toast({ title: 'Mic added!', description: "It's now live on the site." });
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['userCreatedMics'] });
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add mic.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground py-4">Loading your mics...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Mics</h2>
          <p className="text-sm text-muted-foreground">Open mics you've added to the directory</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add a Mic
        </Button>
      </div>

      {mics.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mic className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No mics added yet</h3>
            <p className="text-gray-500 mb-4">
              Mics you submit will appear here so you can track and edit them.
            </p>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Mic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mics.map(mic => (
            <Card key={mic.uniqueIdentifier}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{mic.openMic}</h3>
                    <Badge variant={STATUS_VARIANT[mic.status] ?? 'outline'}>
                      {mic.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {mic.day} {mic.startTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {mic.venueName}{mic.borough ? `, ${mic.borough}` : ''}
                    </span>
                    {mic.cost && (
                      <span className="text-green-600 font-medium">{mic.cost}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMic(mic.uniqueIdentifier)}
                  className="shrink-0"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddForm && (
        <AddMicRequestForm
          onSubmit={handleSubmitMic}
          onCancel={() => setShowAddForm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {editingMic && (
        <Dialog open onOpenChange={open => !open && setEditingMic(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Mic</DialogTitle>
            </DialogHeader>
            <HostMicEditForm
              micUniqueIdentifier={editingMic}
              onClose={() => {
                setEditingMic(null);
                queryClient.invalidateQueries({ queryKey: ['userCreatedMics'] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
