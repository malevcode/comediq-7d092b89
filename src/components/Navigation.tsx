
import { Button } from "@/components/ui/button";

interface NavigationProps {
  onJoinWaitlist: () => void;
}

const Navigation = ({ onJoinWaitlist }: NavigationProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Comediq</h1>
          </div>
          <Button 
            onClick={onJoinWaitlist}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full"
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
