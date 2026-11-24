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
import { lazy, Suspense, useEffect } from "react";
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
import AddMic from "./pages/AddMic";
import ListingV2 from "./pages/ListingV2";
// v3 redesign (docs/design/storytime-redesign-v3). Lazy so the main bundle
// does not carry these screens for visitors who never open /v3.
const V3Layout = lazy(() => import("./pages/v3/V3Layout"));
const V3Home = lazy(() => import("./pages/v3/V3Home"));
const V3Map = lazy(() => import("./pages/v3/V3Map"));
const V3MicDetail = lazy(() => import("./pages/v3/V3MicDetail"));
const V3Sets = lazy(() => import("./pages/v3/V3Sets"));
const V3SetReview = lazy(() => import("./pages/v3/V3SetReview"));
const V3Profile = lazy(() => import("./pages/v3/V3Profile"));
const V3AddListing = lazy(() => import("./pages/v3/listing/V3AddListing"));
const ClaimMics = lazy(() => import("./pages/ClaimMics"));
const V3ManageHome = lazy(() => import("./pages/v3/manage/V3ManageHome"));
const V3ManageListing = lazy(() => import("./pages/v3/manage/V3ManageListing"));
import Listing from "./pages/Listing";
import Search from "./pages/Search";
import SiteFooter from "./components/SiteFooter";
import SubscriptionSuccessBanner from "./components/SubscriptionSuccessBanner";
import OfflineBanner from "./components/OfflineBanner";
import MicOfTheMonthBar from "./components/MicOfTheMonthBar";
import ProgressTrackerPage from "./pages/ProgressTracker";
import { TabProvider } from "@/contexts/TabContext";
import AdminInterface from "./pages/AdminInterface";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import MicDetailPage from "./pages/MicDetailPage";
import VenuePage from "./pages/VenuePage";
import { useParams } from "react-router-dom";

const ToOpenMicsFilter = ({ param }: { param: string }) => {
  const params = useParams();
  return <Navigate to={`/open-mics/${(params[param] || "").toLowerCase()}`} replace />;
};
import MicsByNeighborhood from "./pages/MicsByNeighborhood";
import FreeMics from "./pages/FreeMics";
import BeginnerMics from "./pages/BeginnerMics";
import HostDashboard from "./pages/HostDashboard";
import MicSignup from "./pages/MicSignup";
import MicSlotSignup from "./pages/MicSlotSignup";
import GrowthOpportunities from "./pages/GrowthOpportunities";
import { Navigate } from "react-router-dom";
import AdvertiseWithUs from "./pages/AdvertiseWithUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import AddShow from "./pages/AddShow";
import ListYourShow from "./pages/ListYourShow";
import SavedMics from "./pages/SavedMics";
import DevView from "./pages/DevView";
import LikedMics from "./pages/LikedMics";
import Leaderboard from "./pages/Leaderboard";
import Slots from "./pages/Slots";
import ShowsMap from "./pages/ShowsMap";
import ComedianOnboardingDialog from "@/components/ComedianOnboardingDialog";
import Strip from "./pages/Strip";
import CanonicalTag from "@/components/CanonicalTag";
import SetBuildPrivacy from "./pages/SetBuildPrivacy";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";


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
  return (
    pathname === '/mic-signup' ||
    /^\/mic\/[^/]+\/signup\/?$/.test(pathname) ||
    /^\/mic-slots\/[^/]+\/?$/.test(pathname)
  );
}

// Unlinked utility pages that must read as plain text with no site chrome.
const HIDDEN_PLAIN_PAGES = ["/setbuild-privacy"];

/**
 * Every pre-v3 page, mounted under /classic/... so nothing became
 * unreachable when v3 took over the site's own addresses.
 *
 * /classic            the old home
 * /classic/perform    the old Perform tab
 * /classic/open-mics  the old list-and-map screen
 * /classic/profile    the old profile
 * ...and so on, one entry per page.
 *
 * These are deliberately the same elements the top-level routes use, not
 * copies, so a page cannot behave differently depending on which address it
 * was reached through. Paths are relative, so the parent <Route path="/classic">
 * supplies the prefix; "" is the index.
 */
