import { CheckCircle, XCircle, Clock, Pencil } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4 mr-1" />, label: 'Approved' },
  disapproved: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4 mr-1" />, label: 'Disapproved' },
  pending: { color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-4 h-4 mr-1" />, label: 'Pending' },
  edit_suggestion: { color: 'bg-blue-100 text-blue-700', icon: <Pencil className="w-4 h-4 mr-1" />, label: 'Edit Suggestion' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status] ?? {
    color: 'bg-gray-200 text-gray-700',
    icon: <Clock className="w-4 h-4 mr-1" />,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      {config.icon}{config.label}
    </span>
  );
};

export default StatusBadge; 