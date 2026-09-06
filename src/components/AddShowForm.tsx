import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface AddShowFormProps {
  onSubmit: (show: {
    title: string;
    venue: string;
    date: string; // ISO string
    time: string;
    borough: string;
    notes?: string;
    stage_time_minutes?: number;
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    venue: string;
    date: string | Date;
    time: string;
    borough?: string;
    notes?: string;
    neighborhood?: string;
    status?: 'upcoming' | 'cancelled' | 'completed';
    stage_time_minutes?: number;
  };
}

const glassCardClass = "border border-[#07111f]/10 bg-white/80 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/90 dark:text-white";
const glassHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:hover:bg-white/20";
const primaryGlassButtonClass = "bg-[#1a5fb4] text-white hover:bg-[#1550a0] hover:text-white";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

function to24Hour(time: string) {
  // If already in 24-hour format, return as is
  if (!time.match(/am|pm/i)) return time;
  let [h, m] = time.replace(/am|pm/i, '').split(':');
  let hour = parseInt(h, 10);
  const min = m || '00';
  if (/pm/i.test(time) && hour !== 12) hour += 12;
  if (/am/i.test(time) && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${min.padStart(2, '0')}`;
}

const AddShowForm = ({ onSubmit, onCancel, initialData }: AddShowFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    venue: initialData?.venue || '',
    date: initialData?.date ? (typeof initialData.date === 'string' ? initialData.date : new Date(initialData.date).toISOString().slice(0, 10)) : '',
    time: initialData?.time ? to24Hour(initialData.time) : '',
    borough: initialData?.borough || '',
    notes: initialData?.notes || '',
    neighborhood: initialData?.neighborhood || '',
    status: (initialData?.status as 'upcoming' | 'cancelled' | 'completed') || 'upcoming',
    stage_time_minutes: initialData?.stage_time_minutes || 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Combine date and time into a single ISO string
    let dateTimeISO = '';
    if (formData.date && formData.time) {
      // This creates a local time ISO string
      dateTimeISO = new Date(`${formData.date}T${formData.time}`).toISOString();
    } else {
      dateTimeISO = formData.date || '';
    }
    if (!formData.title || !formData.venue || !dateTimeISO || !formData.borough) {
      return;
    }

    onSubmit({
      ...formData,
      date: dateTimeISO,
      stage_time_minutes: formData.stage_time_minutes,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 !m-0 !p-0">
      <Card className={`max-h-[90vh] w-full max-w-md overflow-y-auto ${glassCardClass}`}>
        <CardHeader className={glassHeaderClass}>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add a Show</CardTitle>
              <CardDescription className={mutedTextClass}>Add a new show to your schedule</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-white/40 dark:hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Show Title</Label>
              <Input
                id="title"
                className={glassFieldClass}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Comedy Night at The Laugh Track"
                required
              />
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                className={glassFieldClass}
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., The Comedy Cellar"
                required
              />
            </div>

            <div>
              <Label htmlFor="borough">Borough</Label>
              <select
                id="borough"
                className={`w-full rounded-md px-3 py-2 text-sm ${glassFieldClass}`}
                value={formData.borough}
                onChange={(e) => setFormData({ ...formData, borough: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="Manhattan">Manhattan</option>
                <option value="Brooklyn">Brooklyn</option>
                <option value="Queens">Queens</option>
                <option value="Bronx">Bronx</option>
                <option value="Staten Island">Staten Island</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  className={glassFieldClass}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  className={glassFieldClass}
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stage_time">Stage Time (minutes)</Label>
              <Input
                id="stage_time"
                type="number"
                min="1"
                max="120"
                className={glassFieldClass}
                value={formData.stage_time_minutes}
                onChange={(e) => setFormData({ ...formData, stage_time_minutes: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
              <p className={`mt-1 text-xs ${mutedTextClass}`}>
                How many minutes of stage time? (Default: 5 min)
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                className={glassFieldClass}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about the show..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4 items-center">
              <Button type="submit" className={`flex-1 ${primaryGlassButtonClass}`}>
                Add Show
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddShowForm;
