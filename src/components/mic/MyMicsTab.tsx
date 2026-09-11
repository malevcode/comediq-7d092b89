import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLikedMics } from "@/hooks/useMicRatings";
import { useSavedMics } from "@/hooks/useSavedMics";
import { useUserSignups } from "@/hooks/useUserSignups";
import { useOpenMics } from "@/hooks/useOpenMics";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

/**
 * Everything the user has marked on the Perform tab, in one list: mics they
 * liked, mics they saved, and mics they have a confirmed signup for. It reads
 * the same hooks the standalone /liked and /saved pages use, so there is no
 * new query behind it.
 */
export default function MyMicsTab() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: likedMicIds = [], isLoading: likedLoading } = useUserLikedMics();
  const { savedMics, isLoading: savedLoading } = useSavedMics();
  const { data: signups = [], isLoading: signupsLoading } = useUserSignups(user?.id);
  const { data: openMicsData, isLoading: micsLoading } = useOpenMics();
  const [visibleCount, setVisibleCount] = useState(20);

  const myMics = useMemo(() => {
    const ids = new Set<string>(likedMicIds);
    savedMics.forEach((saved) => ids.add(saved.mic_unique_identifier));
    signups.forEach((signup) => {
      const id = signup.event?.mic?.unique_identifier;
      if (signup.status === 'confirmed' && id) ids.add(id);
    });
    return (openMicsData || []).filter((mic) => ids.has(mic.uniqueIdentifier));
  }, [likedMicIds, savedMics, signups, openMicsData]);

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-white/20 p-4 dark:bg-white/10">
          <Heart className="h-8 w-8 text-gray-500 dark:text-white/60" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Sign in to see your mics</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Liked, saved and confirmed mics all land here once you have an account.
        </p>
        <Button onClick={() => navigate("/auth")}>Sign in</Button>
      </div>
    );
  }

  const isLoading = authLoading || likedLoading || savedLoading || signupsLoading || micsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    );
  }

  if (myMics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-white/20 p-4 dark:bg-white/10">
          <Heart className="h-8 w-8 text-gray-500 dark:text-white/60" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No mics saved yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Like, save or sign up for a mic on Find Mics and it shows up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        {myMics.length} mic{myMics.length !== 1 ? 's' : ''} you liked, saved or confirmed
      </p>
      <OpenMicsDetailedList
        mics={myMics}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
      />
    </div>
  );
}
