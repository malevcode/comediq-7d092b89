
import FeatureCard from "./FeatureCard";

const Features = () => {
  const features = [
    {
      emoji: "🧭",
      title: "Open Mic Finder",
      description: "A real-time directory of NYC open mics, verified by hosts via SMS, searchable by day and location."
    },
    {
      emoji: "📈",
      title: "Set Transcriptions & Bit Analysis",
      description: "Upload and transcribe recorded sets, track filler words, joke evolution, and laugh density."
    },
    {
      emoji: "🎥",
      title: "Comedian Portfolio",
      description: "A personalized page to showcase clips, social links, and allow fans to follow or tip."
    },
    {
      emoji: "📆",
      title: "Calendar & Booking Tools",
      description: "Manage gigs, fliers, footage, and bookings in one place."
    },
    {
      emoji: "🧠",
      title: "Parallel Thinking Detector",
      description: "AI analysis to detect stylistic similarities with published jokes and help protect originality."
    },
    {
      emoji: "🏆",
      title: "Progress Tracker",
      description: "A gamified system to track your growth, audience reactions, and unlock milestones."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Dominate Comedy
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From finding the perfect mic to tracking your growth, Comediq has all the tools to take your comedy career to the next level.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              emoji={feature.emoji}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
