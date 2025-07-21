import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import OpenMics from "./pages/OpenMics";
import TrackSets from "./pages/TrackSets";
import Shows from "./pages/Shows";
import Perform from "./pages/Perform";
import Consume from "./pages/Consume";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/BottomNavigation";
import ScrollToTop from "./components/ScrollToTop";
import ProgressTrackerPage from "./pages/ProgressTracker";
import { TabProvider } from "@/contexts/TabContext";
import AdminInterface from "./pages/AdminInterface"; 

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/perform" element={<TabProvider><Perform /></TabProvider>} />
            <Route path="/consume" element={<Consume />} />
            <Route path="/open-mics" element={<OpenMics />} />
            <Route path="/track-sets" element={<ProgressTrackerPage />} />
            <Route path="/shows" element={<Shows />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admintest" element={<AdminInterface />} /> 
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavigation />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
