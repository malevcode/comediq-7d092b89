import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CreatePostingData, CreateRoleData } from '@/types/jobBoard';
import { SHOW_TYPES } from '@/config/roleTypes';
import { AddRoleModal } from './AddRoleModal';

const postingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  venue_name: z.string().min(1, 'Venue name is required'),
  venue_address: z.string().optional(),
  borough: z.string().optional(),
  show_date: z.string().min(1, 'Show date is required'),
  show_time: z.string().optional(),
  call_time: z.string().optional(),
  show_type: z.string().optional(),
  expected_audience: z.number().optional(),
  application_deadline: z.string().optional(),
});

type PostingFormData = z.infer<typeof postingSchema>;

interface CreatePostingFormProps {
  onSubmit: (posting: CreatePostingData, roles: CreateRoleData[]) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export function CreatePostingForm({ onSubmit, onCancel, isSubmitting }: CreatePostingFormProps) {
  const [roles, setRoles] = useState<CreateRoleData[]>([]);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showDate, setShowDate] = useState<Date>();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PostingFormData>({
    resolver: zodResolver(postingSchema),
  });

  const handleAddRole = (role: Omit<CreateRoleData, 'posting_id'>) => {
    setRoles([...roles, { ...role, posting_id: '' }]);
    setShowAddRole(false);
  };

  const handleRemoveRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const onFormSubmit = (data: PostingFormData) => {
    if (roles.length === 0) {
      alert('Please add at least one role to the posting');
      return;
    }
    onSubmit(data as CreatePostingData, roles);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Show Details</CardTitle>
          <CardDescription>Basic information about your show</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Show Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Wednesday Night Comedy Showcase"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Tell people about your show..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue_name">Venue Name *</Label>
              <Input
                id="venue_name"
                {...register('venue_name')}
                placeholder="e.g., The Comedy Cellar"
              />
              {errors.venue_name && (
                <p className="text-sm text-destructive">{errors.venue_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="borough">Borough</Label>
              <Select onValueChange={(value) => setValue('borough', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select borough" />
                </SelectTrigger>
                <SelectContent>
                  {BOROUGHS.map(borough => (
                    <SelectItem key={borough} value={borough}>
                      {borough}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_address">Venue Address</Label>
            <Input
              id="venue_address"
              {...register('venue_address')}
              placeholder="123 Comedy St, Brooklyn, NY"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Show Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !showDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {showDate ? format(showDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={showDate}
                    onSelect={(date) => {
                      setShowDate(date);
                      if (date) {
                        setValue('show_date', format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.show_date && (
                <p className="text-sm text-destructive">{errors.show_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="show_time">Show Time</Label>
              <Input
                id="show_time"
                type="time"
                {...register('show_time')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="call_time">Call Time</Label>
              <Input
                id="call_time"
                type="time"
                {...register('call_time')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="show_type">Show Type</Label>
              <Select onValueChange={(value) => setValue('show_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select show type" />
                </SelectTrigger>
                <SelectContent>
                  {SHOW_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_audience">Expected Audience Size</Label>
              <Input
                id="expected_audience"
                type="number"
                {...register('expected_audience', { valueAsNumber: true })}
                placeholder="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles & Openings</CardTitle>
              <CardDescription>Add roles you need to fill for this show</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddRole(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No roles added yet. Click "Add Role" to create your first opening.
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((role, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{role.role_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {role.role_category} • {role.compensation_type} • {role.spots_available} spot{role.spots_available !== 1 ? 's' : ''}
                    </div>
                    {role.requirements && (
                      <p className="text-sm text-muted-foreground">{role.requirements}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRole(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Posting'}
        </Button>
      </div>

      <AddRoleModal
        open={showAddRole}
        onOpenChange={setShowAddRole}
        onAdd={handleAddRole}
      />
    </form>
  );
}
