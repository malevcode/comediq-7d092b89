import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/auth");
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-start justify-center px-4">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 lg:mb-6">
              Comediq
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 lg:mb-8 px-4 sm:px-8 lg:px-0 leading-relaxed">
              Find open mics, track your sets, analyze your performance, and grow your comedy career - all in one place.
            </p>
            <Button 
              onClick={handleSignUp} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 mb-6 lg:mb-8 w-full sm:w-auto"
            >
              Sign Up
            </Button>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto lg:mx-0 px-4 sm:px-8 lg:px-0 leading-relaxed">
              ComediQ is not an AI comedy writer. Your comedy comes from your unique human experience, writing style, and performance personality. Our AI simply helps you understand and improve your impact.
            </p>
            
            {/* Footer with links */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-center lg:text-left">
              <p className="text-sm text-gray-600 mb-4 px-4 sm:px-8 lg:px-0">
                This Web App Started as a Google Sheet tracking all of NYC's open mics, still publicly editable here
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                <a 
                  href="https://docs.google.com/spreadsheets/d/1wROLFgLrbgP1aP_b9VIJn0QzbGzmifT9r7CV15Lw7Mw/edit?usp=drivesdk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-orange-500 transition-colors underline"
                >
                  View Open Mics Data
                </a>
                <span className="hidden sm:inline">•</span>
                <span>Made by @malevcomedy</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center order-1 lg:order-2 -mt-4">
            <img 
              src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png" 
              alt="Comediq Mascot" 
              className="w-48 sm:w-64 lg:w-80 h-auto max-w-full object-cover" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
