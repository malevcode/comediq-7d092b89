import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Save, X, Loader2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface EditingCell {
  micId: string;
  field: string;
  value: string;
}

export default function AdminAllMicsList() {
  const [allMics, setAllMics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingMicId, setSavingMicId] = useState<string | null>(null);
  const [savedMicId, setSavedMicId] = useState<string | null>(null);
  const [togglingField, setTogglingField] = useState<{ micId: string; field: string } | null>(null);

  useEffect(() => {
    fetchAllMics();
  }, []);

  const fetchAllMics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('open_mics_historical')
      .select('*')
      .order('venue_name', { ascending: true });

    if (error) {
      console.error('Error fetching all mics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mics from database',
        variant: 'destructive',
      });
    } else {
      console.log('Fetched mics:', data?.length);
      setAllMics(data || []);
    }
    setLoading(false);
  };

  // Fuzzy search - includes active status
  const filteredMics = allMics.filter(mic => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    const activeStatus = mic.active ? 'active' : 'inactive';
    
    return (
      mic.open_mic?.toLowerCase().includes(term) ||
      mic.venue_name?.toLowerCase().includes(term) ||
      mic.neighborhood?.toLowerCase().includes(term) ||
      mic.borough?.toLowerCase().includes(term) ||
      mic.location?.toLowerCase().includes(term) ||
      mic.day?.toLowerCase().includes(term) ||
      mic.city?.toLowerCase().includes(term) ||
      mic.venue_type?.toLowerCase().includes(term) ||
      activeStatus.includes(term)
    );
  });

  // All text-editable fields from open_mics_historical
  const editableFields = [
    { key: 'open_mic', label: 'Mic Name', displayKey: 'Open Mic' },
    { key: 'venue_name', label: 'Venue', displayKey: 'Venue Name' },
    { key: 'location', label: 'Address', displayKey: 'Location' },
    { key: 'neighborhood', label: 'Neighborhood', displayKey: 'Neighborhood' },
    { key: 'borough', label: 'Borough', displayKey: 'Borough' },
    { key: 'day', label: 'Day', displayKey: 'Day' },
    { key: 'start_time', label: 'Start Time', displayKey: 'Start Time' },
    { key: 'latest_end_time', label: 'End Time', displayKey: 'Latest End Time' },
    { key: 'cost', label: 'Cost', displayKey: 'Cost' },
    { key: 'stage_time', label: 'Stage Time', displayKey: 'Stage time' },
    { key: 'sign_up_instructions', label: 'Sign-Up', displayKey: 'Sign-Up Instructions' },
    { key: 'hosts_organizers', label: 'Host', displayKey: 'Host(s) / Organizer' },
    { key: 'venue_type', label: 'Venue Type', displayKey: 'Venue type' },
    { key: 'changes_updates', label: 'Changes/Updates', displayKey: 'Changes/updates' },
    { key: 'last_verified', label: 'Last Verified', displayKey: 'Last verified' },
    { key: 'other_rules', label: 'Other Rules', displayKey: 'Other Rules' },
    { key: 'city', label: 'City', displayKey: 'city' },
    { key: 'sms_response', label: 'SMS Response', displayKey: 'sms_response' },
  ];

  // Boolean toggle fields
  const booleanFields = [
    { key: 'active', label: 'Active', displayKey: 'active' },
    { key: 'signup_enabled', label: 'Signups Enabled', displayKey: 'signup_enabled' },
  ];

  const handleCellClick = (micId: string, dbKey: string, currentValue: string) => {
    setEditingCell({ micId, field: dbKey, value: currentValue || '' });
  };

  const handleToggle = async (micId: string, field: string, currentValue: boolean) => {
    setTogglingField({ micId, field });
    
    try {
      const { error } = await supabase
        .from('open_mics_historical')
        .update({ [field]: !currentValue })
        .eq('unique_identifier', micId);
      
      if (error) throw error;
      
      toast({
        title: 'Updated!',
        description: `${field} set to ${!currentValue ? 'ON' : 'OFF'}`,
      });
      
      // Optimistic update
      setAllMics(prev => prev.map(mic => 
        mic.unique_identifier === micId 
          ? { ...mic, [field]: !currentValue }
          : mic
      ));
      
    } catch (error) {
      console.error('Toggle error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update',
        variant: 'destructive',
      });
    } finally {
      setTogglingField(null);
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;

    setSavingMicId(editingCell.micId);
    
    try {
      // Build update object with db column key directly
      const dbUpdate: Record<string, any> = {
        [editingCell.field]: editingCell.value
      };
      
      const { error } = await supabase
        .from('open_mics_historical')
        .update(dbUpdate)
        .eq('unique_identifier', editingCell.micId);
      
      if (error) throw error;
      
      toast({
        title: 'Saved!',
        description: `Updated ${editingCell.field}`,
      });
      
      setSavedMicId(editingCell.micId);
      setTimeout(() => setSavedMicId(null), 2000);
      
      // Optimistic update instead of full refetch
      setAllMics(prev => prev.map(mic => 
        mic.unique_identifier === editingCell.micId 
          ? { ...mic, [editingCell.field]: editingCell.value }
          : mic
      ));
      
      setEditingCell(null);
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSavingMicId(null);
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-10">
        <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search mics, venues, neighborhoods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchTerm('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground mb-4">
        Showing {filteredMics.length} of {allMics.length} mics
      </div>

      {/* Mics Table */}
      <div className="space-y-4">
        {filteredMics.map((mic) => (
          <Card 
            key={mic.unique_identifier} 
            className={`relative transition-all ${
              savedMicId === mic.unique_identifier ? 'ring-2 ring-green-500' : ''
            } ${
              !mic.active ? 'opacity-60 bg-muted/30' : ''
            }`}
          >
            {savedMicId === mic.unique_identifier && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
            <CardContent className="p-4">
              {/* Status Toggles Header */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant={mic.active ? "default" : "destructive"} className="text-xs">
                    {mic.active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                {booleanFields.map(({ key, label }) => {
                  const isToggling = togglingField?.micId === mic.unique_identifier && togglingField?.field === key;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={mic[key] ?? false}
                        onCheckedChange={() => handleToggle(mic.unique_identifier, key, mic[key] ?? false)}
                        disabled={isToggling}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <span className="text-xs text-muted-foreground">
                        {isToggling ? <Loader2 className="w-3 h-3 animate-spin" /> : label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {editableFields.map(({ key, label }) => {
                  const isEditing = editingCell?.micId === mic.unique_identifier && editingCell?.field === key;
                  const displayValue = mic[key] || '';

                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {label}
                      </label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="h-8"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={savingMicId === mic.unique_identifier}
                              className="h-8"
                            >
                              {savingMicId === mic.unique_identifier ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-8"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(mic.unique_identifier, key, displayValue)}
                          className="text-sm p-2 rounded border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer min-h-[32px] transition-colors"
                        >
                          {displayValue || <span className="text-muted-foreground italic">empty</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMics.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          {searchTerm ? `No mics found matching "${searchTerm}"` : 'No mics found in database'}
        </div>
      )}
    </div>
  );
}
