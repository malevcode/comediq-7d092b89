import { Link } from "react-router-dom";
import { linkManager } from "@/utils/linkManager";

const SiteFooter = () => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Browse by Day */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Browse by Day</h3>
            <ul className="space-y-2">
              {daysOfWeek.map(day => (
                <li key={day}>
                  <Link 
                    to={linkManager.openMicsFilteredByDay(day)} 
                    className="text-gray-300 hover:text-orange-400 transition text-sm"
                  >
                    {day} Mics
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Browse by Borough */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Browse by Borough</h3>
            <ul className="space-y-2">
              {boroughs.map(borough => (
                <li key={borough}>
                  <Link 
                    to={linkManager.openMicsFilteredByBorough(borough)} 
                    className="text-gray-300 hover:text-orange-400 transition text-sm"
                  >
                    {borough} Open Mics
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Popular Searches */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Popular Searches</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to={linkManager.freeMics()} 
                  className="text-gray-300 hover:text-orange-400 transition text-sm"
                >
                  Free Open Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.beginnerMics()} 
                  className="text-gray-300 hover:text-orange-400 transition text-sm"
                >
                  Beginner Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.openMicsFilteredByBorough('Manhattan')} 
                  className="text-gray-300 hover:text-orange-400 transition text-sm"
                >
                  Manhattan Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.openMicsFilteredByBorough('Brooklyn')} 
                  className="text-gray-300 hover:text-orange-400 transition text-sm"
                >
                  Brooklyn Mics
              </Link>
            </li>
          </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Comediq</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-orange-400 transition text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/open-mics" className="text-gray-300 hover:text-orange-400 transition text-sm">
                  All Open Mics
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-gray-300 hover:text-orange-400 transition text-sm">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* SMS Opt-In Disclosure */}
        <div className="mt-10 pt-8 border-t border-gray-700">
          <div className="max-w-3xl">
            <h4 className="font-semibold text-sm mb-3 text-gray-200">📱 SMS Notifications</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              By providing your phone number and opting in to SMS notifications, you consent to receive text messages from Comediq related to: open mic verification confirmations, lineup spot notifications, show reminders and updates, and job board application status.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              <strong className="text-gray-300">Message Frequency:</strong> Varies based on your activity. Typically 1-5 messages per week.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              <strong className="text-gray-300">Message & Data Rates May Apply.</strong> Reply STOP to unsubscribe at any time. Reply HELP for assistance.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Your phone number will never be sold or shared with third parties for marketing purposes.
            </p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Comediq. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            By comedians, for comedians.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
