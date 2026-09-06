import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { claimHostStatus } from '@/api/signups';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOpenMics } from '@/hooks/useOpenMics';
import { Check, ChevronsUpDown, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddMicForm } from './AddMicForm';

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

export function ClaimMicForm() {
  const [selectedMic, setSelectedMic] = useState<{ id: string; name: string; venue: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: mics } = useOpenMics();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: claimHostStatus,
    onSuccess: () => {
      toast({
        title: 'Claim submitted',
        description: 'Your host claim is pending admin verification.',
      });
      queryClient.invalidateQueries({ queryKey: ['hostStatus'] });
      setSelectedMic(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredMics = useMemo(() => {
    if (!mics) return [];
    if (!searchQuery) return mics.slice(0, 50); // Show first 50 if no search
    
    const query = searchQuery.toLowerCase();
    return mics.filter(mic => 
      mic.openMic?.toLowerCase().includes(query) ||
      mic.venueName?.toLowerCase().includes(query) ||
      mic.day?.toLowerCase().includes(query) ||
      mic.borough?.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [mics, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMic) {
      claimMutation.mutate(selectedMic.id);
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowAddForm(false)} className="text-[#07111f] hover:bg-white/40 dark:text-white dark:hover:bg-white/10">
          ← Back to Claim Mic
        </Button>
        <AddMicForm onSuccess={() => setShowAddForm(false)} />
      </div>
    );
  }

  return (
    <Card className={glassCardClass}>
      <CardHeader className={glassHeaderClass}>
        <CardTitle>Claim a Mic</CardTitle>
        <CardDescription className={mutedTextClass}>
          Request to be verified as a host for an open mic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={`w-full justify-between ${glassFieldClass}`}
              >
                {selectedMic ? (
                  <span className="truncate">{selectedMic.name} at {selectedMic.venue}</span>
                ) : (
                  <span className={mutedTextClass}>Search for a mic...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] border border-[#07111f]/10 bg-white/90 p-0 shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/90" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search by name, venue, day, or borough..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-4 text-center">
                      <p className={`mb-2 text-sm ${mutedTextClass}`}>No mics found</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          setShowAddForm(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add a new mic
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredMics.map((mic) => (
                      <CommandItem
                        key={mic.uniqueIdentifier}
                        value={mic.uniqueIdentifier}
                        onSelect={() => {
                          setSelectedMic({
                            id: mic.uniqueIdentifier,
                            name: mic.openMic,
                            venue: mic.venueName,
                          });
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMic?.id === mic.uniqueIdentifier ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{mic.openMic}</span>
                          <span className={`text-xs ${mutedTextClass}`}>
                            {mic.venueName} • {mic.day} • {mic.borough}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            <Button type="submit" disabled={!selectedMic || claimMutation.isPending} className="flex-1">
              {claimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#07111f]/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-[#07111f]/50 dark:text-white/50">Or</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className={`h-auto min-h-10 w-full whitespace-normal px-3 py-2 text-center leading-snug ${glassFieldClass}`}
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            <span className="min-w-0 text-wrap">Don't see your mic? Add it to our database</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
