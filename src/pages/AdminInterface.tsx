import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

const OPEN_MIC_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time', 'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates', 'Last verified', 'SMS', 'Other Rules', 'Help other comics! Leave reviews', 'Formerly verified'
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
  const { isAdmin, user } = useAuth();
  const [micRequests, setMicRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [reviewedExpanded, setReviewedExpanded] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [submitId, setSubmitId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchRequests = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('open_mics_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setMicRequests(data as MicRequest[]);
      }
      setLoading(false);
    };
    fetchRequests();
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
    // Generate unique_identifier in the required format: Day_Start Time_Changes/updates_Venue Name
    const day = formData['Day']?.trim() || '';
    const startTime = formData['Start Time']?.trim() || '';
    const changes = formData['Changes/updates']?.trim().replace(/\s+/g, '') || '';
    const venue = formData['Venue Name']?.trim() || '';
    const unique_identifier = `${day}_${startTime}_${changes}_${venue}`;
    const insertData = { ...formData, unique_identifier };

    // Step 1: Upsert into historical FIRST to satisfy foreign key constraint
    const { error: historicalError } = await supabase
      .from('open_mics_historical')
      .upsert([insertData], { onConflict: 'unique_identifier' });

    if (historicalError) {
      console.error('Failed to upsert into open_mics_historical:', historicalError);
      setSubmitting(false);
      return; // Don't proceed if insert fails
    }

    // Step 2: Upsert into July table
    const { error: julyError } = await supabase
      .from('open_mics_july')
      .upsert([insertData], { onConflict: 'unique_identifier' });

    if (julyError) {
      console.error('Failed to upsert into open_mics_july:', julyError);
      toast({ title: 'Insert failed', description: 'Could not update active mics.', variant: 'destructive' });
      setSubmitting(false);
      return; // Stop if insert fails
    }

    // Step 3: Mark request as approved
    const { error: updateError } = await supabase
      .from('open_mics_requests')
      .update({ reviewed: true, status: 'approved', unique_identifier })
      .eq('unique_identifier', id);

    if (updateError) {
      console.error('Failed to update request status', updateError);
    }

    setMicRequests((prev: any[]) => 
      prev.map((r: any) =>
        r.unique_identifier === id
          ? ({ ...r, reviewed: true, unique_identifier } as any)
          : r
      )
    );

    setSubmitting(false);
    setSubmitId(null);
    handleCancel();
  };

  if (!user) return <div>Please log in.</div>;
  if (!isAdmin) return <div>Not authorized. You are not an admin.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        {/* Pending Requests Section */}
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col items-start">
            <Button
              onClick={() => setExpanded((prev) => !prev)}
              className="relative bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-2"
            >
              Mic Requests
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {pendingRequests.length}
              </span>
              {expanded ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
            </Button>
            {expanded && (
              <div className="w-full mt-6">
                {loading ? (
                  <div className="text-gray-500">Loading requests...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-gray-500">No mic requests found.</div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((req) => (
                      <Card key={req.unique_identifier} className="border-orange-100">
                        <CardContent className="p-4">
                          <div className="font-bold text-lg text-gray-900 mb-1">{req.show_title || 'Untitled Mic'}</div>
                          <div className="text-sm text-gray-600 mb-1">Venue: {req.venue_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-600 mb-1">Borough: {req.borough || 'Unknown'}</div>
                          <div className="text-sm text-gray-600 mb-1">Date: {req.date || 'TBD'} | Time: {req.time || 'TBD'}</div>
                          <div className="text-xs text-gray-400 mb-2">Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : 'Unknown'}</div>
                          {reviewingId === req.unique_identifier ? (
                            <div className="mt-4">
                              <form className="space-y-2">
                                {OPEN_MIC_FIELDS.map((field) => (
                                  <div key={field} className="flex flex-col">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">{field}</label>
                                    <input
                                      className="border rounded px-2 py-1 text-sm"
                                      value={formData[field] || ''}
                                      onChange={e => handleFormChange(field, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </form>
                              <div className="flex gap-2 mt-4">
                                <AlertDialog open={submitId === req.unique_identifier} onOpenChange={open => !open && setSubmitId(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setSubmitId(req.unique_identifier)} disabled={submitting}>Approve</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to submit and add this mic to the listing?</AlertDialogTitle>
                                      <AlertDialogDescription>This will add the mic to both the active and historical listings and mark the request as reviewed.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel asChild>
                                        <Button variant="outline">No</Button>
                                      </AlertDialogCancel>
                                      <AlertDialogAction asChild>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSubmit(req.unique_identifier)} disabled={submitting}>Yes</Button>
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="outline" onClick={handleCancel} disabled={submitting || deleting}>Cancel</Button>
                                <AlertDialog open={deleteId === req.unique_identifier} onOpenChange={open => !open && setDeleteId(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" onClick={() => setDeleteId(req.unique_identifier)} disabled={deleting}>Disapprove</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to disapprove this request?</AlertDialogTitle>
                                      <AlertDialogDescription>This will mark the request as reviewed and disapproved. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel asChild>
                                        <Button variant="outline">No</Button>
                                      </AlertDialogCancel>
                                      <AlertDialogAction asChild>
                                        <Button variant="destructive" onClick={() => handleDelete(req.unique_identifier)} disabled={deleting}>Yes</Button>
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ) : (
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white mt-2" onClick={() => handleReview(req)}>Review</Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Reviewed Mics Section */}
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col items-start">
            <Button
              onClick={() => setReviewedExpanded((prev) => !prev)}
              className="relative bg-gray-400 hover:bg-gray-500 text-white font-semibold flex items-center gap-2"
            >
              Reviewed Mics
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gray-700 rounded-full">
                {reviewedRequests.length}
              </span>
              {reviewedExpanded ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
            </Button>
            {reviewedExpanded && (
              <div className="w-full mt-6">
                {loading ? (
                  <div className="text-gray-500">Loading reviewed mics...</div>
                ) : reviewedRequests.length === 0 ? (
                  <div className="text-gray-500">No reviewed mics found.</div>
                ) : (
                  <div className="space-y-4">
                    {reviewedRequests.map((req) => (
                      <Card key={req.unique_identifier} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-lg text-gray-900">{req.show_title || 'Untitled Mic'}</div>
                            {req.status === 'approved' ? (
                              <span>Approved</span>
                            ) : req.status === 'disapproved' ? (
                              <span>Disapproved</span>
                            ) : null}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">Venue: {req.venue_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-600 mb-1">Borough: {req.borough || 'Unknown'}</div>
                          <div className="text-sm text-gray-600 mb-1">Date: {req.date || 'TBD'} | Time: {req.time || 'TBD'}</div>
                          <div className="text-xs text-gray-400 mb-2">Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : 'Unknown'}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminInterface;