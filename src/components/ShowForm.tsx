import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Trash2 } from "lucide-react";

interface ShowFormProps {
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
  onDelete?: () => void;
  showDelete?: boolean;
}

function to24Hour(timeStr: string) {
  if (!timeStr) return "";
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr; // already 24-hour
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${(minutes || 0).toString().padStart(2, "0")}`;
}

const ShowForm = ({ onSubmit, onCancel, initialData, onDelete, showDelete }: ShowFormProps) => {
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
              <CardTitle>Request New Mic</CardTitle>
              <CardDescription>Request a new open mic to be added</CardDescription>
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
            <div className="flex items-center gap-2 pt-2">
              <input
                id="anonymous"
                type="checkbox"
                checked={formData.anonymous}
                onChange={e => setFormData({ ...formData, anonymous: e.target.checked })}
                className="h-4 w-4 border-gray-300 rounded"
              />
              <Label htmlFor="anonymous" className="text-xs font-normal text-gray-600">Submit anonymously (you won't be notified when the show gets added)</Label>
            </div>

            <div className="flex gap-2 pt-4 items-center">
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                Request Mic
              </Button>
              {showDelete && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="ml-auto"
                  title="Delete show"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this show? This cannot be undone.')) {
                      onDelete();
                    }
                  }}
                >
                  <span className="sr-only">Delete</span>
                  <Trash2 className="w-5 h-5" />
              </Button>
              )}
              
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShowForm;
