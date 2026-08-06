import { Tickets } from "lucide-react";

const ShowTNPromo = () => {
  return (
    <section className="px-4 py-8 pt-0">
      <div className="max-w-4xl mx-auto px-4">
        <div
          className="block rounded-3xl border border-[#07111f]/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(4,20,55,0.14)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] dark:border-0 dark:bg-[#102a53]/80 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_22px_80px_rgba(2,10,30,0.34)] sm:p-10"
        >
          <div className="flex flex-col items-center text-center text-[#07111f] dark:text-white">
            <h2 className="text-3xl sm:text-5xl font-bold mb-3">
              ShowTN
            </h2>
            <p className="mb-6 max-w-2xl text-lg text-[#1a5fb4] dark:text-blue-400 sm:text-2xl">
              Your Laugh Pass to a Comedy Show Tonight
            </p>

            <div className="mb-6 w-full max-w-xl rounded-2xl border border-[#07111f]/10 bg-[#1a5fb4]/10 p-5 dark:border-white/10 dark:bg-white/10 sm:p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Tickets className="w-6 h-6 text-xs font-mono rounded-sm bg-destructive-foreground text-primary-foreground" />
                <span className="text-2xl sm:text-3xl font-bold">
                  Starting at $10/month
                </span>
              </div>
              <p className="text-sm text-[#1a5fb4] dark:text-blue-400 sm:text-base">
                Real tickets to pro shows every month at...
                <br />
                top clubs, bar popups, and underground venues across NYC
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xl mb-6 text-left">
              <div className="rounded-xl border border-[#07111f]/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10 sm:p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#1a5fb4] dark:text-blue-200">Free Tier</p>
                <p className="text-sm sm:text-base">Top open mics in your zip code</p>
              </div>
              <div className="rounded-xl border border-[#07111f]/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10 sm:p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#b7791f] dark:text-yellow-300">Paid Tier</p>
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
