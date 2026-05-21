import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { FileText, UserCheck, UserX, AlertTriangle, Mail } from 'lucide-react';
import StatusBadge from './StatusBadge';
import TimePicker from '@/components/ui/TimePicker';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import BoroughPicker from '@/components/ui/BoroughPicker';
import * as React from 'react';

const ALL_DB_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough',
  'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time',
  'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates',
  'Last verified', 'Other Rules'
];

const ESSENTIAL_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Venue Name', 'Borough', 'Location',
  'Cost', 'Host(s) / Organizer', 'Changes/updates'
];

const NICE_TO_HAVE_FIELDS = ALL_DB_FIELDS.filter(f => !ESSENTIAL_FIELDS.includes(f));

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
  isReviewing,
  onMessageSubmitter,
}: any) => {
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    // Only block on truly critical fields
    const critical = ['Open Mic', 'Day', 'Start Time', 'Venue Name', 'Borough'];
    critical.forEach(field => {
      if (!formData[field] || !formData[field].trim()) {
        newErrors[field] = 'Required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = (id: string) => {
    if (!validate()) return;
    onApprove(id);
  };

  // Calculate missing fields for the indicator
  const getMissingFields = () => {
    if (!isReviewing) return { essential: [], niceToHave: [] };
    const missingEssential = ESSENTIAL_FIELDS.filter(f => !formData[f]?.trim());
    const missingNice = NICE_TO_HAVE_FIELDS.filter(f => !formData[f]?.trim());
    return { essential: missingEssential, niceToHave: missingNice };
  };

  const missing = getMissingFields();
  const totalFilled = ALL_DB_FIELDS.filter(f => formData[f]?.trim()).length;
  const completionPct = isReviewing ? Math.round((totalFilled / ALL_DB_FIELDS.length) * 100) : 0;

  return (
    <Card className="border-orange-100 shadow-md rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.01]">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-lg text-foreground">{req.show_title || req.open_mic || 'Untitled Mic'}</span>
          <StatusBadge status={req.status || 'pending'} />
        </div>
        <div className="text-sm text-muted-foreground mb-1">Venue: <span className="font-semibold text-foreground">{req.venue_name || 'Unknown'}</span></div>
        <div className="text-sm text-muted-foreground mb-1">Borough: <span className="font-semibold text-foreground">{req.borough || 'Unknown'}</span></div>
        <div className="text-sm text-muted-foreground mb-1">
          Day: <span className="font-semibold text-foreground">{req.date || req.day || 'TBD'}</span> | 
          Time: <span className="font-semibold text-foreground">{req.time || req.start_time || 'TBD'}</span>
        </div>
        {req.location && (
          <div className="text-sm text-muted-foreground mb-1">Address: <span className="font-semibold text-foreground">{req.location}</span></div>
        )}
        {req.cost && (
          <div className="text-sm text-muted-foreground mb-1">Cost: <span className="font-semibold text-foreground">{req.cost}</span></div>
        )}
        {req.hosts_organizers && (
          <div className="text-sm text-muted-foreground mb-1">Host: <span className="font-semibold text-foreground">{req.hosts_organizers}</span></div>
        )}
        {req.status === 'edit_suggestion' && req.changes_updates && (
          <div className="my-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900 whitespace-pre-wrap">
            {req.changes_updates.replace(/^\[EDIT SUGGESTION[^\]]*\]\n?/, '')}
          </div>
        )}
        <div className="text-xs text-muted-foreground mb-2">Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : 'Unknown'}</div>

        {/* Submitter info */}
        {req.user_id && (
          <div className="text-xs text-muted-foreground mb-2">
            Submitter ID: <span className="font-mono text-xs">{req.user_id.slice(0, 8)}...</span>
          </div>
        )}

        {isReviewing ? (
          <div className="mt-6">
            {/* Data completeness indicator */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">Data Completeness</span>
                <span className={`text-sm font-bold ${completionPct >= 80 ? 'text-green-600' : completionPct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {completionPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${completionPct >= 80 ? 'bg-green-500' : completionPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              {missing.essential.length > 0 && (
                <div className="mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">
                    Missing essential: {missing.essential.join(', ')}
                  </p>
                </div>
              )}
              {missing.niceToHave.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional empty: {missing.niceToHave.join(', ')}
                </p>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-inner">
              <form className="space-y-3">
                {ALL_DB_FIELDS.map((field: string) => {
                  const isEssential = ESSENTIAL_FIELDS.includes(field);
                  const isEmpty = !formData[field]?.trim();
                  return (
                    <div key={field} className="flex flex-col">
                      <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        {field}
                        {isEssential && <span className="text-red-500">*</span>}
                        {isEmpty && isEssential && (
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                        )}
                      </label>
                      {field === 'Start Time' ? (
                        <TimePicker value={formData['Start Time'] || ''} onChange={v => handleFormChange('Start Time', v)} />
                      ) : field === 'Latest End Time' ? (
                        <TimePicker value={formData['Latest End Time'] || ''} onChange={v => handleFormChange('Latest End Time', v)} />
                      ) : field === 'Day' ? (
                        <DayOfWeekPicker value={formData['Day'] || ''} onChange={v => handleFormChange('Day', v)} />
                      ) : field === 'Borough' ? (
                        <BoroughPicker value={formData['Borough'] || ''} onChange={v => handleFormChange('Borough', v)} />
                      ) : (
                        <input
                          className={`border rounded px-2 py-1 text-sm ${errors[field] ? 'border-red-500' : isEmpty && isEssential ? 'border-yellow-400 bg-yellow-50' : ''}`}
                          value={formData[field] || ''}
                          onChange={e => handleFormChange(field, e.target.value)}
                        />
                      )}
                      {errors[field] && <span className="text-red-500 text-xs mt-1">{errors[field]}</span>}
                    </div>
                  );
                })}
              </form>
              <div className="flex gap-3 mt-6 justify-between flex-wrap">
                {/* Message submitter button */}
                {req.user_id && onMessageSubmitter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMessageSubmitter(req, missing.essential)}
                    className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Mail className="w-4 h-4" /> Message Submitter
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <AlertDialog open={submitId === req.unique_identifier} onOpenChange={open => !open && setSubmitId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1" onClick={() => setSubmitId(req.unique_identifier)} disabled={submitting}>
                        <UserCheck className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve and add this mic to the listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {missing.essential.length > 0 
                            ? `Warning: ${missing.essential.length} essential field(s) still missing. The mic will be added anyway.`
                            : 'This will add the mic to the active listings.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild><Button variant="outline">No</Button></AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(req.unique_identifier)} disabled={submitting}>
                            <UserCheck className="w-4 h-4 mr-1" /> Yes
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" onClick={onCancel} disabled={submitting || deleting}>Cancel</Button>
                  <AlertDialog open={deleteId === req.unique_identifier} onOpenChange={open => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" onClick={() => setDeleteId(req.unique_identifier)} disabled={deleting}>
                        <UserX className="w-4 h-4 mr-1" /> Disapprove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disapprove this request?</AlertDialogTitle>
                        <AlertDialogDescription>This will mark the request as disapproved.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild><Button variant="outline">No</Button></AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button variant="destructive" onClick={() => onDisapprove(req.unique_identifier)} disabled={deleting}>
                            <UserX className="w-4 h-4 mr-1" /> Yes
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !req.reviewed && (
            <Button className="bg-blue-500 hover:bg-blue-600 text-white mt-4 flex items-center gap-1" onClick={() => onReview(req)}>
              <FileText className="w-4 h-4 mr-1" /> Review
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRequestCard;
