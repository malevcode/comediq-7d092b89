import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/auth");
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Simple, Fair Pricing</h2>
          <p className="text-sm sm:text-lg text-gray-600">Free tools for comedians. Affordable tickets for fans.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-[#1a5fb4]/10 rounded-2xl p-3 sm:p-6 border-2 border-[#1a5fb4]/20">
            <div className="inline-block bg-[#1a5fb4] text-white px-2 py-1 rounded-full text-xs font-semibold mb-3">
              🎤 Performer Plan
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">$0/month</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">Free forever for comedians</p>
            <ul className="text-left space-y-1.5 mb-6">
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-green-500 mr-1.5">✓</span>
                Open Mic Finder
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-green-500 mr-1.5">✓</span>
                Comedian Portfolio
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-green-500 mr-1.5">✓</span>
                Progress Tracker
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-green-500 mr-1.5">✓</span>
                Set Logging & Notes
              </li>
            </ul>
            <Button
              onClick={handleSignUp}
              className="w-full bg-[#1a5fb4] hover:bg-[#164d94] text-white text-xs sm:text-sm px-2 sm:px-6 py-2 rounded-full"
            >
              Get Started Free
            </Button>
          </div>

          {/* LaughPass */}
          <div className="bg-gradient-to-br from-[#1a5fb4] to-[#164d94] rounded-2xl p-3 sm:p-6 text-white border-2 border-[#1a5fb4] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-0.5 rounded-bl-lg text-[10px] font-bold">
              BEST VALUE
            </div>
            <div className="inline-block bg-white/20 px-2 py-1 rounded-full text-xs font-semibold mb-3">
              🎟️ LaughPass
            </div>
            <h3 className="text-lg sm:text-2xl font-bold mb-1">$29/month</h3>
            <p className="text-xs sm:text-sm text-blue-100 mb-4">For comedy fans who go out</p>
            <ul className="text-left space-y-1.5 mb-6">
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-yellow-300 mr-1.5">✓</span>4 comedy show tix/month
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-yellow-300 mr-1.5">✓</span>
                Show reviews & ratings
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-yellow-300 mr-1.5">✓</span>
                Comedian tracking
              </li>
              <li className="flex items-center text-xs sm:text-sm">
                <span className="text-yellow-300 mr-1.5">✓</span>
                Personalized recs
              </li>
            </ul>
            <Button
              onClick={handleSignUp}
              className="w-full bg-white text-[#1a5fb4] hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-6 py-2 rounded-full font-bold"
            >
              Get LaughPass
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
