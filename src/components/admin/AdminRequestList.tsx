import AdminRequestCard from './AdminRequestCard';
import { Button } from '@/components/ui/button';

const AdminRequestList = ({
  requests,
  visibleCount,
  setVisibleCount,
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
  onMessageSubmitter
}: any) => (
  <>
    <div className="space-y-6 w-full">
      {requests.slice(0, visibleCount).map((req: any) => (
        <AdminRequestCard
          key={req.unique_identifier}
          req={req}
          onReview={onReview}
          onApprove={onApprove}
          onDisapprove={onDisapprove}
          onCancel={onCancel}
          reviewingId={reviewingId}
          formData={formData}
          handleFormChange={handleFormChange}
          submitId={submitId}
          setSubmitId={setSubmitId}
          deleteId={deleteId}
          setDeleteId={setDeleteId}
          submitting={submitting}
          deleting={deleting}
          isReviewing={reviewingId === req.unique_identifier}
          onMessageSubmitter={onMessageSubmitter}
        />
      ))}
    </div>
    {visibleCount < requests.length && (
      <div className="flex justify-center w-full mt-6">
        <Button onClick={() => setVisibleCount((v: number) => v + 100)} variant="outline" className="bg-orange-100 hover:bg-orange-200 text-orange-700">Show More</Button>
      </div>
    )}
  </>
);

export default AdminRequestList; 