import { Tickets } from "lucide-react";

const ShowTNPromo = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-[#1f4894] via-[#2453aa] to-[#17366f]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl">
          <div className="flex flex-col items-center text-center text-white">
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              ShowTN
            </h2>
            <p className="text-lg sm:text-2xl text-blue-100 mb-6 max-w-2xl">
              Your Laugh Pass to a Comedy Show Tonight
            </p>

            <div className="bg-white/10 rounded-2xl p-5 sm:p-6 w-full max-w-xl mb-6 border border-white/10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Tickets className="w-6 h-6 text-xs font-mono rounded-sm bg-destructive-foreground text-primary-foreground" />
                <span className="text-2xl sm:text-3xl font-bold">
                  Starting at $10/month
                </span>
              </div>
              <p className="text-sm sm:text-base text-blue-100">
                Real tickets to pro shows every month at...
                <br />
                top clubs, bar popups, and underground venues across NYC
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xl mb-6 text-left">
              <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-blue-200 mb-1 font-semibold">Free Tier</p>
                <p className="text-sm sm:text-base">Top open mics in your zip code</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-yellow-300 mb-1 font-semibold">Paid Tier</p>
                <p className="text-sm sm:text-base">Real tickets to pro shows monthly</p>
              </div>
            </div>

            <a
              href="https://showtn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-8 py-3 rounded-full font-bold text-base sm:text-lg hover:bg-yellow-300 transition-colors"
            >
              Visit ShowTN.com →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowTNPromo;
