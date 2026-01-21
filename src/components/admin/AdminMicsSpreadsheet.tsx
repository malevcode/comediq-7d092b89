import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Download, Power, PowerOff, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBulkOperations } from './hooks/useBulkOperations';

interface AdminMicsSpreadsheetProps {
  mics: any[];
  setMics: (mics: any[]) => void;
  loading: boolean;
}

const COLUMN_CONFIG = [
  { key: 'day', label: 'Day', width: 'min-w-[80px]' },
  { key: 'start_time', label: 'Start', width: 'min-w-[80px]' },
  { key: 'active', label: 'Active', width: 'min-w-[70px]', isBoolean: true },
  { key: 'open_mic', label: 'Name', width: 'min-w-[180px]' },
  { key: 'venue_name', label: 'Venue', width: 'min-w-[150px]' },
  { key: 'location', label: 'Address', width: 'min-w-[200px]' },
  { key: 'neighborhood', label: 'Neighborhood', width: 'min-w-[120px]' },
  { key: 'borough', label: 'Borough', width: 'min-w-[100px]' },
  { key: 'city', label: 'City', width: 'min-w-[100px]' },
  { key: 'latest_end_time', label: 'End', width: 'min-w-[80px]' },
  { key: 'cost', label: 'Cost', width: 'min-w-[100px]' },
  { key: 'stage_time', label: 'Stage Time', width: 'min-w-[100px]' },
  { key: 'sign_up_instructions', label: 'Sign-Up', width: 'min-w-[200px]' },
  { key: 'hosts_organizers', label: 'Host', width: 'min-w-[150px]' },
  { key: 'venue_type', label: 'Venue Type', width: 'min-w-[100px]' },
  { key: 'changes_updates', label: 'Changes', width: 'min-w-[150px]' },
  { key: 'last_verified', label: 'Verified', width: 'min-w-[100px]' },
  { key: 'other_rules', label: 'Rules', width: 'min-w-[150px]' },
];

