import { useState, useRef, useEffect } from "react";
import { CheckCircle2, HelpCircle, XCircle, ChevronDown } from "lucide-react";
import { useMicStatus, MicStatusType } from "@/hooks/useMicStatus";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MicStatusDropdownProps {
  micUniqueIdentifier: string;
  className?: string;
}

const STATUS_CONFIG: Record<MicStatusType, {
  label: string;
  icon: typeof CheckCircle2;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
}> = {
  verified: {
    label: 'Happening',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500'
  },
  unverified: {
    label: 'Unverified',
    icon: HelpCircle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500'
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return format(date, 'M.d.yyyy');
  } catch {
    return '';
  }
};

export default function MicStatusDropdown({ 
  micUniqueIdentifier, 
  className 
}: MicStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { status, updatedAt, isLoading, updateStatus, isUpdating } = useMicStatus(micUniqueIdentifier);

  const currentConfig = STATUS_CONFIG[status];
  const Icon = currentConfig.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusSelect = (newStatus: MicStatusType) => {
    if (newStatus !== status) {
      updateStatus(newStatus);
    }
    setIsOpen(false);
  };

  const dateDisplay = formatDate(updatedAt);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isUpdating}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs font-medium transition-colors duration-200",
          currentConfig.bgColor,
          currentConfig.borderColor,
          currentConfig.textColor,
          "hover:opacity-90",
          (isLoading || isUpdating) && "opacity-60 cursor-wait"
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", currentConfig.dotColor)} />
        <Icon className="w-3 h-3" />
        {dateDisplay && <span className="text-[10px] opacity-70">{dateDisplay}</span>}
        <ChevronDown className={cn(
          "w-3 h-3 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
          {(Object.keys(STATUS_CONFIG) as MicStatusType[]).map((statusKey) => {
            const config = STATUS_CONFIG[statusKey];
            const StatusIcon = config.icon;
            const isSelected = statusKey === status;

            return (
              <button
                key={statusKey}
                onClick={() => handleStatusSelect(statusKey)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors",
                  isSelected ? config.bgColor : "hover:bg-gray-50",
                  config.textColor
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                <StatusIcon className="w-3.5 h-3.5" />
                <span className="font-medium">{config.label}</span>
                {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto text-gray-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
