import { useState } from 'react';
import { Plus, Trash2, Instagram, Youtube, Music2, Twitter, Globe } from 'lucide-react';
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
  { value: 'website', label: 'Website', icon: Globe },
];

export default function SocialLinksManager({
  socialLinks,
  onAdd,
  onRemove,
  isLoading
}: SocialLinksManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (!newPlatform || !newHandle || !newUrl) return;
    
    onAdd(newPlatform, newHandle, newUrl);
    setNewPlatform('');
    setNewHandle('');
    setNewUrl('');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Social Links
          {!showAddForm && availablePlatforms.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
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
          <p className="text-sm text-muted-foreground text-center py-4">
            No social links added yet
          </p>
        )}

        {socialLinks.map((link) => (
          <div key={link.platform} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="text-primary">{getIcon(link.platform)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium capitalize">{link.platform}</p>
              <p className="text-sm text-muted-foreground truncate">@{link.handle}</p>
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
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlatforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="username"
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={!newPlatform || !newHandle || !newUrl || isLoading}
              >
                Add Link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlatform('');
                  setNewHandle('');
                  setNewUrl('');
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
