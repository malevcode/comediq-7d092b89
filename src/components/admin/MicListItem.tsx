import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface MicListItemProps {
  mic: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  isInactive?: boolean;
}

export const MicListItem = ({ mic, isSelected, onSelect, onEdit, isInactive = false }: MicListItemProps) => {
  const baseClasses = "flex flex-col sm:flex-row items-start sm:items-center justify-between border rounded-lg p-4 shadow-sm";
  const inactiveClasses = "border-gray-300 bg-gray-50";
  const activeClasses = "bg-white";
  
  const containerClasses = `${baseClasses} ${isInactive ? inactiveClasses : activeClasses}`;

  return (
    <div className={containerClasses}>
      <div className="flex items-start gap-3 flex-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
        <div>
          <div className={`font-bold text-md ${isInactive ? 'text-gray-700' : 'text-gray-900'}`}>
            {mic['Open Mic']}
          </div>
          <div className={`text-sm ${isInactive ? 'text-gray-500' : 'text-gray-600'}`}>
            Venue: {mic['Venue Name'] || 'Unknown'} | Borough: {mic['Borough'] || 'Unknown'}
          </div>
          <div className={`text-sm ${isInactive ? 'text-gray-500' : 'text-gray-600'}`}>
            Day: <span className="font-semibold">{mic['Day'] || 'Unknown'}</span> | Time: <span className="font-semibold">{mic['Start Time'] || 'Unknown'}</span>
          </div>
          {isInactive && (
            <div className="text-xs text-gray-400 mt-1">Inactive - Hidden from public listings</div>
          )}
        </div>
      </div>
      <Button className="mt-2 sm:mt-0" size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}; 