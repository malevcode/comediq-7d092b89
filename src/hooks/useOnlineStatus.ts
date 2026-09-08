import { useEffect, useState } from "react";

/**
 * True when the browser thinks it has a network connection.
 *
 * navigator.onLine is not a promise that requests will succeed, only that a
 * network interface exists. That is good enough to tell someone on the subway
 * why the app looks frozen in time.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
