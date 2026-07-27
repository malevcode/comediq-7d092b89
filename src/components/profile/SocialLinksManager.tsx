import { useState } from 'react';
import { Plus, Trash2, Instagram, Youtube, Music2, Twitter, Globe, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SocialLink } from '@/api/profiles';

interface SocialLinksManagerProps {
  socialLinks: SocialLink[];
  onAdd: (platform: string, handle: string, url: string) => void;
  onRemove: (platform: string) => void;
  isLoading?: boolean;
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: Music2 },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'venmo', label: 'Venmo', icon: DollarSign },
  { value: 'website', label: 'Website', icon: Globe },
];

// Auto-generate URLs from handles
const generateUrl = (platform: string, handle: string): string => {
  // Clean up handle - remove @ if present
  const cleanHandle = handle.replace(/^@/, '');
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'youtube':
      return `https://youtube.com/@${cleanHandle}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanHandle}`;
    case 'twitter':
      return `https://x.com/${cleanHandle}`;
    case 'venmo':
      return `https://venmo.com/u/${cleanHandle}`;
    default:
      return handle; // For website, user enters full URL
  }
};

export default function SocialLinksManager({
  socialLinks,
  onAdd,
  onRemove,
  isLoading
}: SocialLinksManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newHandle, setNewHandle] = useState('');

  const handleAdd = () => {
    if (!newPlatform || !newHandle) return;
    
    const url = generateUrl(newPlatform, newHandle);
    const cleanHandle = newHandle.replace(/^@/, '');
    
    onAdd(newPlatform, cleanHandle, url);
    setNewPlatform('');
    setNewHandle('');
    setShowAddForm(false);
  };

  const getIcon = (platform: string) => {
    const platformConfig = PLATFORMS.find(p => p.value === platform);
    const Icon = platformConfig?.icon || Globe;
    return <Icon className="h-5 w-5" />;
  };

  const availablePlatforms = PLATFORMS.filter(
    p => !socialLinks.some(link => link.platform === p.value)
  );

  const getPlaceholder = (platform: string) => {
    if (platform === 'website') return 'https://yoursite.com';
    if (platform === 'venmo') return 'username (no @)';
    return '@username';
  };

  const getInputLabel = (platform: string) => {
    return platform === 'website' ? 'URL' : 'Handle';
  };

  return (
    <Card className="border-0 bg-[#07111f]/2 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#07111f]/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Social Links
          {!showAddForm && availablePlatforms.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/14 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing links */}
        {socialLinks.length === 0 && !showAddForm && (
          <p className="text-sm text-white/60 text-center py-4">
            No social links added yet
          </p>
        )}

        {socialLinks.map((link) => (
          <div key={link.platform} className="flex items-center gap-3 p-3 rounded-lg bg-white/8">
            <div className={link.platform === 'venmo' ? 'text-green-600' : 'text-primary'}>
              {getIcon(link.platform)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium capitalize">
                {link.platform === 'venmo' ? '💸 Venmo (Tip Me)' : link.platform}
              </p>
              <p className="text-sm text-white/60 truncate">
                {link.platform === 'website' ? link.url : `@${link.handle}`}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onRemove(link.platform)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {/* Add new link form */}
        {showAddForm && (
          <div className="space-y-3 p-4 rounded-lg bg-white/8">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={newPlatform} onValueChange={(val) => {
                setNewPlatform(val);
                setNewHandle(''); // Reset handle when platform changes
              }}>
                <SelectTrigger id="platform" className="border-white/14 bg-white/8 text-white">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="border-white/12 bg-[#102a53] text-white">
                  {availablePlatforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <platform.icon className="h-4 w-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="handle">{newPlatform ? getInputLabel(newPlatform) : 'Handle'}</Label>
              <Input
                id="handle"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder={newPlatform ? getPlaceholder(newPlatform) : 'username'}
                className="border-white/14 bg-white/8 text-white placeholder:text-white/42"
              />
              {newPlatform && newPlatform !== 'website' && newHandle && (
                <p className="text-xs text-white/58 mt-1">
                  URL: {generateUrl(newPlatform, newHandle)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={!newPlatform || !newHandle || isLoading}
              >
                Add Link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlatform('');
                  setNewHandle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