export const AdminMicsSpreadsheet = ({ mics, setMics, loading }: AdminMicsSpreadsheetProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    hosts_organizers: '__all__',
    venue_name: '__all__',
    borough: '__all__',
    day: '__all__',
    active: '__all__',
  });
  const [editingCell, setEditingCell] = useState<{ id: string; field: string; value: string } | null>(null);
  const [savingCellId, setSavingCellId] = useState<string | null>(null);

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

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const getUnique = (key: string) => {
      const values = mics
        .map(mic => mic[key])
        .filter(Boolean)
        .map(v => String(v).trim())
        .filter(v => v.length > 0);
      return [...new Set(values)].sort();
    };

    return {
      hosts_organizers: getUnique('hosts_organizers'),
      venue_name: getUnique('venue_name'),
      borough: getUnique('borough'),
      day: getUnique('day'),
    };
  }, [mics]);

  // Filter mics based on search and column filters
  const filteredMics = useMemo(() => {
    return mics.filter(mic => {
      // Text search
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const searchableFields = ['open_mic', 'venue_name', 'location', 'neighborhood', 'hosts_organizers'];
        const matches = searchableFields.some(field => 
          String(mic[field] || '').toLowerCase().includes(search)
        );
        if (!matches) return false;
      }

      // Column filters
      for (const [key, value] of Object.entries(filters)) {
        if (!value || value === '__all__') continue;
        
        if (key === 'active') {
          const isActive = mic.active === true || mic.active === 1;
          if (value === 'active' && !isActive) return false;
          if (value === 'inactive' && isActive) return false;
        } else {
          const micValue = String(mic[key] || '').toLowerCase();
          if (!micValue.includes(value.toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [mics, searchTerm, filters]);

  const handleCellClick = (mic: any, field: string) => {
    if (field === 'active') return; // Boolean handled separately
    setEditingCell({
      id: mic.unique_identifier,
      field,
      value: mic[field] || '',
    });
  };

  const handleSave = async () => {
    if (!editingCell) return;

    setSavingCellId(editingCell.id);
    try {
      const { error } = await supabase
        .from('open_mics_historical')
        .update({ [editingCell.field]: editingCell.value } as any)
        .eq('unique_identifier', editingCell.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to save: ' + error.message, variant: 'destructive' });
      } else {
        setMics(mics.map(mic =>
          mic.unique_identifier === editingCell.id
            ? { ...mic, [editingCell.field]: editingCell.value }
            : mic
        ));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSavingCellId(null);
      setEditingCell(null);
    }
  };

  const handleToggleActive = async (mic: any) => {
    const newValue = !(mic.active === true || mic.active === 1);
    setSavingCellId(mic.unique_identifier);
    
    try {
      const { error } = await supabase
        .from('open_mics_historical')
        .update({ active: newValue } as any)
        .eq('unique_identifier', mic.unique_identifier);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update: ' + error.message, variant: 'destructive' });
      } else {
        setMics(mics.map(m =>
          m.unique_identifier === mic.unique_identifier ? { ...m, active: newValue } : m
        ));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSavingCellId(null);
    }
  };

  const clearFilters = () => {
    setFilters({ hosts_organizers: '__all__', venue_name: '__all__', borough: '__all__', day: '__all__', active: '__all__' });
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v && v !== '__all__');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search mics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select value={filters.hosts_organizers} onValueChange={(v) => setFilters(f => ({ ...f, hosts_organizers: v }))}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Host" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Hosts</SelectItem>
            {filterOptions.hosts_organizers.map(host => (
              <SelectItem key={host} value={host} className="text-xs">{host}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.venue_name} onValueChange={(v) => setFilters(f => ({ ...f, venue_name: v }))}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Venues</SelectItem>
            {filterOptions.venue_name.map(venue => (
              <SelectItem key={venue} value={venue} className="text-xs">{venue}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.borough} onValueChange={(v) => setFilters(f => ({ ...f, borough: v }))}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Borough" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Boroughs</SelectItem>
            {filterOptions.borough.map(borough => (
              <SelectItem key={borough} value={borough} className="text-xs">{borough}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.day} onValueChange={(v) => setFilters(f => ({ ...f, day: v }))}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Days</SelectItem>
            {filterOptions.day.map(day => (
              <SelectItem key={day} value={day} className="text-xs">{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.active} onValueChange={(v) => setFilters(f => ({ ...f, active: v }))}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Status Bar with Bulk Actions */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {filteredMics.length} of {mics.length} mics
        </span>

        {selectedMics.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedMics.size} selected</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleStatus(true)}
              disabled={bulkLoading}
              className="h-7 text-xs"
            >
              <Power className="w-3 h-3 mr-1" />
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleStatus(false)}
              disabled={bulkLoading}
              className="h-7 text-xs"
            >
              <PowerOff className="w-3 h-3 mr-1" />
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkExport}
              disabled={bulkLoading}
              className="h-7 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="h-7 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="border rounded-lg overflow-x-auto bg-background">
        <Table>
          <TableHeader className="sticky top-0 bg-muted z-10">
            <TableRow className="h-[28px]">
              <TableHead className="w-[40px] px-2">
                <Checkbox
                  checked={filteredMics.length > 0 && selectedMics.size === filteredMics.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked, filteredMics)}
                />
              </TableHead>
              {COLUMN_CONFIG.map(col => (
                <TableHead key={col.key} className={`px-2 text-xs font-medium ${col.width}`}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMics.map(mic => {
              const isActive = mic.active === true || mic.active === 1;
              const isSelected = selectedMics.has(mic.unique_identifier);

              return (
                <TableRow
                  key={mic.unique_identifier}
                  className={`h-[21px] ${!isActive ? 'opacity-50' : ''} ${isSelected ? 'bg-muted/50' : ''}`}
                >
                  <TableCell className="px-2 py-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectMic(mic.unique_identifier, !!checked)}
                    />
                  </TableCell>
                  {COLUMN_CONFIG.map(col => {
                    const isEditing = editingCell?.id === mic.unique_identifier && editingCell?.field === col.key;
                    const isSaving = savingCellId === mic.unique_identifier;

                    if (col.isBoolean) {
                      return (
                        <TableCell key={col.key} className="px-2 py-0">
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={() => handleToggleActive(mic)}
                            disabled={isSaving}
                          />
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={col.key}
                        className={`px-2 py-0 text-xs ${col.width} max-w-[200px] cursor-pointer hover:bg-muted/30`}
                        onClick={() => handleCellClick(mic, col.key)}
                      >
                        {isEditing ? (
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={handleSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              else if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                            className="h-[19px] px-1 py-0 text-xs border-primary"
                          />
                        ) : (
                          <span className="truncate block" title={mic[col.key] || ''}>
                            {mic[col.key] || ''}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredMics.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No mics found matching your filters
          </div>
        )}
      </div>
    </div>
  );
};
