import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Mic, 
  Calendar, 
  TrendingUp, 
  User, 
  Play,
  BookOpen
} from "lucide-react";
const Hero = () => {
  const navigate = useNavigate();
  
  const navItems = [
    {
      label: "Open Mics",
      icon: <Mic className="w-4 h-4" />,
      path: "/open-mics",
    },
    {
      label: "Shows",
      icon: <Calendar className="w-4 h-4" />,
      path: "/shows",
    },
    {
      label: "Track Sets",
      icon: <TrendingUp className="w-4 h-4" />,
      path: "/track-sets",
    },
  ];

  const handleSignUp = () => {
    navigate("/auth");
  };
  
  return <section className="py-20 min-h-full bg-gradient-to-br from-[#1a5fb4]/5 via-white to-blue-50 flex items-start justify-center px-4">
      <div className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start pt-4">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <p className="text-sm sm:text-base font-semibold text-[#1a5fb4] uppercase tracking-wide mb-2">NYC's Open Mic Platform</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 lg:mb-6">
              Comediq
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 lg:mb-8 px-4 sm:px-8 lg:px-0 leading-relaxed">
              Find open mics. Track your sets. Grow your career.
            </p>
            <Button onClick={handleSignUp} className="bg-[#1a5fb4] hover:bg-[#164d94] text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 mb-6 lg:mb-8 w-full sm:w-auto">
              Sign In
            </Button>

            {/* Platform Stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8 px-4 sm:px-8 lg:px-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1a5fb4]">500+</div>
                <div className="text-xs text-gray-500">Open Mics Tracked</div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1a5fb4]">5</div>
                <div className="text-xs text-gray-500">NYC Boroughs</div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1a5fb4]">Free</div>
                <div className="text-xs text-gray-500">Always</div>
              </div>
            </div>
            
            {/* Footer with links */}
            <div className="pt-8 border-t border-gray-200 text-center lg:text-left">
              <p className="text-xs text-gray-500 mb-3 px-4 sm:px-8 lg:px-0">Started as a Google Sheet tracking all of NYC's open mics, still publicly editable here</p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-gray-400">
                <a href="https://docs.google.com/spreadsheets/d/1wROLFgLrbgP1aP_b9VIJn0QzbGzmifT9r7CV15Lw7Mw/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a5fb4] transition-colors underline">
                  View Open Mics Data
                </a>
                <span className="hidden sm:inline">•</span>
                <span>Made by @malevcomedy</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 px-4 sm:px-8 lg:px-0 leading-relaxed">
                ComediQ is not an AI comedy writer. Your comedy comes from your unique experience and performance personality.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center order-1 lg:order-2 -mt-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1a5fb4]/10 rounded-full blur-3xl scale-75" />
              <img src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png" alt="Comediq Mascot" className="relative w-48 sm:w-64 lg:w-80 h-auto max-w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;