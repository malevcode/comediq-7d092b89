import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HeadshotUpload from './HeadshotUpload';
import { ComedianProfile } from '@/api/profiles';

interface ProfileEditFormProps {
  profile: ComedianProfile;
  onSave: (data: any) => void;
  onUploadHeadshot: (file: File) => void;
  isSaving?: boolean;
  isUploading?: boolean;
}

interface ProfileFormData {
  stage_name: string;
  credit: string;
  bio: string;
  years_performing: number;
  phone: string;
}

export default function ProfileEditForm({
  profile,
  onSave,
  onUploadHeadshot,
  isSaving,
  isUploading
}: ProfileEditFormProps) {
  const profileSurfaceClass = "border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5";
  const inputClass = "border-white/14 bg-white/8 text-white placeholder:text-white/42";

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      stage_name: profile.stage_name || '',
      credit: profile.credit || '',
      bio: profile.bio || '',
      years_performing: profile.years_performing || 0,
      phone: profile.phone || '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card className={profileSurfaceClass}>
        <CardHeader>
          <CardTitle>Headshot</CardTitle>
        </CardHeader>
        <CardContent>
          <HeadshotUpload
            currentHeadshot={profile.headshot_url}
            onUpload={onUploadHeadshot}
            isUploading={isUploading}
            userName={profile.stage_name || profile.username}
          />
        </CardContent>
      </Card>

      <Card className={profileSurfaceClass}>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stage_name">Stage Name</Label>
            <Input
              id="stage_name"
              {...register('stage_name', { required: 'Stage name is required' })}
              placeholder="Your comedy stage name"
              className={inputClass}
            />
            {errors.stage_name && (
              <p className="text-sm text-destructive mt-1">{errors.stage_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="credit">Credit</Label>
            <Input
              id="credit"
              {...register('credit')}
              placeholder="As seen on Comedy Central, Netflix, etc."
              className={inputClass}
            />
            <p className="text-xs text-white/58 mt-1">
              Your biggest credit or where audiences might recognize you from
            </p>
          </div>

          <div>
            <Label htmlFor="years_performing">Years Performing</Label>
            <Input
              id="years_performing"
              type="number"
              className={inputClass}
              {...register('years_performing', { 
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or greater' }
              })}
              placeholder="0"
            />
            {errors.years_performing && (
              <p className="text-sm text-destructive mt-1">{errors.years_performing.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="(555) 123-4567"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Tell us about yourself and your comedy style..."
              rows={4}
              className={inputClass}
            />
            <p className="text-xs text-white/58 mt-1">
              This will appear on show fliers and booking forms
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving} className="rounded-lg text-white text-sm font-medium bg-[#1a5fb4] hover:bg-[#1550a0] transition-colors">
        {isSaving ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
