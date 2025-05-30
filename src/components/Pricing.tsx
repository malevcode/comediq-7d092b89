
import { Button } from "@/components/ui/button";

interface PricingProps {
  onJoinWaitlist: () => void;
}

const Pricing = ({ onJoinWaitlist }: PricingProps) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Simple, Fair Pricing
        </h2>
        <p className="text-xl text-gray-600 mb-12">
          Start for free and upgrade when you're ready to take your comedy to the next level.
        </p>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-200">
          <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Free Plan
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">$0/month</h3>
          <p className="text-lg text-gray-600 mb-6">Perfect for getting started</p>
          <ul className="text-left space-y-3 mb-8 max-w-md mx-auto">
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
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
