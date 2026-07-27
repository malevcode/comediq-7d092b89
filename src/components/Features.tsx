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
    { icon: <Ticket className="w-3.5 h-3.5 text-[#8ec5ff]" />, title: "Show Discovery", description: "Browse upcoming comedy shows across NYC." },
    { icon: <Star className="w-3.5 h-3.5 text-[#8ec5ff]" />, title: "Show Reviews", description: "Rate and review shows like Letterboxd for comedy." },
    { icon: <Heart className="w-3.5 h-3.5 text-[#8ec5ff]" />, title: "Comedian Tracking", description: "Build your favorites list of comedians seen live." },
    { icon: <BookOpen className="w-3.5 h-3.5 text-[#8ec5ff]" />, title: "Post-Show Recall", description: "Show playbills with full lineups so you never forget." },
    { icon: <Sparkles className="w-3.5 h-3.5 text-[#8ec5ff]" />, title: "Recommendations", description: "Personalized comedian recommendations.", comingSoon: true },
  ];

  return (
    <section className="px-4 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 md:gap-10 rounded-2xl bg-[#102a53]/78 p-5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_22px_80px_rgba(2,10,30,0.34)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.01]">
          {/* Comedians Column */}
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-bold text-white mb-4">
              🎤 Built for Comedians
            </h2>
            <div className="space-y-2.5">
              {comedianFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">{f.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="font-semibold text-xs sm:text-sm text-white">{f.title}</h4>
                      {f.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0">Soon</Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/64">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audiences Column */}
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-bold text-white mb-4">
              😂 Built for Comedy Fans
            </h2>
            <div className="space-y-2.5">
              {audienceFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-md bg-white/12 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="font-semibold text-xs sm:text-sm text-white">{f.title}</h4>
                      {f.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0">Soon</Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/64">{f.description}</p>
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
