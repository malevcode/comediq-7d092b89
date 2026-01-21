import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useBulkOperations = (mics: any[], setMics: (mics: any[]) => void) => {
  const [selectedMics, setSelectedMics] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleSelectMic = (uniqueIdentifier: string, checked: boolean) => {
    const newSelected = new Set(selectedMics);
    if (checked) {
      newSelected.add(uniqueIdentifier);
    } else {
      newSelected.delete(uniqueIdentifier);
    }
    setSelectedMics(newSelected);
  };

  const handleSelectAll = (checked: boolean, filteredMics: any[]) => {
    if (checked) {
      setSelectedMics(new Set(filteredMics.map(mic => mic.unique_identifier)));
    } else {
      setSelectedMics(new Set());
    }
  };

  const handleBulkToggleStatus = async (makeActive: boolean) => {
    if (selectedMics.size === 0) {
      toast({ title: 'No Selection', description: 'Please select mics to update.', variant: 'destructive' });
      return;
    }

    // Check if selected mics are already in the desired state
    const selectedMicObjects = mics.filter(mic => selectedMics.has(mic.unique_identifier));
    const alreadyInDesiredState = selectedMicObjects.filter(mic => 
      makeActive ? (mic.active === true || mic.active === 1) : (mic.active !== true && mic.active !== 1)
    );

    if (alreadyInDesiredState.length === selectedMicObjects.length) {
      // All selected mics are already in the desired state
      const statusText = makeActive ? 'active' : 'inactive';
      toast({ 
        title: 'No Changes Needed', 
        description: `All selected mics are already ${statusText}.`, 
        variant: 'destructive' 
      });
      return;
    }

    // Filter out mics that are already in the desired state
    const micsToUpdate = selectedMicObjects.filter(mic => 
      makeActive ? (mic.active !== true && mic.active !== 1) : (mic.active === true || mic.active === 1)
    );

    if (micsToUpdate.length === 0) {
      const statusText = makeActive ? 'active' : 'inactive';
      toast({ 
        title: 'No Changes Needed', 
        description: `All selected mics are already ${statusText}.`, 
        variant: 'destructive' 
      });
      return;
    }

    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('open_mics_historical')
        .update({ active: makeActive } as any)
        .in('unique_identifier', micsToUpdate.map(mic => mic.unique_identifier));

      if (error) {
        toast({ title: 'Error', description: 'Failed to update mics: ' + error.message, variant: 'destructive' });
      } else {
        // Update local state
        setMics(mics.map(mic => 
          micsToUpdate.some(m => m.unique_identifier === mic.unique_identifier)
            ? { ...mic, active: makeActive }
            : mic
        ));
        setSelectedMics(new Set());
        
        const statusText = makeActive ? 'active' : 'inactive';
        const skippedCount = selectedMicObjects.length - micsToUpdate.length;
        
        let description = `Updated ${micsToUpdate.length} mic${micsToUpdate.length === 1 ? '' : 's'} to ${statusText}.`;
        if (skippedCount > 0) {
          description += ` ${skippedCount} mic${skippedCount === 1 ? '' : 's'} were already ${statusText}.`;
        }
        
        toast({ 
          title: 'Success', 
          description: description
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMics.size === 0) {
      toast({ title: 'No Selection', description: 'Please select mics to delete.', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedMics.size} mic${selectedMics.size === 1 ? '' : 's'}? This action cannot be undone.`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('open_mics_historical')
        .delete()
        .in('unique_identifier', Array.from(selectedMics));

      if (error) {
        toast({ title: 'Error', description: 'Failed to delete mics: ' + error.message, variant: 'destructive' });
      } else {
        // Update local state
        setMics(mics.filter(mic => !selectedMics.has(mic.unique_identifier)));
        setSelectedMics(new Set());
        toast({ 
          title: 'Success', 
          description: `Deleted ${selectedMics.size} mic${selectedMics.size === 1 ? '' : 's'}.` 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedMics.size === 0) {
      toast({ title: 'No Selection', description: 'Please select mics to export.', variant: 'destructive' });
      return;
    }

    const micsToExport = mics.filter(mic => selectedMics.has(mic.unique_identifier));
    
    // Convert to CSV format
    const headers = [
      'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 
      'Neighborhood', 'Location', 'Venue Type', 'Cost', 'Stage Time', 
      'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/Updates', 
      'Last Verified', 'Other Rules', 'Active'
    ];
    
    const csvContent = [
      headers.join(','),
      ...micsToExport.map(mic => [
        `"${mic.open_mic || ''}"`,
        `"${mic.day || ''}"`,
        `"${mic.start_time || ''}"`,
        `"${mic.latest_end_time || ''}"`,
        `"${mic.venue_name || ''}"`,
        `"${mic.borough || ''}"`,
        `"${mic.neighborhood || ''}"`,
        `"${mic.location || ''}"`,
        `"${mic.venue_type || ''}"`,
        `"${mic.cost || ''}"`,
        `"${mic.stage_time || ''}"`,
        `"${mic.sign_up_instructions || ''}"`,
        `"${mic.hosts_organizers || ''}"`,
        `"${mic.changes_updates || ''}"`,
        `"${mic.last_verified || ''}"`,
        `"${mic.other_rules || ''}"`,
        mic.active ? 'true' : 'false'
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `open_mics_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ 
      title: 'Export Complete', 
      description: `Exported ${selectedMics.size} mic${selectedMics.size === 1 ? '' : 's'} to CSV.` 
    });
  };

  return {
    selectedMics,
    setSelectedMics,
    bulkLoading,
    handleSelectMic,
    handleSelectAll,
    handleBulkToggleStatus,
    handleBulkDelete,
    handleBulkExport,
  };
}; 