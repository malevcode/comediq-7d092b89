import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-32 pb-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold text-[#1a5fb4] uppercase tracking-widest mb-4">
          NYC's Comedy Platform
        </p>

        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-5 leading-tight tracking-tight">
          Find your next open mic.<br className="hidden sm:block" />
          Track every set.
        </h1>

        <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed whitespace-pre-line">
          Comediq is the home base for NYC comedians{"\n"}Find open mics, log your performances, and build your comedy career
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => navigate("/auth")}
            className="bg-[#1a5fb4] hover:bg-[#164d94] text-white px-8 py-3 text-sm font-medium rounded-md w-full sm:w-auto transition-colors"
          >
            Start for free
          </Button>
          <Button
            onClick={() => navigate("/open-mics")}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-3 text-sm font-medium rounded-md w-full sm:w-auto transition-colors"
          >
            Browse open mics
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
