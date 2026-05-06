import { Ticket, Sparkles } from "lucide-react";

const ShowTNPromo = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-[#1a5fb4] via-[#1e6bc7] to-[#164d94]">
      <div className="max-w-4xl mx-auto px-4">
        <a
          href="https://showtn.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-[1.01] shadow-2xl"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              NEW · SHOWTONIGHT
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              ShowTN
            </h2>
            <p className="text-lg sm:text-2xl text-blue-100 mb-6 max-w-2xl">
              Your Laugh Pass to a Comedy Show Tonight
            </p>

            <div className="bg-white/10 rounded-2xl p-5 sm:p-6 w-full max-w-xl mb-6 border border-white/10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Ticket className="w-6 h-6 text-yellow-300" />
                <span className="text-2xl sm:text-3xl font-bold">
                  Starting at $18/month
                </span>
              </div>
              <p className="text-sm sm:text-base text-blue-100">
                Real tickets to <strong>2 pro shows</strong> every month — top clubs, bar popups, and underground venues across NYC.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xl mb-6 text-left">
              <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-blue-200 mb-1 font-semibold">Free Tier</p>
                <p className="text-sm sm:text-base">Top open mics & shows in your zip code</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-yellow-300 mb-1 font-semibold">Paid Tier</p>
                <p className="text-sm sm:text-base">Real tickets to pro shows monthly</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-8 py-3 rounded-full font-bold text-base sm:text-lg hover:bg-yellow-300 transition-colors">
              Visit ShowTN.com →
            </span>
          </div>
        </a>
      </div>
    </section>
  );
};

export default ShowTNPromo;
