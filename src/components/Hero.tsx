import { Button } from "@/components/ui/button";
interface HeroProps {
  onJoinWaitlist: () => void;
}
const Hero = ({
  onJoinWaitlist
}: HeroProps) => {
  return <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl text-gray-900 mb-6 py-0 px-0 mx-0 my-0 md:text-7xl font-bold text-center">
              Comediq
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 mx-0 text-center">
              Find open mics, track your sets, analyze your performance, and grow your comedy career - all in one place.
            </p>
            <Button onClick={onJoinWaitlist} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 mb-8 text-center">
              Join the Waitlist
            </Button>
            <p className="text-gray-600 max-w-2xl mx-[159px] my-0 py-0 px-0 text-base text-center">
              ComediQ is not an AI comedy writer. Your comedy comes from your unique human experience, writing style, and performance personality. Our AI simply helps you understand and improve your impact.
            </p>
          </div>
          <div className="flex justify-center">
            <img src="/lovable-uploads/05168ab8-2327-4ef4-90ca-54c3f66da85c.png" alt="Comediq Mascot" className="w-80 h-auto max-w-full object-cover" />
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;