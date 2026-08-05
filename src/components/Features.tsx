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
    { icon: <Ticket className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-[#8ec5ff]" />, title: "Show Discovery", description: "Browse upcoming comedy shows across NYC." },
    { icon: <Star className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-[#8ec5ff]" />, title: "Show Reviews", description: "Rate and review shows like Letterboxd for comedy." },
    { icon: <Heart className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-[#8ec5ff]" />, title: "Comedian Tracking", description: "Build your favorites list of comedians seen live." },
    { icon: <BookOpen className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-[#8ec5ff]" />, title: "Post-Show Recall", description: "Show playbills with full lineups so you never forget." },
    { icon: <Sparkles className="w-3.5 h-3.5 text-[#1a5fb4] dark:text-[#8ec5ff]" />, title: "Recommendations", description: "Personalized comedian recommendations.", comingSoon: true },
  ];

  return (
    <section className="px-4 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#07111f]/10 bg-white/80 p-5 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.14)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.01] dark:border-0 dark:bg-[#102a53]/80 dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_22px_80px_rgba(2,10,30,0.34)] md:gap-10">
          {/* Comedians Column */}
          <div className="min-w-0">
            <h2 className="mb-4 text-base font-bold text-[#07111f] dark:text-white md:text-xl">
              🎤 Built for Comedians
            </h2>
            <div className="space-y-2.5">
              {comedianFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">{f.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="text-xs font-semibold text-[#07111f] dark:text-white sm:text-sm">{f.title}</h4>
                      {f.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0 mb-1">Soon</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#07111f]/60 dark:text-white/60 sm:text-xs">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audiences Column */}
          <div className="min-w-0">
            <h2 className="mb-4 text-base font-bold text-[#07111f] dark:text-white md:text-xl">
              😂 Built for Comedy Fans
            </h2>
            <div className="space-y-2.5">
              {audienceFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#1a5fb4]/10 dark:bg-white/10">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className="text-xs font-semibold text-[#07111f] dark:text-white sm:text-sm">{f.title}</h4>
                      {f.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0 mb-1">Soon</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#07111f]/60 dark:text-white/60 sm:text-xs">{f.description}</p>
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
