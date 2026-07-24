import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { submitAudienceShow } from '@/api/audienceShows';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft } from 'lucide-react';

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const SHOW_TYPES = ['Stand-up', 'Variety', 'Improv', 'Sketch', 'Roast', 'Other'];

export default function AddShow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [borough, setBorough] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [doorsTime, setDoorsTime] = useState('');
  const [description, setDescription] = useState('');
  const [lineup, setLineup] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [showType, setShowType] = useState('');
  const [hostName, setHostName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');

  const submitMutation = useMutation({
    mutationFn: submitAudienceShow,
    onSuccess: () => {
      toast({
        title: 'Show submitted!',
        description: 'Your show has been submitted for review and will appear once approved.',
      });
      navigate('/laugh');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit show',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth?redirect=/add-show');
      return;
    }

    submitMutation.mutate({
      title,
      venue_name: venueName,
      venue_address: venueAddress || null,
      borough: borough || null,
      show_date: showDate,
      show_time: showTime,
      doors_time: doorsTime || null,
      description: description || null,
      lineup: lineup || null,
      ticket_url: ticketUrl || null,
      ticket_price: ticketPrice || null,
      show_type: showType || null,
      host_name: hostName || null,
      instagram_handle: instagramHandle || null,
      image_url: null,
      expected_audience: null,
      age_restriction: null,
      is_featured: false,
      is_recurring: false,
      recurrence_pattern: null,
      recurrence_day: null,
      parent_show_id: null,
      is_active: true,
      source: 'user',
      source_event_id: null,
    });
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 pt-20">
      <PageHeader
        title="Submit a Show" 
        subtitle="Add your comedy show to our listings"
      />
      
      <div className="max-w-2xl mx-auto px-4 page-content-offset pb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/laugh')}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shows
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Show Details</CardTitle>
            <CardDescription>
              Fill out the details below. Your show will be reviewed before appearing on the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Show Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Friday Night Comedy"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venueName">Venue Name *</Label>
                  <Input
                    id="venueName"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g., The Comedy Cellar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="borough">Borough</Label>
                  <Select value={borough} onValueChange={setBorough}>
                    <SelectTrigger id="borough">
                      <SelectValue placeholder="Select borough" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOROUGHS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="venueAddress">Venue Address</Label>
                <Input
                  id="venueAddress"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="e.g., 117 MacDougal St, New York, NY"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="showDate">Show Date *</Label>
                  <Input
                    id="showDate"
                    type="date"
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="showTime">Show Time *</Label>
                  <Input
                    id="showTime"
                    type="time"
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="doorsTime">Doors Time</Label>
                  <Input
                    id="doorsTime"
                    type="time"
                    value={doorsTime}
                    onChange={(e) => setDoorsTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="showType">Show Type</Label>
                  <Select value={showType} onValueChange={setShowType}>
                    <SelectTrigger id="showType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOW_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ticketPrice">Ticket Price</Label>
                  <Input
                    id="ticketPrice"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="e.g., Free, $10, $15-20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your show..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="lineup">Lineup</Label>
                <Textarea
                  id="lineup"
                  value={lineup}
                  onChange={(e) => setLineup(e.target.value)}
                  placeholder="List the performers (one per line or comma-separated)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hostName">Host Name</Label>
                  <Input
                    id="hostName"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Who's hosting?"
                  />
                </div>
                <div>
                  <Label htmlFor="instagramHandle">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@yourshow"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ticketUrl">Ticket/RSVP Link</Label>
                <Input
                  id="ticketUrl"
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Show'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
