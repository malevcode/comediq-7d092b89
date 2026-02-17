import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-28 pb-8 bg-gradient-to-br from-[#1a5fb4]/5 via-white to-blue-50 px-4">
      <div className="max-w-6xl w-full mx-auto">
        {/* Mobile: side-by-side compact | Desktop: 2-col spacious */}
        <div className="grid grid-cols-[1fr_auto] lg:grid-cols-2 gap-4 lg:gap-8 items-center">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold text-[#1a5fb4] uppercase tracking-wide mb-1">
              NYC's Comedy Platform
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-2 lg:mb-4">
              Comediq
            </h1>
            <p className="text-base sm:text-xl lg:text-3xl text-gray-700 mb-4 lg:mb-6 leading-relaxed">
              Whether you're on stage or in the audience, Comediq is your home for live comedy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Button
                onClick={() => navigate("/auth")}
                className="bg-[#1a5fb4] hover:bg-[#164d94] text-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                🎤 I Perform
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                className="border-2 border-[#1a5fb4] text-[#1a5fb4] hover:bg-[#1a5fb4]/5 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                😂 I Watch
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1a5fb4]/10 rounded-full blur-3xl scale-75" />
              <img
                src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png"
                alt="Comediq Mascot"
                className="relative w-28 sm:w-48 lg:w-72 h-auto max-w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
