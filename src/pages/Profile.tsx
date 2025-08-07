import { useAuth } from '@/contexts/AuthContext';
import { useUserLikedMics } from '@/hooks/useMicRatings';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Heart, MapPin, Clock, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import MicDetailModal from '@/components/MicDetailModal';
import { OpenMic } from '@/types/openMic';
import HamburgerMenu from '@/components/HamburgerMenu';

const Profile = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { data: likedMicIds = [] } = useUserLikedMics();
  const { data: openMics = [] } = useOpenMics('open_mics_historical');
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (!user) {
    return null;
  }

  // Filter open mics to show only liked ones
  const likedMics = openMics.filter(mic => 
    likedMicIds.includes(mic.uniqueIdentifier)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 mb-3">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="mr-4 flex items-center">
                <HamburgerMenu />
              </div>
              <div className="flex-1 min-w-0 flex items-center">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Profile</h1>
                  <p className="text-xs text-gray-600">Manage your account and preferences</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col w-full items-end gap-2">
                  <span className="text-xs text-gray-600">
                    Welcome back{user.user_metadata?.username ? ` ${user.user_metadata.username}!` : "!"}
                  </span>
                  <div className="flex justify-end w-full">
                    <Button
                      onClick={handleSignOut}
                      size="sm"
                      variant="outline"
                      className="mt-1 text-xs px-2 py-1"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile auth */}
            <div className="mt-2 sm:hidden w-full">
              <div className="flex flex-row w-full items-center justify-end gap-2">
                <span className="text-xs text-gray-600">
                  Welcome back{user.user_metadata?.username ? ` ${user.user_metadata.username}!` : "!"}
                </span>
                <Button
                  onClick={handleSignOut}
                  size="sm"
                  variant="outline"
                  className="mt-1 text-xs px-2 py-1 self-end"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{likedMics.length}</h3>
              <p className="text-gray-600">Liked Mics</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">
                {new Set(likedMics.map(mic => mic.borough)).size}
              </h3>
              <p className="text-gray-600">Boroughs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">
                {new Set(likedMics.map(mic => mic.day)).size}
              </h3>
              <p className="text-gray-600">Days Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Liked Mics Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Liked Open Mics</h2>
          
          {likedMics.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No liked mics yet</h3>
                <p className="text-gray-500 mb-4">Start exploring and like your favorite open mics!</p>
                <Button onClick={() => navigate('/open-mics')} className="bg-orange-500 hover:bg-orange-600">
                  Browse Open Mics
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {likedMics.map((mic, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedMic(mic)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {mic.openMic}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{mic.day} at {mic.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{mic.venueName}, {mic.neighborhood}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-green-600 font-medium">{mic.cost}</span>
                        <span className="text-orange-600 font-medium">
                          {mic.stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedMic && (
        <MicDetailModal
          mic={selectedMic}
          onClose={() => setSelectedMic(null)}
        />
      )}
    </div>
  );
};

export default Profile;
