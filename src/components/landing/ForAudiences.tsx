import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Ticket, Star, Heart, Sparkles, BookOpen } from "lucide-react";

const ForAudiences = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Ticket className="w-5 h-5 text-[#1a5fb4]" />,
      title: "Show Discovery",
      description: "Browse upcoming comedy shows across NYC — from basement showcases to club headliners.",
    },
    {
      icon: <Star className="w-5 h-5 text-[#1a5fb4]" />,
      title: "Show Reviews",
      description: "Rate and review shows like Letterboxd, but for comedy. Build your comedy taste profile.",
    },
    {
      icon: <Heart className="w-5 h-5 text-[#1a5fb4]" />,
      title: "Comedian Tracking",
      description: "Remember who made you laugh — build your favorites list of comedians seen live.",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-[#1a5fb4]" />,
      title: "Post-Show Recall",
      description: "\"What was that joke?\" — show playbills with full lineups and comedian details so you never forget.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#1a5fb4]" />,
      title: "Personalized Recommendations",
      description: "We learn your taste and recommend comedians you'll love, like Spotify for comedy.",
      comingSoon: true,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Built for Comedy Fans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover shows, remember every set, and never miss a comedian you loved.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LaughPass Pitch */}
          <div className="bg-gradient-to-br from-[#1a5fb4] to-[#164d94] rounded-2xl p-8 text-white shadow-xl">
            <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              🎟️ LaughPass
            </div>
            <h3 className="text-3xl font-bold mb-2">$29/month</h3>
            <p className="text-lg text-blue-100 mb-6">
              4 free comedy show tickets every month.
            </p>
            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <p className="text-2xl font-bold text-center">
                Less than $8 per show
              </p>
              <p className="text-sm text-blue-200 text-center mt-1">
                Most NYC comedy shows cost $20–$35
              </p>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-white text-[#1a5fb4] hover:bg-blue-50 px-8 py-4 text-lg rounded-full font-bold"
            >
              Get LaughPass
            </Button>
          </div>

          {/* Audience Features List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    {feature.comingSoon && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-500">Coming Soon</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForAudiences;
