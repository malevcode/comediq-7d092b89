import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, LogIn, LayoutGrid, Table2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Clock, FileText, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminRequestList from '@/components/admin/AdminRequestList';
import AdminAllMicsList from '@/components/admin/AdminAllMicsList';
import { AdminMicsSpreadsheet } from '@/components/admin/AdminMicsSpreadsheet';
import HamburgerMenu from '@/components/HamburgerMenu';
import { MicAnalyticsDashboard } from '@/components/admin/MicAnalyticsDashboard';
import { UserAnalyticsDashboard } from '@/components/admin/UserAnalyticsDashboard';
import BulkImportInterface from '@/components/admin/BulkImportInterface';
import { SmartImportInterface } from '@/components/admin/SmartImportInterface';
import { AdminBannerAdsManager } from '@/components/admin/AdminBannerAdsManager';
import { SiteAnalyticsDashboard } from '@/components/admin/SiteAnalyticsDashboard';
import { AdminVenueSourcesManager } from '@/components/admin/AdminVenueSourcesManager';
import { AdminTodoBoard } from '@/components/admin/AdminTodoBoard';
import { SmartUpdateInterface } from '@/components/admin/SmartUpdateInterface';
import PageHeader from '@/components/PageHeader';
import { approveMicRequest, type MicFormData } from '@/api/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const OPEN_MIC_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time', 'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates', 'Last verified', 'Other Rules'
];

const EMPTY_MIC = Object.fromEntries(OPEN_MIC_FIELDS.map(f => [f, '']));

interface MicRequest {
  unique_identifier: string;
  show_title?: string;
  open_mic?: string;
  venue_name?: string;
  borough?: string;
  neighborhood?: string;
  location?: string;
  venue_type?: string;
  city?: string;
  day?: string;
  time?: string;
  start_time?: string;
  latest_end_time?: string;
  date?: string;
  cost?: string;
  hosts_organizers?: string;
  changes_updates?: string;
  other_rules?: string;
  created_at?: string;
  user_id?: string;
  reviewed?: boolean;
  review_status?: 'approved' | 'disapproved';
  [key: string]: any;
}