const CLASSIC_ROUTES: Array<{ path: string; element: JSX.Element }> = [
  { path: "", element: <Index /> },
  { path: "perform", element: <TabProvider><Perform /></TabProvider> },
  { path: "laugh", element: <LaughTabProvider><Laugh /></LaughTabProvider> },
  { path: "open-mics", element: <OpenMics /> },
  { path: "open-mics/:filter", element: <OpenMics /> },
  { path: "track-sets", element: <ProgressTrackerPage /> },
  { path: "shows", element: <TabProvider><Shows /></TabProvider> },
  { path: "shows/map", element: <ShowsMap /> },
  { path: "auth", element: <Auth /> },
  { path: "auth/sign-in", element: <Auth /> },
  { path: "auth/create", element: <Auth /> },
  { path: "profile", element: <Profile /> },
  { path: "admintest", element: <AdminInterface /> },
  { path: "playlists", element: <Playlists /> },
  { path: "playlists/:playlistId", element: <PlaylistDetail /> },
  { path: "mics/:venueSlug", element: <MicDetailPage /> },
  { path: "mic/:slug", element: <MicDetailPage /> },
  { path: "mic/:slug/signup", element: <MicSignup /> },
  { path: "mic-slots/:hostSlug", element: <MicSlotSignup /> },
  { path: "venue/:slug", element: <VenuePage /> },
  { path: "boroughs/:borough", element: <ToOpenMicsFilter param="borough" /> },
  { path: "neighborhoods/:neighborhood", element: <MicsByNeighborhood /> },
  { path: "days/:day", element: <ToOpenMicsFilter param="day" /> },
  { path: "free-mics", element: <FreeMics /> },
  { path: "beginner-friendly", element: <BeginnerMics /> },
  { path: "host-dashboard", element: <HostDashboard /> },
  { path: "growth", element: <GrowthOpportunities /> },
  { path: "advertise", element: <AdvertiseWithUs /> },
  { path: "privacy", element: <PrivacyPolicy /> },
  { path: "blog", element: <Blog /> },
  { path: "blog/:slug", element: <BlogPost /> },
  { path: "support", element: <Support /> },
  { path: "terms", element: <Terms /> },
  { path: "setbuild-privacy", element: <SetBuildPrivacy /> },
  // The three pages v3 replaced. Reachable here in full, unredirected.
  { path: "add-mic", element: <AddMic /> },
  { path: "add-show", element: <AddShow /> },
  { path: "listing", element: <Listing /> },
  { path: "listing-v2", element: <ListingV2 /> },
  { path: "list-your-show", element: <ListYourShow /> },
  { path: "search", element: <Search /> },
  { path: "saved", element: <SavedMics /> },
  { path: "liked", element: <LikedMics /> },
  { path: "leaderboard", element: <Leaderboard /> },
  { path: "top-mics", element: <Leaderboard /> },
  { path: "dev-view", element: <TabProvider><DevView /></TabProvider> },
  { path: "slots", element: <Slots /> },
  { path: "strip", element: <Strip /> },
];

/**
 * Addresses the v3 screens serve, now that v3 is the default site.
 *
 * v3 brings its own navigation (V3TabBar) and no footer, so the site's pill
 * nav and SiteFooter are hidden on these and shown everywhere else - which
 * includes the whole of /classic, where the old chrome still belongs.
 *
 * Kept as one list so the routes and the chrome cannot drift apart.
 */
const V3_EXACT_PATHS = new Set([
  '/',
  '/perform',
  '/profile',
  '/manage',
  '/sets',
]);

function isV3Path(pathname: string) {
  const path = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (V3_EXACT_PATHS.has(path)) return true;
  // The /v3/... aliases, plus the two v3 sections with their own sub-pages.
  return (
    path === '/v3' ||
    path.startsWith('/v3/') ||
    path.startsWith('/manage/') ||
    path.startsWith('/sets/')
  );
}

function BottomNavigationWrapper() {
  const location = useLocation();
  if (isV3Path(location.pathname)) return null;
  return <BottomNavigation />;
}

