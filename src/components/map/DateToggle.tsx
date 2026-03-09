import { format, addDays, subDays } from 'date-fns';

interface DateToggleProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateToggle = ({ selectedDate, onDateChange }: DateToggleProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);

  const options = [
    { label: 'Yesterday', date: yesterday },
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: tomorrow },
  ];

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-1 bg-[hsl(40,33%,94%)] rounded-full p-0.5 border border-[hsl(213,73%,40%)]/20">
      {options.map((opt) => {
        const key = format(opt.date, 'yyyy-MM-dd');
        const isActive = key === selectedKey;
        return (
          <button
            key={key}
            onClick={() => onDateChange(opt.date)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              isActive
                ? 'bg-[hsl(213,73%,40%)] text-[hsl(40,33%,94%)]'
                : 'text-[hsl(213,73%,40%)] hover:bg-[hsl(213,73%,40%)]/10'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default DateToggle;
