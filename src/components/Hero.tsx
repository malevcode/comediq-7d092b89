import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 pt-24 sm:pt-28 pb-6">
      <div className="max-w-6xl mx-auto">
        <div
          aria-label="Landing media area"
          className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[2rem] bg-transparent sm:min-h-[440px]"
        >
          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-5 py-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#ffc72c] sm:text-sm">
              NYC's Comedy Platform
            </p>

            <div className="relative mb-2">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-3xl scale-75" />
              <img
                src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png"
                alt="Comediq Mascot"
                className="relative h-auto w-28 object-cover drop-shadow-2xl sm:w-36 lg:w-44"
              />
            </div>

            <h1 className="mb-2 text-3xl font-bold text-white drop-shadow-sm sm:text-5xl lg:mb-4 lg:text-6xl">
              Comediq
            </h1>
            <p className="mb-5 max-w-2xl text-base leading-relaxed text-white sm:text-xl lg:mb-6 lg:text-2xl">
              Whether you're on stage or in the audience, Comediq is your home for live comedy.
            </p>

            <div className="flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
              <Button
                onClick={() => navigate("/auth")}
                className="w-full rounded-full bg-[#ffc72c] px-6 py-3 text-sm font-bold text-[#07111f] transition-all duration-300 hover:scale-105 hover:bg-[#ffd95c] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                🎤 I Perform
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                className="w-full rounded-full border-2 border-[#ffc72c] bg-white/10 px-6 py-3 text-sm text-[#ffc72c] backdrop-blur transition-all duration-300 hover:scale-105 hover:bg-[#ffc72c]/12 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                😂 I Watch
              </Button>
            </div>

            <div className="mt-5 space-y-1.5 text-center">
              <a
                href="https://instagram.com/malevcomedy"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-white/65 transition-colors hover:text-[#ffc72c]"
              >
                Made and maintained by Adam Malev @malevcomedy
              </a>
              <a
                href="https://instagram.com/comediq.us"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-white/65 transition-colors hover:text-[#ffc72c]"
              >
                Questions or new mics? DM @comediq.us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