/**
 * Adds minutes to a time string, returns formatted result
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  if (!timeStr) return '';
  const cleaned = timeStr.trim();
  let hours: number, mins: number;

  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    hours = parseInt(match12[1]);
    mins = parseInt(match12[2]);
    const isPM = match12[3].toUpperCase() === 'PM';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      hours = parseInt(match24[1]);
      mins = parseInt(match24[2]);
    } else {
      return '';
    }
  }

  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  const period = newHours >= 12 ? 'PM' : 'AM';
  const displayHour = newHours % 12 || 12;
  return `${displayHour}:${newMins.toString().padStart(2, '0')} ${period}`;
}

const AdminInterface = () => {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [micRequests, setMicRequests] = useState<any[]>([]);
  const [allMics, setAllMics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [submitId, setSubmitId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState('analytics');
  const [visiblePending, setVisiblePending] = useState(10);
  const [visibleReviewed, setVisibleReviewed] = useState(10);
  const [micsViewMode, setMicsViewMode] = useState<'cards' | 'spreadsheet'>('spreadsheet');

  // Message submitter state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<{ req: any; missingFields: string[] } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    setVisiblePending(10);
    setVisibleReviewed(10);
  }, []);

  useEffect(() => {
    if (tab === 'pending') setVisiblePending(10);
    if (tab === 'reviewed') setVisibleReviewed(10);
  }, [tab]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: requestsData }, { data: micsData }] = await Promise.all([
        supabase.from('open_mics_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('open_mics_historical').select('*'),
      ]);
      if (requestsData) setMicRequests(requestsData as MicRequest[]);
      if (micsData) setAllMics(micsData);
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  const pendingRequests = micRequests.filter((r: MicRequest) => !r.reviewed);
  const reviewedRequests = micRequests.filter((r: MicRequest) => r.reviewed);

  /**
   * Smart autofill: when admin clicks Review, populate form from request data
   * AND look up venue in existing DB to fill gaps
   */
  const handleReview = useCallback(async (req: MicRequest) => {
    setReviewingId(req.unique_identifier);

    // Start with empty form, then layer in request data
    const startTime = req.time || req.start_time || '';
    const initialData: Record<string, string> = {
      ...EMPTY_MIC,
      'Open Mic': req.show_title || req.open_mic || '',
      'Venue Name': req.venue_name || '',
      'Borough': req.borough || '',
      'Neighborhood': req.neighborhood || '',
      'Location': req.location || '',
      'Venue type': req.venue_type || '',
      'Day': req.date || req.day || '',
      'Start Time': startTime,
      'Latest End Time': req.latest_end_time || '',
      'Cost': req.cost || '',
      'Host(s) / Organizer': req.hosts_organizers || '',
      'Changes/updates': req.changes_updates || '',
      'Other Rules': req.other_rules || '',
    };

    // Auto-calculate latest_end_time if missing but start_time exists
    if (!initialData['Latest End Time'] && initialData['Start Time']) {
      initialData['Latest End Time'] = addMinutesToTime(initialData['Start Time'], 90);
    }

    // If we have a venue name, look up in DB for additional data
    if (req.venue_name) {
      const { data: venueMatches } = await supabase
        .from('open_mics_historical')
        .select('venue_name, location, borough, neighborhood, city, venue_type')
        .ilike('venue_name', req.venue_name)
        .eq('active', true)
        .limit(1);

      if (venueMatches && venueMatches.length > 0) {
        const venue = venueMatches[0];
        // Only fill if the field is currently empty
        if (!initialData['Borough'] && venue.borough) initialData['Borough'] = venue.borough;
        if (!initialData['Neighborhood'] && venue.neighborhood) initialData['Neighborhood'] = venue.neighborhood;
        if (!initialData['Location'] && venue.location) initialData['Location'] = venue.location;
        if (!initialData['Venue type'] && venue.venue_type) initialData['Venue type'] = venue.venue_type;
      }
    }

    // Set last verified to today
    initialData['Last verified'] = new Date().toLocaleDateString('en-US');

    setFormData(initialData);
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate end time when start time changes
      if (field === 'Start Time' && value && !prev['Latest End Time']) {
        updated['Latest End Time'] = addMinutesToTime(value, 90);
      }
      return updated;
    });
  };

  const handleCancel = () => {
    setReviewingId(null);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from('open_mics_requests').update({ reviewed: true, status: 'disapproved' }).eq('unique_identifier', id);
    if (error) console.error('Update failed:', error);
    setMicRequests((prev: any[]) => prev.map((r: any) =>
      r.unique_identifier === id ? ({ ...r, reviewed: true } as any) : r
    ));
    setDeleting(false);
    setDeleteId(null);
    if (reviewingId === id) handleCancel();
  };

  const handleSubmit = async (id: string) => {
    setSubmitting(true);
    try {
      await approveMicRequest(id, formData as MicFormData);
      toast({ title: 'Success', description: 'Mic approved and added to database.' });
      const { data: requestsData } = await supabase
        .from('open_mics_requests').select('*').order('created_at', { ascending: false });
      if (requestsData) setMicRequests(requestsData as MicRequest[]);
      handleCancel();
    } catch (error: any) {
      console.error('Failed to approve mic:', error);
      toast({ title: 'Error', description: error.message || 'Could not approve mic.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setSubmitId(null);
    }
  };

  const handleMessageSubmitter = (req: any, missingFields: string[]) => {
    const micName = req.show_title || req.open_mic || 'your mic submission';
    const missingText = missingFields.length > 0
      ? `\n\nWe're missing the following info:\n• ${missingFields.join('\n• ')}`
      : '';
    
    setMessageTarget({ req, missingFields });
    setMessageText(
      `Hi! Thanks for submitting "${micName}" to Comediq. We'd love to get it listed but need a bit more info.${missingText}\n\nCould you help us fill in these details? Just reply to this message. Thanks!`
    );
    setMessageDialogOpen(true);
  };

  const sendMessage = async () => {
    if (!messageTarget || !messageText.trim()) return;
    setSendingMessage(true);
    
    // For now, copy to clipboard as a fallback since we don't have an in-app messaging system yet
    try {
      await navigator.clipboard.writeText(messageText);
      toast({ 
        title: 'Message copied to clipboard', 
        description: `User ID: ${messageTarget.req.user_id?.slice(0, 8)}... — Paste this in your preferred messaging channel.` 
      });
    } catch {
      toast({ title: 'Message ready', description: 'Copy the message manually.' });
    }
    
    setSendingMessage(false);
    setMessageDialogOpen(false);
    setMessageTarget(null);
  };

  if (!user) return <div>Please log in.</div>;
  if (!isAdmin) return <div>Not authorized. You are not an admin.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <PageHeader />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage open mic requests and content</p>
        </div>
        <Tabs defaultValue="analytics" className="w-full" onValueChange={setTab}>
          <TabsList className="mb-8 w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="analytics" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Mics</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Users</TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">All Mics</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Pending</TabsTrigger>
            <TabsTrigger value="reviewed" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Reviewed</TabsTrigger>
            <TabsTrigger value="ads" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Ads</TabsTrigger>
            <TabsTrigger value="site-analytics" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Site</TabsTrigger>
            <TabsTrigger value="smart-import" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Smart</TabsTrigger>
            <TabsTrigger value="bulk-import" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">CSV</TabsTrigger>
            <TabsTrigger value="venues" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Venues</TabsTrigger>
            <TabsTrigger value="todos" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">To-Dos</TabsTrigger>
            <TabsTrigger value="update" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">Update</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics">
            <Card className="mb-6 shadow-lg rounded-2xl border-0">
              <CardContent className="p-8 flex flex-col items-start">
                <MicAnalyticsDashboard mics={allMics} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card className="mb-6 shadow-lg rounded-2xl border-0">
              <CardContent className="p-8">
                <UserAnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="site-analytics">
            <Card className="mb-6 shadow-lg rounded-2xl border-0">
              <CardContent className="p-8">
                <SiteAnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ads">
            <AdminBannerAdsManager />
          </TabsContent>
          <TabsContent value="smart-import">
            <SmartImportInterface />
          </TabsContent>
          <TabsContent value="bulk-import">
            <BulkImportInterface />
          </TabsContent>
          <TabsContent value="all">
            <Card className="mb-6 shadow-lg rounded-2xl border-0">
              <CardContent className="p-4 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant={micsViewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setMicsViewMode('cards')} className="h-8">
                    <LayoutGrid className="w-4 h-4 mr-1" /> Cards
                  </Button>
                  <Button variant={micsViewMode === 'spreadsheet' ? 'default' : 'outline'} size="sm" onClick={() => setMicsViewMode('spreadsheet')} className="h-8">
                    <Table2 className="w-4 h-4 mr-1" /> Spreadsheet
                  </Button>
                </div>
                {micsViewMode === 'cards' ? (
                  <AdminAllMicsList />
                ) : (
                  <AdminMicsSpreadsheet mics={allMics} setMics={setAllMics} loading={loading} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending">
            <Card className="mb-8 shadow-lg rounded-2xl border-0">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-orange-400" />
                  <h2 className="text-xl font-bold text-foreground">Pending Requests</h2>
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingRequests.length}
                  </span>
                </div>
                {loading ? (
                  <div className="w-full flex justify-center py-10">
                    <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-muted-foreground">No mic requests found.</div>
                ) : (
                  <AdminRequestList
                    requests={pendingRequests}
                    visibleCount={visiblePending}
                    setVisibleCount={setVisiblePending}
                    onReview={handleReview}
                    onApprove={handleSubmit}
                    onDisapprove={handleDelete}
                    onCancel={handleCancel}
                    reviewingId={reviewingId}
                    formData={formData}
                    handleFormChange={handleFormChange}
                    submitId={submitId}
                    setSubmitId={setSubmitId}
                    deleteId={deleteId}
                    setDeleteId={setDeleteId}
                    submitting={submitting}
                    deleting={deleting}
                    onMessageSubmitter={handleMessageSubmitter}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviewed">
            <Card className="mb-6 shadow-lg rounded-2xl border-0">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-bold text-foreground">Reviewed Mics</h2>
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gray-700 rounded-full">
                    {reviewedRequests.length}
                  </span>
                </div>
                {loading ? (
                  <div className="w-full flex justify-center py-10">
                    <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
                  </div>
                ) : reviewedRequests.length === 0 ? (
                  <div className="text-muted-foreground">No reviewed mics found.</div>
                ) : (
                  <AdminRequestList
                    requests={reviewedRequests}
                    visibleCount={visibleReviewed}
                    setVisibleCount={setVisibleReviewed}
                    onReview={() => {}}
                    onApprove={() => {}}
                    onDisapprove={() => {}}
                    onCancel={() => {}}
                    reviewingId={null}
                    formData={{}}
                    handleFormChange={() => {}}
                    submitId={null}
                    setSubmitId={() => {}}
                    deleteId={null}
                    setDeleteId={() => {}}
                    submitting={false}
                    deleting={false}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="venues">
            <AdminVenueSourcesManager />
          </TabsContent>
          <TabsContent value="todos">
            <AdminTodoBoard />
          </TabsContent>
          <TabsContent value="update">
            <SmartUpdateInterface />
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Submitter Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message Submitter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Mic: <span className="font-semibold text-foreground">{messageTarget?.req?.show_title || messageTarget?.req?.open_mic || 'Unknown'}</span>
            </p>
            {messageTarget?.req?.user_id && (
              <p className="text-xs text-muted-foreground">
                User ID: <span className="font-mono">{messageTarget.req.user_id}</span>
              </p>
            )}
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={8}
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={sendingMessage}>
              Copy Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInterface;
