import { Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { OpenMic } from "@/types/openMic";
import { formatTimeRange } from "@/utils/micFormat";
import { downloadMicIcs, getGoogleCalendarUrl } from "@/utils/micCalendar";

interface CalendarSheetProps {
  mic: OpenMic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CalendarOption({
  label,
  description,
  onClick,
  href,
}: {
  label: string;
  description: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex min-h-[60px] w-full items-center gap-3.5 rounded-xl border border-white/16 bg-[#1A3F85] px-4 py-3 text-left text-comediq-cream";

  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-comediq-cream text-[#0A1128]">
        <Calendar className="h-[18px] w-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[16px] font-semibold">{label}</span>
        <span className="text-[13px] text-[#D2DCF0]">{description}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function CalendarSheet({ mic, open, onOpenChange }: CalendarSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-white/10 bg-comediq-blue text-comediq-cream [&>button]:text-comediq-cream/70"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-3xl uppercase leading-none text-comediq-cream">
            Add to calendar
          </SheetTitle>
          <SheetDescription className="text-[#E2E8F5]">
            {mic.openMic} &middot; {mic.day}, {formatTimeRange(mic.startTime, mic.latestEndTime)} at {mic.venueName}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2.5 pb-2">
          <CalendarOption
            label="Google Calendar"
            description="Opens Google Calendar"
            href={getGoogleCalendarUrl(mic)}
          />
          <CalendarOption
            label="Apple Calendar"
            description="Downloads an event file Calendar opens automatically"
            onClick={() => downloadMicIcs(mic)}
          />
          <CalendarOption
            label="Other (.ics)"
            description="Downloads a standard calendar file"
            onClick={() => downloadMicIcs(mic)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
