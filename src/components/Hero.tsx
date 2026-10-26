import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 pt-20 sm:pt-24 pb-0">
      <div className="max-w-6xl mx-auto">
        {/*
          The title and the mascot sit side by side, with the buttons directly
          underneath. Stacked, the mascot alone pushed the buttons past the fold
          on a phone: three fixed bars already take about 220px, and a vertical
          hero spent most of what was left before reaching anything tappable.
        */}
        <div
          aria-label="Landing media area"
          className="relative flex items-center justify-center overflow-hidden rounded-[2rem] bg-transparent"
        >
          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-5 pt-4 text-center">
            <div className="mb-4 flex w-full items-center justify-center gap-4 sm:gap-6">
              <div className="min-w-0 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#1a5fb4] dark:text-[#8ec5ff] sm:text-sm">
                  NYC's Comedy Platform
                </p>
                <h1 className="text-4xl font-bold leading-none text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
                  Comediq
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-snug text-white sm:text-lg lg:text-xl">
                  Whether you're on stage or in the audience, Comediq is your home for live comedy.
                </p>
              </div>

              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-3xl scale-75" />
                <img
                  src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png"
                  alt="Comediq Mascot"
                  className="relative h-auto w-24 object-cover drop-shadow-2xl sm:w-32 lg:w-40"
                />
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
              <Button
                onClick={() => navigate("/perform")}
                className="h-11 w-full rounded-full bg-[#1a5fb4] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-[#3a7bd5] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                🎤 I Perform
              </Button>
              <Button
                onClick={() => navigate("/laugh")}
                variant="outline"
                className="h-11 w-full rounded-full border-2 border-[#1a5fb4] bg-white/10 px-6 py-3 text-sm text-[#1a5fb4] backdrop-blur dark:border-[#8ec5ff] dark:text-[#8ec5ff] transition-all duration-300 hover:scale-105 hover:bg-[#1a5fb4]/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                😂 I Watch
              </Button>
            </div>

            <div className="mt-5 space-y-1.5 text-center">
              <a
                href="https://instagram.com/malevcomedy"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-white/70 transition-colors hover:text-[#1a5fb4]"
              >
                Made and maintained by Adam Malev @malevcomedy
              </a>
              <a
                href="https://instagram.com/comediq.us"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-white/70 transition-colors hover:text-[#1a5fb4]"
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
