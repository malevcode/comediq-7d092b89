import { Badge } from "@/components/ui/badge";
import { Ticket, Star, Heart, Sparkles, BookOpen } from "lucide-react";

const Features = () => {
  const comedianFeatures = [
    { emoji: "🧭", title: "Open Mic Finder", description: "Real-time directory of NYC open mics, verified by hosts." },
    { emoji: "🎥", title: "Comedian Portfolio", description: "Showcase clips, social links, and build your fan base." },
    { emoji: "🏆", title: "Progress Tracker", description: "Track growth, audience reactions, and unlock milestones." },
    { emoji: "📆", title: "Calendar & Booking", description: "Manage gigs, fliers, and bookings in one place.", comingSoon: true },
    { emoji: "📈", title: "Set Transcriptions", description: "Transcribe sets, track filler words and laugh density.", comingSoon: true },
    { emoji: "🧠", title: "Parallel Thinking", description: "AI analysis to detect stylistic similarities.", comingSoon: true },
  ];

  const audienceFeatures = [
    { icon: <Ticket className="w-4 h-4 text-[#1a5fb4]" />, title: "Show Discovery", description: "Browse upcoming comedy shows across NYC." },
    { icon: <Star className="w-4 h-4 text-[#1a5fb4]" />, title: "Show Reviews", description: "Rate and review shows like Letterboxd for comedy." },
    { icon: <Heart className="w-4 h-4 text-[#1a5fb4]" />, title: "Comedian Tracking", description: "Build your favorites list of comedians seen live." },
    { icon: <BookOpen className="w-4 h-4 text-[#1a5fb4]" />, title: "Post-Show Recall", description: "Show playbills with full lineups so you never forget." },
    { icon: <Sparkles className="w-4 h-4 text-[#1a5fb4]" />, title: "Recommendations", description: "Personalized comedian recommendations.", comingSoon: true },
  ];

  return (
    <section className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 md:gap-10">
          {/* Comedians Column */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              🎤 Built for Comedians
            </h2>
            <div className="space-y-3">
              {comedianFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{f.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-gray-900">{f.title}</h4>
                      {f.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0">Soon</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audiences Column */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              😂 Built for Comedy Fans
            </h2>
            <div className="space-y-3">
              {audienceFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-gray-900">{f.title}</h4>
                      {f.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0">Soon</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
