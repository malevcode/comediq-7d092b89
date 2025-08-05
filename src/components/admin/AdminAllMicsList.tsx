import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import AdminMicEditModal from './AdminMicEditModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const PAGE_SIZE = 10;
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
  const { user } = useAuth();
  const adminName = user?.user_metadata?.username || user?.email || 'Admin';

  useEffect(() => {
    const fetchMics = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('open_mics_july').select('*');
      if (!error && data) setMics(data);
      setLoading(false);
    };
    fetchMics();
  }, []);

  const filteredMics = mics.filter(mic => {
    const s = search.toLowerCase();
    return (
      mic['Open Mic']?.toLowerCase().includes(s) ||
      mic['Venue Name']?.toLowerCase().includes(s) ||
      mic['Borough']?.toLowerCase().includes(s)
    );
  });

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
      // Insert into historical first
      const { error: histError } = await supabase.from('open_mics_historical').insert([insertData]);
      if (histError) {
        toast({ title: 'Error', description: 'Failed to add to historical: ' + histError.message, variant: 'destructive' });
        return;
      }
      // Then insert into July
      const { error } = await supabase.from('open_mics_active').insert([insertData]);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setMics(mics => [{ ...insertData }, ...mics]);
        toast({ title: 'Mic added', description: 'New mic has been added.' });
        handleModalClose();
      }
    } else {
      // Update with new unique_identifier
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

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <Input
          placeholder="Search by mic, venue, or borough..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80"
        />
        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold" onClick={handleAdd}>
          + Add New Mic
        </Button>
      </div>
      {loading ? (
        <div className="w-full flex justify-center py-10">
          <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
        </div>
      ) : filteredMics.length === 0 ? (
        <div className="text-gray-500 text-center">No mics found.</div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredMics.slice(0, visibleCount).map(mic => (
              <div key={mic.unique_identifier} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border rounded-lg p-4 shadow-sm">
                <div>
                  <div className="font-bold text-md text-gray-900">{mic['Open Mic']}</div>
                  <div className="text-sm text-gray-600">Venue: {mic['Venue Name'] || 'Unknown'} | Borough: {mic['Borough'] || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">Day: <span className="font-semibold">{mic['Day'] || 'Unknown'}</span> | Time: <span className="font-semibold">{mic['Start Time'] || 'Unknown'}</span></div>
                </div>
                <Button className="mt-2 sm:mt-0" size="sm" variant="outline" onClick={() => handleEdit(mic)}>Edit</Button>
              </div>
            ))}
          </div>
          {visibleCount < filteredMics.length && (
            <div className="flex justify-center w-full mt-6">
              <Button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} variant="outline" className="bg-orange-100 hover:bg-orange-200 text-orange-700">Show More</Button>
            </div>
          )}
        </>
      )}
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