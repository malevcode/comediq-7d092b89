import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import { X } from 'lucide-react';

export interface MicRequestFormData {
  open_mic: string;
  venue_name: string;
  city: string;
  borough: string;
  neighborhood: string;
  location: string;
  day: string;
  start_time: string;
  latest_end_time: string;
  stage_time: string;
  cost: string;
  venue_type: string;
  sign_up_instructions: string;
  hosts_organizers: string;
  host_phone: string;
  changes_updates: string;
  other_rules: string;
}

interface AddMicRequestFormProps {
  onSubmit: (data: MicRequestFormData) => void;
  onCancel: () => void;
}

const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const venueTypes = ['Comedy Club', 'Bar', 'Restaurant', 'Coffee Shop', 'Theater', 'Other'];
const cities = ['New York', 'Los Angeles'];

const AddMicRequestForm: React.FC<AddMicRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<MicRequestFormData>({
    open_mic: '',
    venue_name: '',
    city: 'New York',
    borough: '',
    neighborhood: '',
    location: '',
    day: '',
    start_time: '',
    latest_end_time: '',
    stage_time: '',
    cost: '',
    venue_type: '',
    sign_up_instructions: '',
    hosts_organizers: '',
    host_phone: '',
    changes_updates: '',
    other_rules: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MicRequestFormData, string>>>({});

  const handleChange = (field: keyof MicRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MicRequestFormData, string>> = {};

    if (!formData.open_mic.trim()) {
      newErrors.open_mic = 'Mic name is required';
    }
    if (!formData.venue_name.trim()) {
      newErrors.venue_name = 'Venue name is required';
    }
    if (!formData.day) {
      newErrors.day = 'Day is required';
    }
    if (!formData.start_time.trim()) {
      newErrors.start_time = 'Start time is required';
    }
    if (formData.city === 'New York' && !formData.borough) {
      newErrors.borough = 'Borough is required for NYC';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Request New Mic
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Basic Info</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="open_mic">Mic Name *</Label>
              <Input
                id="open_mic"
                placeholder="e.g., Comedy Night at Joe's"
                value={formData.open_mic}
                onChange={(e) => handleChange('open_mic', e.target.value)}
                className={errors.open_mic ? 'border-red-500' : ''}
              />
              {errors.open_mic && <p className="text-xs text-red-500">{errors.open_mic}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venue_name">Venue Name *</Label>
              <Input
                id="venue_name"
                placeholder="e.g., Joe's Bar"
                value={formData.venue_name}
                onChange={(e) => handleChange('venue_name', e.target.value)}
                className={errors.venue_name ? 'border-red-500' : ''}
              />
              {errors.venue_name && <p className="text-xs text-red-500">{errors.venue_name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>City *</Label>
              <Select value={formData.city} onValueChange={(v) => handleChange('city', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Location</h3>
            
            {formData.city === 'New York' && (
              <div className="space-y-1.5">
                <Label>Borough *</Label>
                <Select value={formData.borough} onValueChange={(v) => handleChange('borough', v)}>
                  <SelectTrigger className={errors.borough ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select borough" />
                  </SelectTrigger>
                  <SelectContent>
                    {boroughs.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.borough && <p className="text-xs text-red-500">{errors.borough}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                placeholder="e.g., East Village"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Address</Label>
              <Input
                id="location"
                placeholder="123 Main St, New York, NY"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Schedule</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Day *</Label>
                <DayOfWeekPicker 
                  value={formData.day} 
                  onChange={(v) => handleChange('day', v)} 
                />
                {errors.day && <p className="text-xs text-red-500">{errors.day}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  placeholder="e.g., 7:00 PM"
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className={errors.start_time ? 'border-red-500' : ''}
                />
                {errors.start_time && <p className="text-xs text-red-500">{errors.start_time}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="latest_end_time">End Time</Label>
                <Input
                  id="latest_end_time"
                  placeholder="e.g., 9:00 PM"
                  value={formData.latest_end_time}
                  onChange={(e) => handleChange('latest_end_time', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stage_time">Stage Time</Label>
                <Input
                  id="stage_time"
                  placeholder="e.g., 5 minutes"
                  value={formData.stage_time}
                  onChange={(e) => handleChange('stage_time', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Details</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  placeholder="e.g., Free, $5, 1 drink min"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Venue Type</Label>
                <Select value={formData.venue_type} onValueChange={(v) => handleChange('venue_type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {venueTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sign_up_instructions">Sign-up Instructions</Label>
              <Textarea
                id="sign_up_instructions"
                placeholder="How to sign up for this mic..."
                value={formData.sign_up_instructions}
                onChange={(e) => handleChange('sign_up_instructions', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Host Info Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Host Info</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hosts_organizers">Host Instagram</Label>
                <Input
                  id="hosts_organizers"
                  placeholder="@instagram_handle"
                  value={formData.hosts_organizers}
                  onChange={(e) => handleChange('hosts_organizers', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="host_phone">Phone (optional)</Label>
                <Input
                  id="host_phone"
                  placeholder="(555) 123-4567"
                  value={formData.host_phone}
                  onChange={(e) => handleChange('host_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="changes_updates">Updates Contact (Instagram)</Label>
              <Input
                id="changes_updates"
                placeholder="@handle for changes/updates"
                value={formData.changes_updates}
                onChange={(e) => handleChange('changes_updates', e.target.value)}
              />
            </div>
          </div>

          {/* Rules Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Rules</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="other_rules">Other Rules or Notes</Label>
              <Textarea
                id="other_rules"
                placeholder="Any additional rules..."
                value={formData.other_rules}
                onChange={(e) => handleChange('other_rules', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Submit Mic Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMicRequestForm;
