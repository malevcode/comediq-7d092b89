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
const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:hover:bg-white/20";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

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
    <Card className={glassCardClass}>
      <CardHeader className={glassHeaderClass}>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add a New Mic
        </CardTitle>
        <CardDescription className={mutedTextClass}>
          Submit a mic to be added to our database. It will be reviewed by admins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="show_title">Mic Name *</Label>
            <Input
              id="show_title"
              className={glassFieldClass}
              value={formData.show_title}
              onChange={(e) => handleChange('show_title', e.target.value)}
              placeholder="e.g., Comedy Night at Joe's"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name *</Label>
            <Input
              id="venue_name"
              className={glassFieldClass}
              value={formData.venue_name}
              onChange={(e) => handleChange('venue_name', e.target.value)}
              placeholder="e.g., Joe's Bar"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Borough *</Label>
              <Select value={formData.borough} onValueChange={(v) => handleChange('borough', v)}>
                <SelectTrigger className={glassFieldClass}>
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
                <SelectTrigger className={glassFieldClass}>
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
              className={glassFieldClass}
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
