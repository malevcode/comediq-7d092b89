import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface HeadshotUploadProps {
  currentHeadshot?: string;
  onUpload: (file: File) => void;
  isUploading?: boolean;
  userName?: string;
}

export default function HeadshotUpload({ 
  currentHeadshot, 
  onUpload, 
  isUploading,
  userName 
}: HeadshotUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    onUpload(file);
  };

  const displayImage = preview || currentHeadshot;
  const initials = userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
          {displayImage ? (
            <AvatarImage src={displayImage} alt="Headshot" />
          ) : (
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          )}
        </Avatar>
        
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-sm text-muted-foreground text-center">
        {isUploading ? 'Uploading...' : 'Click camera to upload headshot'}
        <br />
        <span className="text-xs">Max 5MB, JPG/PNG</span>
      </p>
    </div>
  );
}
