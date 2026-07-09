import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedMics } from "@/hooks/useSavedMics";
import { useOpenMics } from "@/hooks/useOpenMics";
import PageHeader from "@/components/PageHeader";
import { Bookmark, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
import SEO from "@/components/SEO";

export default function SavedMics() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { savedMics, isLoading: savedLoading } = useSavedMics();
  const { data: openMicsData, isLoading: micsLoading } = useOpenMics();
  const [visibleCount, setVisibleCount] = useState(20);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/saved" } });
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || savedLoading || micsLoading;

  // Get the list of saved mic identifiers
  const savedMicIds = savedMics.map(s => s.mic_unique_identifier);

  // Filter open mics to only saved ones
  const openMics = openMicsData || [];
  const filteredMics = openMics.filter(mic => 
    savedMicIds.includes(mic.uniqueIdentifier)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <>
      <SEO 
        title="Saved Mics | Comediq"
        description="View your bookmarked open mics in one place"
      />
      
      <div className="min-h-screen bg-transparent pb-20">
        <PageHeader 
          title="Saved Mics" 
          subtitle="Your bookmarked open mics"
        />

        <main className="container mx-auto px-4 py-4">
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
                <Bookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No saved mics yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Bookmark mics from the Open Mics page to see them here for quick access.
              </p>
              <Button onClick={() => navigate("/open-mics")}>
                Browse Open Mics
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {filteredMics.length} saved mic{filteredMics.length !== 1 ? 's' : ''}
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
