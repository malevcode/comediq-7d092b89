
import FeatureCard from "./FeatureCard";

const Features = () => {
  const features = [
    {
      emoji: "🧭",
      title: "Open Mic Finder",
      description: "A real-time directory of NYC open mics, verified by hosts via SMS, searchable by day and location.",
      mascotImage: "/lovable-uploads/c8d06f54-cc90-4a76-b9f9-35c2804c5940.png"
    },
    {
      emoji: "📈",
      title: "Set Transcriptions & Bit Analysis",
      description: "Upload and transcribe recorded sets, track filler words, joke evolution, and laugh density.",
      mascotImage: "/lovable-uploads/887bd963-c0c7-4f16-8844-82db23fa6d23.png"
    },
    {
      emoji: "🎥",
      title: "Comedian Portfolio",
      description: "A personalized page to showcase clips, social links, and allow fans to follow or tip.",
      mascotImage: "/lovable-uploads/bca90a5b-c6c8-4db0-a8b1-bde4330757d3.png"
    },
    {
      emoji: "📆",
      title: "Calendar & Booking Tools",
      description: "Manage gigs, fliers, footage, and bookings in one place.",
      mascotImage: "/lovable-uploads/fd1b1a3e-150b-47cc-a11d-55ca99ec75bb.png"
    },
    {
      emoji: "🧠",
      title: "Parallel Thinking Detector",
      description: "AI analysis to detect stylistic similarities with published jokes and help protect originality.",
      mascotImage: "/lovable-uploads/771fd66d-72e2-47d1-9a5d-0210ad3409fb.png"
    },
    {
      emoji: "🏆",
      title: "Progress Tracker",
      description: "A gamified system to track your growth, audience reactions, and unlock milestones.",
      mascotImage: "/lovable-uploads/05168ab8-2327-4ef4-90ca-54c3f66da85c.png"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From finding your next stage to analyzing your performance, Comediq provides the tools modern comedians need to grow their careers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