function SiteFooterWrapper() {
  const location = useLocation();

  if (isV3Path(location.pathname)) return null;
  if (isMicSignupPath(location.pathname)) return null;
  if (HIDDEN_PLAIN_PAGES.includes(location.pathname)) return null;

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
        <OfflineBanner />
        <MicOfTheMonthBar />
        <SubscriptionSuccessBanner />
        <ComedianOnboardingDialog />
        <div className={isSubscriber ? "subscriber-layout relative z-10 pb-0" : "non-subscriber-layout relative z-10 pb-0"}>
          <CanonicalTag />
          <Suspense fallback={null}>
          <Routes>
            {/* ----------------------------------------------------------------
                v3 is the default site (2026-11-23).
 
                The v3 screens are rendered AT the site's own addresses rather
                than redirecting to /v3/..., so / and /open-mics keep the URLs
                they are indexed under - /open-mics is the single most visited
                page on the site. The /v3/... paths below stay as working
                aliases so links already shared keep resolving.
 
                /add-mic, /add-show and /listing do redirect, because those are
                action pages rather than content, and because the ask named
                /v3/listing as the destination.
 
                Every pre-v3 page is still reachable under /classic/... See
                CLASSIC_ROUTES. Nothing was deleted.
               ---------------------------------------------------------------- */}
            <Route element={<V3Layout />}>
              <Route path="/" element={<V3Home />} />
              <Route path="/perform" element={<V3Map />} />
              <Route path="/profile" element={<V3Profile />} />
              <Route path="/manage" element={<V3ManageHome />} />
              <Route path="/manage/:listingId" element={<V3ManageListing />} />
              <Route path="/sets" element={<V3Sets />} />
              <Route path="/sets/:setId" element={<V3SetReview />} />
            </Route>

            {/* The /v3/... aliases. */}
            <Route path="/v3" element={<V3Layout />}>
              <Route index element={<V3Home />} />
              <Route path="map" element={<V3Map />} />
              <Route path="mic/:micId" element={<V3MicDetail />} />
              <Route path="sets" element={<V3Sets />} />
              <Route path="sets/:setId" element={<V3SetReview />} />
              <Route path="profile" element={<V3Profile />} />
              <Route path="listing" element={<V3AddListing />} />
              <Route path="manage" element={<V3ManageHome />} />
              <Route path="manage/:listingId" element={<V3ManageListing />} />
            </Route>

            {/* The three action pages that redirect. /add-show carries
                ?kind=show so it opens the show form rather than the chooser. */}
            <Route path="/add-mic" element={<Navigate to="/v3/listing" replace />} />
            <Route path="/add-show" element={<Navigate to="/v3/listing?kind=show" replace />} />
            <Route path="/listing" element={<Navigate to="/v3/listing" replace />} />
            <Route path="/listing-v2" element={<Navigate to="/v3/listing" replace />} />

            {/* ----------------------------------------------------------------
                Everything v3 did not take over, at its original address.
               ---------------------------------------------------------------- */}
            {/* /open-mics is the list screen again (2026-11-24): it owns the
                list/map toggle, and the list is what someone looking for a
                room tonight wants first. The v3 map is one tap away through
                that toggle, and also at /perform.
 
                The 13 filtered lists under /open-mics/... are indexed SEO
                pages (Brooklyn, Thursday, and so on), and have always been on
                this screen. */}
            <Route path="/open-mics" element={<OpenMics />} />
            <Route path="/open-mics/:filter" element={<OpenMics />} />
            <Route path="/laugh" element={<LaughTabProvider><Laugh /></LaughTabProvider>} />
            <Route path="/track-sets" element={<ProgressTrackerPage />} />
            <Route path="/shows" element={<TabProvider><Shows /></TabProvider>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/sign-in" element={<Auth />} />
            <Route path="/auth/create" element={<Auth />} />
            <Route path="/admintest" element={<AdminInterface />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:playlistId" element={<PlaylistDetail />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            {/* Existing mic and venue links, untouched. */}
            <Route path="/mics/:venueSlug" element={<MicDetailPage />} />
            <Route path="/mic/:slug" element={<MicDetailPage />} />
            <Route path="/venue/:slug" element={<VenuePage />} />
            <Route path="/boroughs/:borough" element={<ToOpenMicsFilter param="borough" />} />
            <Route path="/neighborhoods/:neighborhood" element={<MicsByNeighborhood />} />
            <Route path="/days/:day" element={<ToOpenMicsFilter param="day" />} />
            <Route path="/free-mics" element={<FreeMics />} />
            <Route path="/beginner-friendly" element={<BeginnerMics />} />
            <Route path="/host-dashboard" element={<HostDashboard />} />
            {/* Claim mics you host. Reachable from a mic page, a map venue
                card, and the Claim your mics button on Manage. */}
            <Route path="/claim-mics" element={<ClaimMics />} />
            <Route path="/mic/:slug/signup" element={<MicSignup />} />
            <Route path="/mic-slots/:hostSlug" element={<MicSlotSignup />} />
            <Route path="/growth" element={<GrowthOpportunities />} />
            <Route path="/job-board" element={<Navigate to="/growth" replace />} />
            <Route path="/job-board/create" element={<Navigate to="/growth" replace />} />
            <Route path="/advertise" element={<AdvertiseWithUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/support" element={<Support />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/setbuild-privacy" element={<SetBuildPrivacy />} />
            <Route path="/list-your-show" element={<ListYourShow />} />
            <Route path="/search" element={<Search />} />
            <Route path="/shows/map" element={<ShowsMap />} />
            <Route path="/saved" element={<SavedMics />} />
            <Route path="/liked" element={<LikedMics />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/top-mics" element={<Leaderboard />} />
            <Route path="/dev-view" element={<TabProvider><DevView /></TabProvider>} />
            <Route path="/slots" element={<Slots />} />
            <Route path="/strip" element={<Strip />} />

            {/* ----------------------------------------------------------------
                Every pre-v3 page, kept reachable under /classic/...
                e.g. /classic/perform, /classic/open-mics, /classic/profile.
               ---------------------------------------------------------------- */}
            <Route path="/classic">
              {CLASSIC_ROUTES.map(({ path, element }) =>
                path === "" ? (
                  <Route key="index" index element={element} />
                ) : (
                  <Route key={path} path={path} element={element} />
                ),
              )}
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </div>
        <SiteFooterWrapper />
        <BottomNavigationWrapper />
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
            <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
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
