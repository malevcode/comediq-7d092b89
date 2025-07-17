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
    date: Date;
    time: string;
    borough: string;
    notes?: string;
    anonymous?: boolean;
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
    anonymous?: boolean;
  };
}

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
    anonymous: initialData?.anonymous || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.venue || !formData.date || !formData.time || !formData.borough) {
      return;
    }

    onSubmit({
      ...formData,
      date: new Date(formData.date),
      anonymous: formData.anonymous,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4 !p-0 !m-0">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add a Show</CardTitle>
              <CardDescription>Add a new show to your schedule</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white"
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
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about the show..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4 items-center">
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
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