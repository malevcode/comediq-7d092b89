import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Save, X, Loader2, Check } from 'lucide-react';
import { updateMic } from '@/api/openMics';
import { toast } from '@/hooks/use-toast';
import type { OpenMicDisplay } from '@/api/openMics';

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

  // Fuzzy search
  const filteredMics = allMics.filter(mic => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      mic.open_mic?.toLowerCase().includes(term) ||
      mic.venue_name?.toLowerCase().includes(term) ||
      mic.neighborhood?.toLowerCase().includes(term) ||
      mic.borough?.toLowerCase().includes(term) ||
      mic.location?.toLowerCase().includes(term) ||
      mic.day?.toLowerCase().includes(term)
    );
  });

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
  ];

  const handleCellClick = (micId: string, displayKey: string, currentValue: string) => {
    setEditingCell({ micId, field: displayKey, value: currentValue || '' });
  };

  const handleSave = async () => {
    if (!editingCell) return;

    setSavingMicId(editingCell.micId);
    
    try {
      await updateMic(editingCell.micId, {
        [editingCell.field]: editingCell.value
      } as Partial<OpenMicDisplay>);
      
      toast({
        title: 'Saved!',
        description: `Updated ${editingCell.field}`,
      });
      
      setSavedMicId(editingCell.micId);
      setTimeout(() => setSavedMicId(null), 2000);
      setEditingCell(null);
      
      // Refresh the data
      fetchAllMics();
      
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
          <Card key={mic.unique_identifier} className={`relative ${savedMicId === mic.unique_identifier ? 'ring-2 ring-green-500' : ''}`}>
            {savedMicId === mic.unique_identifier && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {editableFields.map(({ key, label, displayKey }) => {
                  const isEditing = editingCell?.micId === mic.unique_identifier && editingCell?.field === displayKey;
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
                          onClick={() => handleCellClick(mic.unique_identifier, displayKey, displayValue)}
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
