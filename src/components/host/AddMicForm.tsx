import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export function AddMicForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    show_title: '',
    venue_name: '',
    borough: '',
    day: '',
    time: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.show_title || !formData.venue_name || !formData.borough || !formData.day) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('open_mics_requests')
        .insert({
          show_title: formData.show_title,
          venue_name: formData.venue_name,
          borough: formData.borough,
          date: formData.day,
          time: formData.time || null,
          user_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Mic submitted!',
        description: 'Your mic has been submitted for admin review.',
      });
      
      setFormData({ show_title: '', venue_name: '', borough: '', day: '', time: '' });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit mic.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add a New Mic
        </CardTitle>
        <CardDescription>
          Submit a mic to be added to our database. It will be reviewed by admins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="show_title">Mic Name *</Label>
            <Input
              id="show_title"
              value={formData.show_title}
              onChange={(e) => handleChange('show_title', e.target.value)}
              placeholder="e.g., Comedy Night at Joe's"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name *</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => handleChange('venue_name', e.target.value)}
              placeholder="e.g., Joe's Bar"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Borough *</Label>
              <Select value={formData.borough} onValueChange={(v) => handleChange('borough', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select borough" />
                </SelectTrigger>
                <SelectContent>
                  {BOROUGHS.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Day *</Label>
              <Select value={formData.day} onValueChange={(v) => handleChange('day', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Start Time (optional)</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Mic for Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
