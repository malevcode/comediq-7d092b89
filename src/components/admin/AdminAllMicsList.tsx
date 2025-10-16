import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Trash2, Power, PowerOff, Filter } from 'lucide-react';
import AdminMicEditModal from './AdminMicEditModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useMicFilters, MicFilters } from './hooks/useMicFilters';
import { useBulkOperations } from './hooks/useBulkOperations';
import { MicFiltersPanel } from './MicFiltersPanel';
import { MicListItem } from './MicListItem';

const PAGE_SIZE = 100;
const OPEN_MIC_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time', 'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates', 'Last verified', 'Other Rules', 'Help other comics! Leave reviews', 'Formerly verified'
];
const EMPTY_MIC = Object.fromEntries(OPEN_MIC_FIELDS.map(f => [f, '']));

const AdminAllMicsList = () => {
  const [mics, setMics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedMic, setSelectedMic] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<MicFilters>({
    borough: 'all',
    day: 'all',
    cost: 'all',
    verifiedFrom: null,
    verifiedTo: null,
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { user } = useAuth();
  const adminName = user?.user_metadata?.username || user?.email || 'Admin';

  // Use custom hooks
  const filteredMics = useMicFilters(mics, search, activeTab, filters, sortBy, sortOrder);
  const {
    selectedMics,
    setSelectedMics,
    bulkLoading,
    handleSelectMic,
    handleSelectAll,
    handleBulkToggleStatus,
    handleBulkDelete,
    handleBulkExport,
  } = useBulkOperations(mics, setMics);

  // Reset visible count when switching tabs
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab]);

  // Reset selected mics when switching tabs
  useEffect(() => {
    setSelectedMics(new Set());
  }, [activeTab, setSelectedMics]);

  // Reset filters when switching tabs
  useEffect(() => {
    setFilters({
      borough: 'all',
      day: 'all',
      cost: 'all',
      verifiedFrom: null,
      verifiedTo: null,
    });
  }, [activeTab]);

  useEffect(() => {
    const fetchMics = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('open_mics_historical').select('*');
      if (!error && data) setMics(data);
      setLoading(false);
    };
    fetchMics();
  }, []);

  const handleEdit = (mic: any) => {
    setSelectedMic(mic);
    setIsAdding(false);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMic({ ...EMPTY_MIC });
    setIsAdding(true);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedMic(null);
    setIsAdding(false);
  };

  const handleSave = async (updated: any) => {
    // Always regenerate unique_identifier from form data
    const day = updated['Day']?.trim() || '';
    const startTime = updated['Start Time']?.trim() || '';
    const changes = updated['Changes/updates']?.trim().replace(/\s+/g, '') || '';
    const venue = updated['Venue Name']?.trim() || '';
    const unique_identifier = `${day}_${startTime}_${changes}_${venue}`;
    const insertData = { ...updated, unique_identifier };

    // Check for duplicate unique_identifier (exclude current mic if editing)
    const { data: dupes, error: dupeError } = await supabase
      .from('open_mics_historical')
      .select('unique_identifier')
      .eq('unique_identifier', unique_identifier);
    if (dupeError) {
      toast({ title: 'Error', description: dupeError.message, variant: 'destructive' });
      return;
    }
    if (
      (isAdding && dupes && dupes.length > 0) ||
      (!isAdding && dupes && dupes.length > 0 && unique_identifier !== selectedMic.unique_identifier)
    ) {
      toast({ title: 'Duplicate', description: 'A mic with this unique identifier already exists.', variant: 'destructive' });
      return;
    }

    if (isAdding) {
      // Insert into historical table with active: true for new mics
      const insertDataWithActive = { ...insertData, active: true };
      const { error } = await supabase.from('open_mics_historical').insert([insertDataWithActive]);
      if (error) {
        toast({ title: 'Error', description: 'Failed to add mic: ' + error.message, variant: 'destructive' });
      } else {
        setMics(mics => [{ ...insertDataWithActive }, ...mics]);
        toast({ title: 'Mic added', description: 'New mic has been added.' });
        handleModalClose();
      }
    } else {
      // Update existing mic
      const { error } = await supabase
        .from('open_mics_historical')
        .update({ ...insertData })
        .eq('unique_identifier', selectedMic.unique_identifier);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setMics(mics => mics.map(m => m.unique_identifier === selectedMic.unique_identifier ? insertData : m));
        toast({ title: 'Mic updated', description: 'Mic information saved.' });
        handleModalClose();
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      borough: 'all',
      day: 'all',
      cost: 'all',
      verifiedFrom: null,
      verifiedTo: null,
    });
    setSortBy('name');
    setSortOrder('asc');
    setSearch('');
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <Input
          placeholder="Search by mic, venue, or borough..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80"
        />
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold" onClick={handleAdd}>
          + Add New Mic
        </Button>
      </div>

      {/* Advanced Filters */}
      <MicFiltersPanel
        showFilters={showFilters}
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        resetFilters={resetFilters}
      />

      {/* Bulk Operations Bar */}
      {selectedMics.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="text-sm text-blue-700 font-medium">
              {selectedMics.size} mic{selectedMics.size === 1 ? '' : 's'} selected
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkToggleStatus(true)}
                disabled={bulkLoading}
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <Power className="w-4 h-4 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkToggleStatus(false)}
                disabled={bulkLoading}
                className="text-orange-700 border-orange-300 hover:bg-orange-50"
              >
                <PowerOff className="w-4 h-4 mr-1" />
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkExport}
                disabled={bulkLoading}
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active">Active Mics</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Mics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          {loading ? (
            <div className="w-full flex justify-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
            </div>
          ) : filteredMics.length === 0 ? (
            <div className="text-gray-500 text-center">No active mics found.</div>
          ) : (
            <>
              {/* Select All */}
              <div className="mb-3 flex items-center gap-2">
                <Checkbox
                  checked={selectedMics.size === filteredMics.length && filteredMics.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean, filteredMics)}
                />
                <span className="text-sm text-gray-600">
                  Select all ({filteredMics.length} mics)
                </span>
              </div>
              
              <div className="space-y-4">
                {filteredMics.slice(0, visibleCount).map(mic => (
                  <MicListItem
                    key={mic.unique_identifier}
                    mic={mic}
                    isSelected={selectedMics.has(mic.unique_identifier)}
                    onSelect={(checked) => handleSelectMic(mic.unique_identifier, checked)}
                    onEdit={() => handleEdit(mic)}
                  />
                ))}
              </div>
              {visibleCount < filteredMics.length && (
                <div className="flex justify-center w-full mt-6">
                  <Button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} variant="outline" className="bg-orange-100 hover:bg-orange-200 text-orange-700">Show More</Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-0">
          {loading ? (
            <div className="w-full flex justify-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
            </div>
          ) : filteredMics.length === 0 ? (
            <div className="text-gray-500 text-center">No inactive mics found.</div>
          ) : (
            <>
              {/* Select All */}
              <div className="mb-3 flex items-center gap-2">
                <Checkbox
                  checked={selectedMics.size === filteredMics.length && filteredMics.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean, filteredMics)}
                />
                <span className="text-sm text-gray-600">
                  Select all ({filteredMics.length} mics)
                </span>
              </div>
              
              <div className="space-y-4">
                {filteredMics.slice(0, visibleCount).map(mic => (
                  <MicListItem
                    key={mic.unique_identifier}
                    mic={mic}
                    isSelected={selectedMics.has(mic.unique_identifier)}
                    onSelect={(checked) => handleSelectMic(mic.unique_identifier, checked)}
                    onEdit={() => handleEdit(mic)}
                    isInactive={true}
                  />
                ))}
              </div>
              {visibleCount < filteredMics.length && (
                <div className="flex justify-center w-full mt-6">
                  <Button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} variant="outline" className="bg-orange-100 hover:bg-orange-200 text-orange-700">Show More</Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
      
      <AdminMicEditModal
        open={modalOpen}
        onClose={handleModalClose}
        mic={selectedMic}
        onSave={handleSave}
        adminName={adminName}
      />
    </div>
  );
};

export default AdminAllMicsList; 