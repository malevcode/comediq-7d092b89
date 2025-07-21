import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { FileText, UserCheck, UserX } from 'lucide-react';
import StatusBadge from './StatusBadge';
import TimePicker from '@/components/ui/TimePicker';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';

const OPEN_MIC_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time', 'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates', 'Last verified', 'SMS', 'Other Rules', 'Help other comics! Leave reviews', 'Formerly verified'
];

const AdminRequestCard = ({
  req,
  onReview,
  onApprove,
  onDisapprove,
  onCancel,
  reviewingId,
  formData,
  handleFormChange,
  submitId,
  setSubmitId,
  deleteId,
  setDeleteId,
  submitting,
  deleting,
  isReviewing
}: any) => (
  <Card className="border-orange-100 shadow-md rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.01]">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-bold text-lg text-gray-900">{req.show_title || 'Untitled Mic'}</span>
        <StatusBadge status={req.status || 'pending'} />
      </div>
      <div className="text-sm text-gray-600 mb-1">Venue: <span className="font-semibold text-gray-800">{req.venue_name || 'Unknown'}</span></div>
      <div className="text-sm text-gray-600 mb-1">Borough: <span className="font-semibold text-gray-800">{req.borough || 'Unknown'}</span></div>
      <div className="text-sm text-gray-600 mb-1">Date: <span className="font-semibold text-gray-800">{req.date || 'TBD'}</span> | Time: <span className="font-semibold text-gray-800">{req.time || 'TBD'}</span></div>
      <div className="text-xs text-gray-400 mb-2">Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : 'Unknown'}</div>
      {isReviewing ? (
        <div className="mt-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-inner">
            <form className="space-y-3">
              {OPEN_MIC_FIELDS.map((field: string) => (
                <div key={field} className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-700 mb-1">{field}</label>
                  {field === 'Start Time' ? (
                    <TimePicker value={formData['Start Time'] || ''} onChange={v => handleFormChange('Start Time', v)} />
                  ) : field === 'Latest End Time' ? (
                    <TimePicker value={formData['Latest End Time'] || ''} onChange={v => handleFormChange('Latest End Time', v)} />
                  ) : field === 'Day' ? (
                    <DayOfWeekPicker value={formData['Day'] || ''} onChange={v => handleFormChange('Day', v)} />
                  ) : (
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={formData[field] || ''}
                      onChange={e => handleFormChange(field, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </form>
            <div className="flex gap-3 mt-6 justify-end">
              <AlertDialog open={submitId === req.unique_identifier} onOpenChange={open => !open && setSubmitId(null)}>
                <AlertDialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1" onClick={() => setSubmitId(req.unique_identifier)} disabled={submitting}>
                    <UserCheck className="w-4 h-4 mr-1" /> Approve
                  </Button>
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
                      <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1" onClick={() => onApprove(req.unique_identifier)} disabled={submitting}>
                        <UserCheck className="w-4 h-4 mr-1" /> Yes
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" onClick={onCancel} disabled={submitting || deleting} className="flex items-center gap-1">
                Cancel
              </Button>
              <AlertDialog open={deleteId === req.unique_identifier} onOpenChange={open => !open && setDeleteId(null)}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" onClick={() => setDeleteId(req.unique_identifier)} disabled={deleting} className="flex items-center gap-1">
                    <UserX className="w-4 h-4 mr-1" /> Disapprove
                  </Button>
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
                      <Button variant="destructive" onClick={() => onDisapprove(req.unique_identifier)} disabled={deleting} className="flex items-center gap-1">
                        <UserX className="w-4 h-4 mr-1" /> Yes
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ) : (
        <Button className="bg-blue-500 hover:bg-blue-600 text-white mt-4 flex items-center gap-1" onClick={() => onReview(req)}>
          <FileText className="w-4 h-4 mr-1" /> Review
        </Button>
      )}
    </CardContent>
  </Card>
);

export default AdminRequestCard; 