import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLikedMics } from "@/hooks/useMicRatings";
import { useOpenMics } from "@/hooks/useOpenMics";
import PageHeader from "@/components/PageHeader";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
import SEO from "@/components/SEO";

export default function LikedMics() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: likedMicIds = [], isLoading: likedLoading } = useUserLikedMics();
  const { data: openMicsData, isLoading: micsLoading } = useOpenMics();
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/liked" } });
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || likedLoading || micsLoading;

  const openMics = openMicsData || [];
  const filteredMics = openMics.filter(mic =>
    likedMicIds.includes(mic.uniqueIdentifier)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <SEO
        title="Liked Mics | Comediq"
        description="View your liked open mics in one place"
      />

      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader
          title="Liked Mics"
          subtitle="Open mics you've liked"
        />

        <main className="container mx-auto px-4 page-content-offset pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : filteredMics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No liked mics yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Like mics from the Open Mics page to see them here for quick access.
              </p>
              <Button onClick={() => navigate("/open-mics")}>
                Browse Open Mics
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4 mt-2">
                {filteredMics.length} liked mic{filteredMics.length !== 1 ? 's' : ''}
              </p>
              <OpenMicsDetailedList
                mics={filteredMics}
                visibleCount={visibleCount}
                setVisibleCount={setVisibleCount}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
