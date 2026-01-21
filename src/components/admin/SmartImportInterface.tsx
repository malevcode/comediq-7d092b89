import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, PenLine, Loader2, Sparkles, ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { ParsedMicsTable, type ParsedMic } from './ParsedMicsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export function SmartImportInterface() {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [parsedMics, setParsedMics] = useState<ParsedMic[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  
  // Manual entry form
  const [manualForm, setManualForm] = useState({
    open_mic: '',
    venue_name: '',
    day: '',
    start_time: '',
    borough: '',
    neighborhood: '',
    location: '',
    cost: '',
    stage_time: '',
    sign_up_instructions: '',
    hosts: '',
    instagram_handle: ''
  });

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const newImages: { file: File; preview: string; base64: string }[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      const preview = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      newImages.push({ file, preview, base64 });
    }
    
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleParse = async () => {
    if (!textInput.trim() && images.length === 0) {
      toast({ title: 'Nothing to parse', description: 'Please enter text or upload images.', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-mic-data', {
        body: {
          text: textInput.trim() || null,
          images: images.map(img => img.base64)
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({ title: 'Parse error', description: data.error, variant: 'destructive' });
        return;
      }

      const mics: ParsedMic[] = (data.mics || []).map((mic: any, index: number) => ({
        id: `parsed-${Date.now()}-${index}`,
        open_mic: mic.open_mic || '',
        venue_name: mic.venue_name || '',
        day: mic.day || '',
        start_time: mic.start_time || '',
        latest_end_time: mic.latest_end_time || '',
        borough: mic.borough || '',
        neighborhood: mic.neighborhood || '',
        location: mic.location || '',
        venue_type: mic.venue_type || '',
        cost: mic.cost || '',
        stage_time: mic.stage_time || '',
        sign_up_instructions: mic.sign_up_instructions || '',
        hosts: mic.hosts || '',
        instagram_handle: mic.instagram_handle || '',
        notes: mic.notes || '',
        selected: true
      }));

      if (mics.length === 0) {
        toast({ title: 'No mics found', description: 'AI could not extract any open mic data from the input.' });
        return;
      }

      setParsedMics(mics);
      setStep('preview');
      toast({ title: 'Parsed successfully', description: `Found ${mics.length} open mic(s).` });
    } catch (error: any) {
      console.error('Parse error:', error);
      toast({ title: 'Parse failed', description: error.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualForm.open_mic.trim() || !manualForm.venue_name.trim()) {
      toast({ title: 'Missing required fields', description: 'Open Mic name and Venue are required.', variant: 'destructive' });
      return;
    }

    const newMic: ParsedMic = {
      id: `manual-${Date.now()}`,
      ...manualForm,
      selected: true
    };

    setParsedMics(prev => [...prev, newMic]);
    setManualForm({
      open_mic: '',
      venue_name: '',
      day: '',
      start_time: '',
      borough: '',
      neighborhood: '',
      location: '',
      cost: '',
      stage_time: '',
      sign_up_instructions: '',
      hosts: '',
      instagram_handle: ''
    });
    setStep('preview');
    toast({ title: 'Added', description: 'Manual entry added to preview.' });
  };

  const handleUpdateMic = (id: string, field: keyof ParsedMic, value: any) => {
    setParsedMics(prev => prev.map(mic => 
      mic.id === id ? { ...mic, [field]: value } : mic
    ));
  };

  const handleRemoveMic = (id: string) => {
    setParsedMics(prev => prev.filter(mic => mic.id !== id));
  };

  const generateUniqueId = (mic: ParsedMic): string => {
    const base = `${mic.venue_name}-${mic.day}-${mic.start_time}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${Date.now().toString(36)}`;
  };

  const handleImport = async () => {
    const selectedMics = parsedMics.filter(m => m.selected);
    
    if (selectedMics.length === 0) {
      toast({ title: 'No mics selected', description: 'Please select at least one mic to import.', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const rows = selectedMics.map(mic => ({
        unique_identifier: generateUniqueId(mic),
        open_mic: mic.open_mic,
        venue_name: mic.venue_name,
        day: mic.day,
        start_time: mic.start_time,
        latest_end_time: mic.latest_end_time || null,
        borough: mic.borough || null,
        neighborhood: mic.neighborhood || null,
        location: mic.location || null,
        venue_type: mic.venue_type || null,
        cost: mic.cost || null,
        stage_time: mic.stage_time || null,
        sign_up_instructions: mic.sign_up_instructions || null,
        hosts_organizers: mic.hosts || null,
        instagram_handle: mic.instagram_handle || null,
        active: true,
        signup_enabled: false
      }));

      const { error } = await supabase
        .from('open_mics_historical')
        .insert(rows);

      if (error) throw error;

      toast({ 
        title: 'Import successful', 
        description: `${selectedMics.length} mic(s) added to database.` 
      });

      // Reset state
      setParsedMics([]);
      setTextInput('');
      setImages([]);
      setStep('input');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ 
        title: 'Import failed', 
        description: error.message || 'Could not save to database.', 
        variant: 'destructive' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleBack = () => {
    setStep('input');
  };

  if (step === 'preview') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Review & Import ({parsedMics.filter(m => m.selected).length} selected)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParsedMicsTable
            mics={parsedMics}
            onUpdate={handleUpdateMic}
            onRemove={handleRemoveMic}
          />
          
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={handleBack}>
              Back to Input
            </Button>
            <Button onClick={handleImport} disabled={isImporting || parsedMics.filter(m => m.selected).length === 0}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>Import {parsedMics.filter(m => m.selected).length} Mic(s)</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          Smart Import
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Paste Text</span>
              <span className="sm:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Images</span>
              <span className="sm:hidden">Images</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div>
              <Label htmlFor="text-input">Paste Instagram DMs, schedules, or any text</Label>
              <Textarea
                id="text-input"
                placeholder="Paste any unstructured text here... Instagram DMs, emails, schedules, Google Form responses..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] mt-2"
              />
            </div>
            <Button onClick={handleParse} disabled={isParsing || !textInput.trim()}>
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse with AI
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('image-upload')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary');
                handleImageUpload(e.dataTransfer.files);
              }}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Drag & drop poster images here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP supported
              </p>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="image-text">Additional context (optional)</Label>
              <Textarea
                id="image-text"
                placeholder="Add any additional text to help the AI understand the images..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[80px] mt-2"
              />
            </div>

            <Button onClick={handleParse} disabled={isParsing || images.length === 0}>
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract from Images
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-name">Open Mic Name *</Label>
                <Input
                  id="manual-name"
                  value={manualForm.open_mic}
                  onChange={(e) => setManualForm(prev => ({ ...prev, open_mic: e.target.value }))}
                  placeholder="Comedy Night at Joe's"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-venue">Venue Name *</Label>
                <Input
                  id="manual-venue"
                  value={manualForm.venue_name}
                  onChange={(e) => setManualForm(prev => ({ ...prev, venue_name: e.target.value }))}
                  placeholder="Joe's Bar"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Day</Label>
                <Select
                  value={manualForm.day}
                  onValueChange={(value) => setManualForm(prev => ({ ...prev, day: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manual-time">Start Time</Label>
                <Input
                  id="manual-time"
                  value={manualForm.start_time}
                  onChange={(e) => setManualForm(prev => ({ ...prev, start_time: e.target.value }))}
                  placeholder="8:00 PM"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Borough</Label>
                <Select
                  value={manualForm.borough}
                  onValueChange={(value) => setManualForm(prev => ({ ...prev, borough: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select borough" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOROUGHS.map(borough => (
                      <SelectItem key={borough} value={borough}>{borough}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manual-neighborhood">Neighborhood</Label>
                <Input
                  id="manual-neighborhood"
                  value={manualForm.neighborhood}
                  onChange={(e) => setManualForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="East Village"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="manual-location">Full Address</Label>
                <Input
                  id="manual-location"
                  value={manualForm.location}
                  onChange={(e) => setManualForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="123 Main St, New York, NY"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-cost">Cost</Label>
                <Input
                  id="manual-cost"
                  value={manualForm.cost}
                  onChange={(e) => setManualForm(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="Free / $5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-stage">Stage Time</Label>
                <Input
                  id="manual-stage"
                  value={manualForm.stage_time}
                  onChange={(e) => setManualForm(prev => ({ ...prev, stage_time: e.target.value }))}
                  placeholder="5 minutes"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-hosts">Host(s)</Label>
                <Input
                  id="manual-hosts"
                  value={manualForm.hosts}
                  onChange={(e) => setManualForm(prev => ({ ...prev, hosts: e.target.value }))}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-ig">Instagram Handle</Label>
                <Input
                  id="manual-ig"
                  value={manualForm.instagram_handle}
                  onChange={(e) => setManualForm(prev => ({ ...prev, instagram_handle: e.target.value }))}
                  placeholder="comedynight"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="manual-signup">Sign-Up Instructions</Label>
                <Input
                  id="manual-signup"
                  value={manualForm.sign_up_instructions}
                  onChange={(e) => setManualForm(prev => ({ ...prev, sign_up_instructions: e.target.value }))}
                  placeholder="Sign up at 7pm, list at bar"
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleManualAdd} disabled={!manualForm.open_mic.trim() || !manualForm.venue_name.trim()}>
              <PenLine className="w-4 h-4 mr-2" />
              Add to Preview
            </Button>
          </TabsContent>
        </Tabs>

        {parsedMics.length > 0 && step === 'input' && (
          <div className="mt-6 pt-6 border-t">
            <Button onClick={() => setStep('preview')} variant="outline" className="w-full">
              View {parsedMics.length} parsed mic(s) in preview
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
