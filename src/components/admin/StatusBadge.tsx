import { CheckCircle, XCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-gray-200 text-gray-700';
  let icon = <Clock className="w-4 h-4 mr-1" />;
  if (status === 'approved') {
    color = 'bg-green-100 text-green-700';
    icon = <CheckCircle className="w-4 h-4 mr-1" />;
  } else if (status === 'disapproved') {
    color = 'bg-red-100 text-red-700';
    icon = <XCircle className="w-4 h-4 mr-1" />;
  } else if (status === 'pending') {
    color = 'bg-orange-100 text-orange-700';
    icon = <Clock className="w-4 h-4 mr-1" />;
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{icon}{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  );
};

export default StatusBadge; 