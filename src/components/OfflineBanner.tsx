import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Thin strip that appears only when the device is offline, so people know the
 * mic list they are looking at is the cached one rather than assuming the app broke.
 */
const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-[#07111f] px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] text-white/90"
    >
      <WifiOff className="h-3 w-3" />
      offline · showing saved mics
    </div>
  );
};

export default OfflineBanner;
