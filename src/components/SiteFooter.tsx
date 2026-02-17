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
                    className="text-gray-300 hover:text-[#1a5fb4] transition text-sm"
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
                    className="text-gray-300 hover:text-[#1a5fb4] transition text-sm"
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
                   className="text-gray-300 hover:text-[#1a5fb4] transition text-sm"
                >
                  Free Open Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.beginnerMics()} 
                   className="text-gray-300 hover:text-[#1a5fb4] transition text-sm"
                >
                  Beginner Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.openMicsFilteredByBorough('Manhattan')} 
                   className="text-gray-300 hover:text-[#1a5fb4] transition text-sm"
                >
                  Manhattan Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.openMicsFilteredByBorough('Brooklyn')} 
                   className="text-gray-300 hover:text-[#1a5fb4] transition text-sm"
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
                <Link to="/" className="text-gray-300 hover:text-[#1a5fb4] transition text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/open-mics" className="text-gray-300 hover:text-[#1a5fb4] transition text-sm">
                  All Open Mics
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-gray-300 hover:text-[#1a5fb4] transition text-sm">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-[#1a5fb4] transition text-sm">
                  Privacy Policy & Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Origin Story */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">
            Started as a Google Sheet tracking all of NYC's open mics, still publicly editable here
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1wROLFgLrbgP1aP_b9VIJn0QzbGzmifT9r7CV15Lw7Mw/edit?usp=drivesdk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1a5fb4] transition-colors underline"
            >
              View Open Mics Data
            </a>
            <span>•</span>
            <span>Made by @malevcomedy</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
            ComediQ is not an AI comedy writer. Your comedy comes from your unique experience and performance personality.
          </p>
        </div>
        
        {/* Copyright */}
        <div className="pt-4 border-t border-gray-700">
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
