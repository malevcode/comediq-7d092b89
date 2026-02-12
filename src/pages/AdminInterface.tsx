import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, LogIn, LayoutGrid, Table2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import TimePicker from '@/components/ui/TimePicker';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
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
import PageHeader from '@/components/PageHeader';
import { approveMicRequest, type MicFormData } from '@/api/admin';

const OPEN_MIC_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time', 'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates', 'Last verified', 'Other Rules', 'Help other comics! Leave reviews', 'Formerly verified'
];

const EMPTY_MIC = Object.fromEntries(OPEN_MIC_FIELDS.map(f => [f, '']));

// Add type for mic request
interface MicRequest {
  unique_identifier: string;
  show_title?: string;
  venue_name?: string;
  borough?: string;
  day?: string;
  time?: string;
  date?: string;
  created_at?: string;
  user_id?: string;
  reviewed?: boolean;
  review_status?: 'approved' | 'disapproved';
  [key: string]: any;
}

const AdminInterface = () => {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [micRequests, setMicRequests] = useState<any[]>([]);
  const [allMics, setAllMics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [reviewedExpanded, setReviewedExpanded] = useState(false);
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

  useEffect(() => {
    setVisiblePending(10);
    setVisibleReviewed(10);
  }, []);

  // Reset visible count when switching tabs
  useEffect(() => {
    if (tab === 'pending') setVisiblePending(10);
    if (tab === 'reviewed') setVisibleReviewed(10);
  }, [tab]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch mic requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('open_mics_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Fetch all mics for analytics
      const { data: micsData, error: micsError } = await supabase
        .from('open_mics_historical')
        .select('*');
      
      if (!requestsError && requestsData) {
        setMicRequests(requestsData as MicRequest[]);
      }
      
      if (!micsError && micsData) {
        setAllMics(micsData);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  // Split requests
  const pendingRequests = micRequests.filter((r: MicRequest) => !r.reviewed);
  const reviewedRequests = micRequests.filter((r: MicRequest) => r.reviewed);

  const handleReview = (req: MicRequest) => {
    setReviewingId(req.unique_identifier);
    // Only include fields relevant to the form
    const filteredReqFields: { [key: string]: any } = Object.fromEntries(
      Object.entries(req).filter(([key]) => OPEN_MIC_FIELDS.includes(key))
    );
    setFormData({
      ...EMPTY_MIC,
      'Open Mic': req.show_title || '',
      'Venue Name': req.venue_name || '',
      'Borough': req.borough || '',
      'Day': req.day || '',
      'Start Time': req.time || '',
      ...filteredReqFields
    });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setReviewingId(null);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    // Mark as reviewed and disapproved
    const { error } = await supabase.from('open_mics_requests').update({ reviewed: true, status: 'disapproved' }).eq('unique_identifier', id);
    if (error) { // For testing RLS policy
      console.error('Update failed:', error);
    }
    setMicRequests((prev: any[]) => prev.map((r: any) =>
      r.unique_identifier === id
        ? ({ ...r, reviewed: true } as any)
        : r
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
      
      // Refresh data
      const { data: requestsData } = await supabase
        .from('open_mics_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (requestsData) {
        setMicRequests(requestsData as MicRequest[]);
      }
      
      handleCancel();
    } catch (error: any) {
      console.error('Failed to approve mic:', error);
      toast({ title: 'Error', description: error.message || 'Could not approve mic.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setSubmitId(null);
    }
  };

  if (!user) return <div>Please log in.</div>;
  if (!isAdmin) return <div>Not authorized. You are not an admin.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <PageHeader title="Admin Dashboard" subtitle="Manage open mic requests and content" />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <Tabs defaultValue="analytics" className="w-full" onValueChange={setTab}>
          <TabsList className="mb-8 w-full grid grid-cols-8 gap-1">
            <TabsTrigger value="analytics" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              Mics
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              Users
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              All Mics
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              Pending
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              Reviewed
            </TabsTrigger>
            <TabsTrigger value="ads" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              Ads
            </TabsTrigger>
            <TabsTrigger value="smart-import" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              Smart
            </TabsTrigger>
            <TabsTrigger value="bulk-import" className="text-xs sm:text-sm md:text-base px-1 sm:px-2 py-2">
              CSV
            </TabsTrigger>
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
                {/* View Toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant={micsViewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMicsViewMode('cards')}
                    className="h-8"
                  >
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={micsViewMode === 'spreadsheet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMicsViewMode('spreadsheet')}
                    className="h-8"
                  >
                    <Table2 className="w-4 h-4 mr-1" />
                    Spreadsheet
                  </Button>
                </div>

                {micsViewMode === 'cards' ? (
                  <AdminAllMicsList />
                ) : (
                  <AdminMicsSpreadsheet
                    mics={allMics}
                    setMics={setAllMics}
                    loading={loading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending">
            <Card className="mb-8 shadow-lg rounded-2xl border-0">
              <CardContent className="p-8 flex flex-col items-start">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-orange-400" />
                  <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingRequests.length}
                  </span>
                </div>
                {loading ? (
                  <div className="w-full flex justify-center py-10">
                    <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-gray-500">No mic requests found.</div>
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
                  <h2 className="text-xl font-bold text-gray-900">Reviewed Mics</h2>
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gray-700 rounded-full">
                    {reviewedRequests.length}
                  </span>
                </div>
                {loading ? (
                  <div className="w-full flex justify-center py-10">
                    <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
                  </div>
                ) : reviewedRequests.length === 0 ? (
                  <div className="text-gray-500">No reviewed mics found.</div>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminInterface;