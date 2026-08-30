import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from "next-themes";
import { usePointsSync } from '@/hooks/usePoints';
import { useEffect } from "react";
import Index from "./pages/Index";
import OpenMics from "./pages/OpenMics";
import TrackSets from "./pages/TrackSets";
import Shows from "./pages/Shows";
import Perform from "./pages/Perform";
import Laugh from "./pages/Laugh";
import { LaughTabProvider } from "@/contexts/LaughTabContext";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/BottomNavigation";
import ScrollToTop from "./components/ScrollToTop";
import MarqueeBanner from "./components/MarqueeBanner";
import SiteFooter from "./components/SiteFooter";
import SubscriptionSuccessBanner from "./components/SubscriptionSuccessBanner";
import ProgressTrackerPage from "./pages/ProgressTracker";
import Home from "./components/Home";
import { TabProvider } from "@/contexts/TabContext";
import AdminInterface from "./pages/AdminInterface";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import MicDetailPage from "./pages/MicDetailPage";
import MicsByBorough from "./pages/MicsByBorough";
import MicsByNeighborhood from "./pages/MicsByNeighborhood";
import MicsByDay from "./pages/MicsByDay";
import FreeMics from "./pages/FreeMics";
import BeginnerMics from "./pages/BeginnerMics";
import HostDashboard from "./pages/HostDashboard";
import MicSignup from "./pages/MicSignup";
import GrowthOpportunities from "./pages/GrowthOpportunities";
import { Navigate } from "react-router-dom";
import AdvertiseWithUs from "./pages/AdvertiseWithUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AddShow from "./pages/AddShow";
import SavedMics from "./pages/SavedMics";
import DevView from "./pages/DevView";
import LikedMics from "./pages/LikedMics";
import TopMics from "./pages/TopMics";
import Slots from "./pages/Slots";
import ShowsMap from "./pages/ShowsMap";
import Onboarding from "./pages/Onboarding";

import Strip from "./pages/Strip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Only refetch when reconnecting to network
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function PointsSyncWrapper({ children }: { children: React.ReactNode }) {
  usePointsSync();
  return <>{children}</>;
}

function isMicSignupPath(pathname: string) {
  return pathname === '/mic-signup' || /^\/mic\/[^/]+\/signup\/?$/.test(pathname);
}

function SiteFooterWrapper() {
  const location = useLocation();

  if (isMicSignupPath(location.pathname)) return null;

  return (
    <div className="relative z-[1]">
      <SiteFooter />
    </div>
  );
}

function KeyboardViewportOffset() {
  useEffect(() => {
    const root = document.documentElement;
    const keyboardTargetSelector = 'input, textarea, select, [contenteditable="true"]';

    const updateKeyboardState = () => {
      const activeElement = document.activeElement;
      const isEditing =
        activeElement instanceof HTMLElement &&
        activeElement.matches(keyboardTargetSelector);
      const isMobileLike =
        window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(pointer: coarse)').matches;

      root.classList.toggle('keyboard-open', isEditing && isMobileLike);
    };

    const handleFocusOut = () => window.setTimeout(updateKeyboardState, 120);

    updateKeyboardState();
    window.visualViewport?.addEventListener('resize', updateKeyboardState);
    window.visualViewport?.addEventListener('scroll', updateKeyboardState);
    window.addEventListener('focusin', updateKeyboardState);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardState);
      window.visualViewport?.removeEventListener('scroll', updateKeyboardState);
      window.removeEventListener('focusin', updateKeyboardState);
      window.removeEventListener('focusout', handleFocusOut);
      root.classList.remove('keyboard-open');
    };
  }, []);

  return null;
}

function AppShell() {
  const { subscriptionPlan } = useAuth();
  const isSubscriber = subscriptionPlan !== 'free';

  return (
    <BrowserRouter>
      <AnalyticsProvider>
        <KeyboardViewportOffset />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[#f5f2eb] transition-colors duration-500 dark:bg-[#07111f]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-white/5 dark:bg-black/40" />
        <ScrollToTop />
        <MarqueeBanner />
        <SubscriptionSuccessBanner />
        <div className={isSubscriber ? "subscriber-layout relative z-10 pb-0" : "non-subscriber-layout relative z-10 pb-0"}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/perform" element={<TabProvider><Perform /></TabProvider>} />
            <Route path="/laugh" element={<LaughTabProvider><Laugh /></LaughTabProvider>} />
            <Route path="/open-mics" element={<OpenMics />} />
            <Route path="/track-sets" element={<ProgressTrackerPage />} />
            <Route path="/shows" element={<TabProvider><Shows /></TabProvider>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/sign-in" element={<Auth />} />
            <Route path="/auth/create" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admintest" element={<AdminInterface />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:playlistId" element={<PlaylistDetail />} />
            <Route path="/home" element={<Home />} />
            <Route path="/mics/:venueSlug" element={<MicDetailPage />} />
            <Route path="/boroughs/:borough" element={<MicsByBorough />} />
            <Route path="/neighborhoods/:neighborhood" element={<MicsByNeighborhood />} />
            <Route path="/days/:day" element={<MicsByDay />} />
            <Route path="/free-mics" element={<FreeMics />} />
            <Route path="/beginner-friendly" element={<BeginnerMics />} />
            <Route path="/host-dashboard" element={<HostDashboard />} />
            <Route path="/mic/:slug/signup" element={<MicSignup />} />
            <Route path="/growth" element={<GrowthOpportunities />} />
            <Route path="/job-board" element={<Navigate to="/growth" replace />} />
            <Route path="/job-board/create" element={<Navigate to="/growth" replace />} />
            <Route path="/advertise" element={<AdvertiseWithUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/add-show" element={<AddShow />} />
            <Route path="/shows/map" element={<ShowsMap />} />
            <Route path="/saved" element={<SavedMics />} />
            <Route path="/liked" element={<LikedMics />} />
            <Route path="/top-mics" element={<TopMics />} />
            <Route path="/dev-view" element={<TabProvider><DevView /></TabProvider>} />
            <Route path="/slots" element={<Slots />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            <Route path="/strip" element={<Strip />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <SiteFooterWrapper />
        <BottomNavigation />
      </AnalyticsProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PointsSyncWrapper>
        <HelmetProvider>
          <TooltipProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <Toaster />
              <Sonner />
              <AppShell />
            </ThemeProvider>
          </TooltipProvider>
        </HelmetProvider>
      </PointsSyncWrapper>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
