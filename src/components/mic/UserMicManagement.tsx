import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCreatedMics } from '@/hooks/useUserCreatedMics';
import { useQueryClient } from '@tanstack/react-query';
import HostMicEditForm from '@/components/host/HostMicEditForm';
import EditableMicCard from '@/components/mic/EditableMicCard';
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
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMic, setEditingMic] = useState<string | null>(null);

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

      {showAddForm && user && (
        <EditableMicCard
          userId={user.id}
          userName={user.email ?? undefined}
          onClose={() => setShowAddForm(false)}
          onSubmitted={() => {
            setShowAddForm(false);
            queryClient.invalidateQueries({ queryKey: ['userCreatedMics'] });
          }}
        />
      )}

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
