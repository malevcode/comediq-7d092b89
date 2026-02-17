import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/auth");
  };

  return (
    <section className="py-10 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Simple, Fair Pricing
          </h2>
          <p className="text-sm text-gray-600">
            Free tools for comedians. Affordable tickets for fans.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-[#1a5fb4]/10 rounded-xl p-4 sm:p-6 border-2 border-[#1a5fb4]/20">
            <div className="inline-block bg-[#1a5fb4] text-white px-2 py-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-semibold mb-2">
              🎤 Performer
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">$0/mo</h3>
            <p className="text-xs text-gray-600 mb-3">Free forever</p>
            <ul className="text-left space-y-1.5 mb-4">
              <li className="flex items-center text-xs">
                <span className="text-green-500 mr-2">✓</span>Open Mic Finder
              </li>
              <li className="flex items-center text-xs">
                <span className="text-green-500 mr-2">✓</span>Comedian Portfolio
              </li>
              <li className="flex items-center text-xs">
                <span className="text-green-500 mr-2">✓</span>Progress Tracker
              </li>
              <li className="flex items-center text-xs">
                <span className="text-green-500 mr-2">✓</span>Set Logging & Notes
              </li>
            </ul>
            <Button
              onClick={handleSignUp}
              className="w-full bg-[#1a5fb4] hover:bg-[#164d94] text-white px-4 py-2 text-xs sm:text-sm rounded-full"
            >
              Get Started Free
            </Button>
          </div>

          {/* LaughPass */}
          <div className="bg-gradient-to-br from-[#1a5fb4] to-[#164d94] rounded-xl p-4 sm:p-6 text-white border-2 border-[#1a5fb4] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-bl-lg text-[10px] font-bold">
              BEST VALUE
            </div>
            <div className="inline-block bg-white/20 px-2 py-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-semibold mb-2">
              🎟️ LaughPass
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1">$29/mo</h3>
            <p className="text-xs text-blue-100 mb-3">For comedy fans</p>
            <ul className="text-left space-y-1.5 mb-4">
              <li className="flex items-center text-xs">
                <span className="text-yellow-300 mr-2">✓</span>4 show tickets/month
              </li>
              <li className="flex items-center text-xs">
                <span className="text-yellow-300 mr-2">✓</span>Show reviews & ratings
              </li>
              <li className="flex items-center text-xs">
                <span className="text-yellow-300 mr-2">✓</span>Comedian tracking
              </li>
              <li className="flex items-center text-xs">
                <span className="text-yellow-300 mr-2">✓</span>Recommendations
              </li>
            </ul>
            <Button
              onClick={handleSignUp}
              className="w-full bg-white text-[#1a5fb4] hover:bg-blue-50 px-4 py-2 text-xs sm:text-sm rounded-full font-bold"
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
