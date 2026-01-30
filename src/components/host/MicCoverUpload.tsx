import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, ImageIcon } from 'lucide-react';

interface MicCoverUploadProps {
  micId: string;
  currentCoverUrl?: string;
}

export function MicCoverUpload({ micId, currentCoverUrl }: MicCoverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCoverUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${micId}/cover.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('mic-covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('mic-covers')
        .getPublicUrl(fileName);

      // Update database with cover URL
      const { error: updateError } = await supabase
        .from('open_mics_historical')
        .update({ cover_image_url: publicUrl })
        .eq('unique_identifier', micId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      
      toast({
        title: 'Cover image uploaded',
        description: 'Your mic now has a custom background!',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload cover image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('mic-covers')
        .remove([`${micId}/cover.jpg`, `${micId}/cover.png`, `${micId}/cover.jpeg`, `${micId}/cover.webp`]);

      // Update database to remove cover URL
      const { error: updateError } = await supabase
        .from('open_mics_historical')
        .update({ cover_image_url: null })
        .eq('unique_identifier', micId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      
      toast({
        title: 'Cover image removed',
        description: 'Your mic is back to the default look.',
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: 'Remove failed',
        description: 'Could not remove cover image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Customize Cover Image
        </CardTitle>
        <CardDescription>
          Add a custom background image for your mic listing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div 
          className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50"
          style={previewUrl ? {
            backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${previewUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          {previewUrl ? (
            <span className="text-sm text-muted-foreground">Preview of cover image overlay</span>
          ) : (
            <span className="text-sm text-muted-foreground">No cover image set</span>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : previewUrl ? 'Change Image' : 'Upload Image'}
          </Button>
          
          {previewUrl && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Recommended: 1200x400px, max 5MB. JPG, PNG, or WebP.
        </p>
      </CardContent>
    </Card>
  );
}
