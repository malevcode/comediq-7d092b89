
import { Button } from "@/components/ui/button";

interface PricingProps {
  onJoinWaitlist: () => void;
}

const Pricing = ({ onJoinWaitlist }: PricingProps) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Fair Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Start for free and upgrade when you're ready to take your comedy to the next level.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-200">
            <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Free Plan
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">$0/month</h3>
            <p className="text-lg text-gray-600 mb-6">Perfect for getting started</p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Access to Open Mic Finder
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Comedian Portfolio
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Booking Tools
              </li>
            </ul>
            <Button 
              onClick={onJoinWaitlist}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full"
            >
              Get Started Free
            </Button>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/fd1b1a3e-150b-47cc-a11d-55ca99ec75bb.png" 
              alt="Comediq Pricing Mascot" 
              className="w-80 h-auto max-w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
