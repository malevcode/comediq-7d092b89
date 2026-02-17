import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-28 pb-8 bg-gradient-to-br from-[#1a5fb4]/5 via-white to-blue-50 px-4">
      <div className="max-w-6xl w-full mx-auto flex flex-col items-center text-center">
        <p className="text-xs sm:text-sm font-semibold text-[#1a5fb4] uppercase tracking-wide mb-3">
          NYC's Comedy Platform
        </p>

        <div className="relative mb-4">
          <div className="absolute inset-0 bg-[#1a5fb4]/10 rounded-full blur-3xl scale-75" />
          <img
            src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png"
            alt="Comediq Mascot"
            className="relative w-40 sm:w-56 lg:w-72 h-auto object-cover"
          />
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 lg:mb-4">
          Comediq
        </h1>
        <p className="text-base sm:text-xl lg:text-2xl text-gray-700 mb-5 lg:mb-6 leading-relaxed max-w-2xl">
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
    </section>
  );
};

export default Hero;
