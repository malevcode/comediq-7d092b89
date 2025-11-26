import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateRoleData } from '@/types/jobBoard';
import { PERFORMER_ROLES, CREW_ROLES, COMPENSATION_TYPES, EXPERIENCE_LEVELS } from '@/config/roleTypes';

const roleSchema = z.object({
  role_category: z.enum(['performer', 'crew']),
  role_type: z.string().min(1, 'Role type is required'),
  spots_available: z.number().min(1, 'Must have at least 1 spot'),
  experience_level: z.enum(['beginner', 'intermediate', 'experienced', 'pro']),
  requirements: z.string().optional(),
  stage_time_minutes: z.number().optional(),
  compensation_type: z.enum(['paid', 'unpaid', 'door_split', 'bringer', 'stage_time', 'tip_jar', 'negotiable']),
  compensation_amount: z.number().optional(),
  compensation_details: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface AddRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (role: Omit<CreateRoleData, 'posting_id'>) => void;
}

export function AddRoleModal({ open, onOpenChange, onAdd }: AddRoleModalProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role_category: 'performer',
      spots_available: 1,
      experience_level: 'beginner',
      compensation_type: 'unpaid',
    },
  });

  const roleCategory = watch('role_category');
  const compensationType = watch('compensation_type');

  const handleAdd = (data: RoleFormData) => {
    onAdd(data as Omit<CreateRoleData, 'posting_id'>);
    reset();
  };

  const roleOptions = roleCategory === 'performer' ? PERFORMER_ROLES : CREW_ROLES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Role Opening</DialogTitle>
          <DialogDescription>
            Create a new role opening for your show posting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role_category">Category *</Label>
              <Select
                defaultValue="performer"
                onValueChange={(value: 'performer' | 'crew') => {
                  setValue('role_category', value);
                  setValue('role_type', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performer">Performer</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_type">Role Type *</Label>
              <Select onValueChange={(value) => setValue('role_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role_type && (
                <p className="text-sm text-destructive">{errors.role_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spots_available">Number of Spots *</Label>
              <Input
                id="spots_available"
                type="number"
                min="1"
                {...register('spots_available', { valueAsNumber: true })}
              />
              {errors.spots_available && (
                <p className="text-sm text-destructive">{errors.spots_available.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select
                defaultValue="beginner"
                onValueChange={(value: any) => setValue('experience_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {roleCategory === 'performer' && (
            <div className="space-y-2">
              <Label htmlFor="stage_time_minutes">Stage Time (minutes)</Label>
              <Input
                id="stage_time_minutes"
                type="number"
                min="1"
                {...register('stage_time_minutes', { valueAsNumber: true })}
                placeholder="e.g., 5, 10, 15"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements/Description</Label>
            <Textarea
              id="requirements"
              {...register('requirements')}
              placeholder="What are you looking for in applicants?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compensation_type">Compensation Type *</Label>
            <Select
              defaultValue="unpaid"
              onValueChange={(value: any) => setValue('compensation_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPENSATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {compensationType === 'paid' && (
            <div className="space-y-2">
              <Label htmlFor="compensation_amount">Amount ($)</Label>
              <Input
                id="compensation_amount"
                type="number"
                min="0"
                step="0.01"
                {...register('compensation_amount', { valueAsNumber: true })}
                placeholder="50.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="compensation_details">Compensation Details</Label>
            <Textarea
              id="compensation_details"
              {...register('compensation_details')}
              placeholder="Additional details about compensation..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Role</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
