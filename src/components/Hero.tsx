
import { Button } from "@/components/ui/button";

interface HeroProps {
  onJoinWaitlist: () => void;
}

const Hero = ({ onJoinWaitlist }: HeroProps) => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          Comediq
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Ready to Level Up Your Comedy Game?
        </p>
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Join the waitlist to be the first to access Comediq and take your comedy career to the next level.
        </p>
        <Button 
          onClick={onJoinWaitlist}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
        >
          Join the Waitlist
        </Button>
      </div>
    </section>
  );
};

export default Hero;
