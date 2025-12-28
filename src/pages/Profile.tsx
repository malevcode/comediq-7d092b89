import { useAuth } from '@/contexts/AuthContext';
import { useUserLikedMics } from '@/hooks/useMicRatings';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Heart, MapPin, Clock, LogIn, Edit, Briefcase, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import MicDetailModal from '@/components/MicDetailModal';
import { OpenMic } from '@/types/openMic';
import PageHeader from '@/components/PageHeader';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import SocialLinksManager from '@/components/profile/SocialLinksManager';
import ComedianCard from '@/components/profile/ComedianCard';
import WorkHistorySection from '@/components/profile/WorkHistorySection';
import ProfileCompleteness from '@/components/profile/ProfileCompleteness';
import { 
  useComedianProfile, 
  useUpdateProfile, 
  useUploadHeadshot,
  useAddSocialLink,
  useRemoveSocialLink 
} from '@/hooks/useComedianProfile';

const Profile = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { data: likedMicIds = [] } = useUserLikedMics();
  const { data: openMics = [] } = useOpenMics('open_mics_historical');
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading: profileLoading } = useComedianProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const uploadHeadshot = useUploadHeadshot();
  const addSocialLink = useAddSocialLink();
  const removeSocialLink = useRemoveSocialLink();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (!user) {
    return null;
  }

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  const likedMics = openMics.filter(mic => 
    likedMicIds.includes(mic.uniqueIdentifier)
  );

  const handleSaveProfile = (data: any) => {
    updateProfile.mutate(
      { userId: user.id, updates: data },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleUploadHeadshot = (file: File) => {
    uploadHeadshot.mutate({ userId: user.id, file });
  };

  const handleAddSocialLink = (platform: string, handle: string, url: string) => {
    addSocialLink.mutate({ userId: user.id, platform, handle, url });
  };

  const handleRemoveSocialLink = (platform: string) => {
    removeSocialLink.mutate({ userId: user.id, platform });
  };

  return (
    <>
      <SEO
        title="My Profile | Comediq"
        description="View your comedy profile, liked open mics, and track your progress as a comedian in NYC."
        url="https://comediq.us/profile"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
        <PageHeader title="Profile" subtitle="Your comedy profile and stats" />
        
        <div className="max-w-7xl mx-auto px-4 pt-28 pb-6">
          <Tabs defaultValue="profile" className="space-y-6">
            {/* Wrapped Banner */}
            <Card className="bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-500 border-0 mb-4">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <Sparkles className="h-6 w-6" />
                  <div>
                    <p className="font-bold">Your 2025 Wrapped is ready!</p>
                    <p className="text-sm text-white/80">See your comedy year in review</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/wrapped')} 
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-white/90 font-bold"
                >
                  View Wrapped
                </Button>
              </CardContent>
            </Card>

            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">My Profile</TabsTrigger>
              <TabsTrigger value="work">Work History</TabsTrigger>
              <TabsTrigger value="liked">Liked Mics</TabsTrigger>
              <TabsTrigger value="signups">Signups</TabsTrigger>
            </TabsList>

            {/* My Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {!isEditing ? (
                <>
                  <ProfileCompleteness 
                    profile={profile} 
                    onEditClick={() => setIsEditing(true)} 
                  />
                  
                  <div className="flex justify-end">
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ComedianCard comedian={profile} />
                    
                    <div className="space-y-6">
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-4">Profile Stats</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
                              <p className="text-2xl font-bold">{likedMics.length}</p>
                              <p className="text-xs text-muted-foreground">Liked Mics</p>
                            </div>
                            <div className="text-center">
                              <MapPin className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                              <p className="text-2xl font-bold">
                                {new Set(likedMics.map(mic => mic.borough)).size}
                              </p>
                              <p className="text-xs text-muted-foreground">Boroughs</p>
                            </div>
                            <div className="text-center">
                              <Clock className="h-6 w-6 text-green-500 mx-auto mb-1" />
                              <p className="text-2xl font-bold">
                                {new Set(likedMics.map(mic => mic.day)).size}
                              </p>
                              <p className="text-xs text-muted-foreground">Days Active</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <SocialLinksManager
                        socialLinks={profile.social_links || []}
                        onAdd={handleAddSocialLink}
                        onRemove={handleRemoveSocialLink}
                        isLoading={addSocialLink.isPending || removeSocialLink.isPending}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button onClick={() => setIsEditing(false)} variant="ghost">
                      Cancel
                    </Button>
                  </div>
                  
                  <ProfileEditForm
                    profile={profile}
                    onSave={handleSaveProfile}
                    onUploadHeadshot={handleUploadHeadshot}
                    isSaving={updateProfile.isPending}
                    isUploading={uploadHeadshot.isPending}
                  />
                </>
              )}
            </TabsContent>

            {/* Work History Tab */}
            <TabsContent value="work" className="space-y-6">
              <WorkHistorySection userId={user.id} />
            </TabsContent>

            {/* Liked Mics Tab */}
            <TabsContent value="liked" className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Your Liked Open Mics</h2>
              
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
            </TabsContent>

            {/* My Signups Tab */}
            <TabsContent value="signups">
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No upcoming signups</h3>
                  <p className="text-gray-500 mb-4">Sign up for open mics to see them here</p>
                  <Button onClick={() => navigate('/mic-signup')} className="bg-orange-500 hover:bg-orange-600">
                    Browse Signup Events
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {selectedMic && (
          <MicDetailModal
            mic={selectedMic}
            onClose={() => setSelectedMic(null)}
          />
        )}
      </div>
    </>
  );
};

export default Profile;
