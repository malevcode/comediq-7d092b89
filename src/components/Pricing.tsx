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
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Simple, Fair Pricing</h2>
          <p className="text-xl text-gray-600">Free tools for comedians. Affordable tickets for fans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-[#1a5fb4]/10 rounded-2xl p-8 border-2 border-[#1a5fb4]/20">
            <div className="inline-block bg-[#1a5fb4] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎤 Performer Plan
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">$0/month</h3>
            <p className="text-gray-600 mb-6">Free forever for comedians</p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Open Mic Finder
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Comedian Portfolio
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Progress Tracker
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Set Logging & Notes
              </li>
            </ul>
            <Button
              onClick={handleSignUp}
              className="w-full bg-[#1a5fb4] hover:bg-[#164d94] text-white px-8 py-3 rounded-full"
            >
              Get Started Free
            </Button>
          </div>

          {/* LaughPass */}
          <div className="bg-gradient-to-br from-[#1a5fb4] to-[#164d94] rounded-2xl p-8 text-white border-2 border-[#1a5fb4] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 rounded-bl-lg text-xs font-bold">
              BEST VALUE
            </div>
            <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎟️ LaughPass
            </div>
            <h3 className="text-3xl font-bold mb-2">$29/month</h3>
            <p className="text-blue-100 mb-6">For comedy fans who go out</p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-yellow-300 mr-3">✓</span>4 comedy show tix/month
              </li>
              <li className="flex items-center">
                <span className="text-yellow-300 mr-3">✓</span>
                Show reviews & ratings
              </li>
              <li className="flex items-center">
                <span className="text-yellow-300 mr-3">✓</span>
                Comedian tracking & favorites
              </li>
              <li className="flex items-center">
                <span className="text-yellow-300 mr-3">✓</span>
                Personalized recommendations
              </li>
            </ul>
            <Button
              onClick={handleSignUp}
              className="w-full bg-white text-[#1a5fb4] hover:bg-blue-50 px-8 py-3 rounded-full font-bold"
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
