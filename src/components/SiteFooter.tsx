import { Link } from "react-router-dom";
import { linkManager } from "@/utils/linkManager";
import { PREMIUM_INTEREST_FORM_URL } from "@/config/premium";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SiteFooter = () => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTopButton = (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-32 right-11 z-50 rounded-full bg-orange-500 p-2 text-white shadow-lg transition duration-300 hover:bg-orange-600 ${
        showScrollTop ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0'
      }`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );

  return (
    <footer className="relative mt-0 border-t border-white/10 bg-[#07111f]/62 py-12 text-white shadow-[0_-18px_60px_rgba(4,20,55,0.25)] backdrop-blur-xl">
      {hasMounted ? createPortal(scrollTopButton, document.body) : null}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 pl-6 gap-6 sm:gap-8">
          {/* Browse by Day */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Browse by Day</h3>
            <ul className="space-y-2">
              {daysOfWeek.map(day => (
                <li key={day}>
                  <Link 
                    to={linkManager.openMicsFilteredByDay(day)} 
                    className="text-white/70 hover:text-[#ffc72c] transition text-sm"
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
                    className="text-white/70 hover:text-[#ffc72c] transition text-sm"
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
                   className="text-white/70 hover:text-[#ffc72c] transition text-sm"
                >
                  Free Open Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.beginnerMics()} 
                   className="text-white/70 hover:text-[#ffc72c] transition text-sm"
                >
                  Beginner Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.openMicsFilteredByBorough('Manhattan')} 
                   className="text-white/70 hover:text-[#ffc72c] transition text-sm"
                >
                  Manhattan Mics
                </Link>
              </li>
              <li>
                <Link 
                  to={linkManager.openMicsFilteredByBorough('Brooklyn')} 
                   className="text-white/70 hover:text-[#ffc72c] transition text-sm"
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
                <Link to="/" className="text-white/70 hover:text-[#ffc72c] transition text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/open-mics" className="text-white/70 hover:text-[#ffc72c] transition text-sm">
                  All Open Mics
                </Link>
              </li>
              <li>
                <a
                  href={PREMIUM_INTEREST_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-[#ffc72c] transition text-sm"
                >
                  Get Premium Free
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-[#ffc72c] transition text-sm">
                  Privacy Policy & Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Origin Story */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs text-white/55 mb-2">
            Started as a Google Sheet tracking all of NYC's open mics, still publicly editable here
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/55 mb-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1wROLFgLrbgP1aP_b9VIJn0QzbGzmifT9r7CV15Lw7Mw/edit?usp=drivesdk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ffc72c] transition-colors underline"
            >
              View Open Mics Data
            </a>
            <span>•</span>
            <span>Made by @malevcomedy</span>
          </div>
          <p className="text-[10px] text-white/42 leading-relaxed mb-4">
            ComediQ is not an AI comedy writer. Your comedy comes from your unique experience and performance personality.
          </p>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} Comediq. All rights reserved.
          </p>
          <p className="text-xs text-white/55 mt-1">
            By comedians, for comedians.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
