import { useAuth } from '@/contexts/AuthContext';
import { useUserLikedMics } from '@/hooks/useMicRatings';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Heart, MapPin, Clock, LogIn, Edit, Briefcase, Sparkles, Calendar, X, Upload, ListMusic } from 'lucide-react';
import { PerformanceHeatmap } from '@/components/profile/PerformanceHeatmap';
import { useEffect, useState } from 'react';
import MicDetailModal from '@/components/MicDetailModal';
import { OpenMic } from '@/types/openMic';
import PageHeader from '@/components/PageHeader';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import SocialLinksManager from '@/components/profile/SocialLinksManager';
import ComedianCard from '@/components/profile/ComedianCard';
import WorkHistorySection from '@/components/profile/WorkHistorySection';
import PointsDisplay from '@/components/profile/PointsDisplay';
import { CreditBalance } from '@/components/CreditBalance';
import ProfileCompleteness from '@/components/profile/ProfileCompleteness';
import { useUserSignups } from '@/hooks/useUserSignups';
import { cancelSignup } from '@/api/signups';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import BulkImportModal from '@/components/shows/BulkImportModal';
import { useMicPlaylists } from '@/hooks/useMicPlaylists';
import { PlaylistsTab } from '@/components/playlists';
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
  const { data: openMics = [] } = useOpenMics();
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { data: profile, isLoading: profileLoading } = useComedianProfile(user?.id);
  const { playlists } = useMicPlaylists();
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
            <BulkImportModal
              open={showBulkImport} 
              onOpenChange={setShowBulkImport}
            />

            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">My Profile</TabsTrigger>
              <TabsTrigger value="work">Gigs</TabsTrigger>
              <TabsTrigger value="liked">Liked Mics</TabsTrigger>
              <TabsTrigger value="playlists" className="gap-1">
                <ListMusic className="h-3.5 w-3.5" />
                Playlists{playlists.length > 0 && ` (${playlists.length})`}
              </TabsTrigger>
              <TabsTrigger value="signups">Signups</TabsTrigger>
            </TabsList>

            {/* My Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <PerformanceHeatmap />
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
                      <CreditBalance />
                      <PointsDisplay />
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

            {/* Playlists Tab */}
            <TabsContent value="playlists">
              <PlaylistsTab />
            </TabsContent>

            {/* My Signups Tab */}
            <TabsContent value="signups">
              <SignupsTabContent userId={user.id} />
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

function SignupsTabContent({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: signups, isLoading } = useUserSignups(userId);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelSignup = async (signupId: string) => {
    setCancellingId(signupId);
    try {
      await cancelSignup(signupId);
      toast({ title: 'Signup cancelled' });
      queryClient.invalidateQueries({ queryKey: ['userSignups'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading signups...</p>
        </CardContent>
      </Card>
    );
  }

  const upcomingSignups = signups?.filter(s => s.event && new Date(s.event.event_date) >= new Date()) || [];
  const pastSignups = signups?.filter(s => s.event && new Date(s.event.event_date) < new Date()) || [];

  if (!signups || signups.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No signups yet</h3>
          <p className="text-gray-500 mb-4">Sign up for open mics to see them here</p>
          <Button onClick={() => navigate('/mic-signup')} className="bg-orange-500 hover:bg-orange-600">
            Browse Signup Events
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {upcomingSignups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Signups</h2>
          <div className="space-y-3">
            {upcomingSignups.map(signup => (
              <Card key={signup.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{signup.event?.mic?.open_mic || 'Unknown Mic'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {signup.event?.mic?.venue_name} • {signup.event?.mic?.borough}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {signup.event?.event_date ? new Date(signup.event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Unknown date'}
                      </span>
                      {signup.event?.event_time && (
                        <span className="text-sm text-muted-foreground">at {signup.event.event_time}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={signup.status === 'confirmed' ? 'default' : 'secondary'}>
                      {signup.status === 'confirmed' ? 'Confirmed' : signup.status}
                    </Badge>
                    {signup.signup_order && (
                      <span className="text-sm font-medium">#{signup.signup_order}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelSignup(signup.id)}
                      disabled={cancellingId === signup.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastSignups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Past Signups</h2>
          <div className="space-y-3">
            {pastSignups.slice(0, 10).map(signup => (
              <Card key={signup.id} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{signup.event?.mic?.open_mic || 'Unknown Mic'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {signup.event?.mic?.venue_name} • {signup.event?.event_date ? new Date(signup.event.event_date).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  <Badge variant="outline">{signup.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
