import { useAuth } from '@/contexts/AuthContext';
import { useUserLikedMics } from '@/hooks/useMicRatings';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Heart, MapPin, Clock } from 'lucide-react';
import { useEffect } from 'react';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: likedMicIds = [] } = useUserLikedMics();
  const { data: openMics = [] } = useOpenMics();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
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
                <Card key={index} className="hover:shadow-lg transition-shadow">
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
    </div>
  );
};

export default Profile;
