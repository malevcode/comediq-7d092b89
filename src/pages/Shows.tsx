import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Calendar as CalendarIcon, HelpCircle, Filter, LogIn, ChevronDown } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import ShowNotepad from "@/components/ShowNotepad";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ShowNote {
  id: string;
  title: string;
  venue: string;
  location: string;
  date: string; // ISO date string
  time: string;
  status: 'upcoming' | 'cancelled' | 'completed';
  plannedJokes: string;
  audienceCount: string;
  rating: string;
  borough: string;
  createdAt: string;
}

const Shows = () => {
  const [shows, setShows] = useState<ShowNote[]>([
    {
      id: '1',
      title: 'Comedy Night at Comedy Cellar',
      venue: 'Comedy Cellar',
      location: 'New York, NY',
      date: '2024-06-10',
      time: '8:00 PM',
      status: 'completed',
      plannedJokes: 'Dating app material, subway observations',
      audienceCount: '45',
      rating: '8',
      borough: 'Manhattan', 
      createdAt: '2024-06-10',
    },
    {
      id: '2',
      title: 'Saturday Showcase',
      venue: 'Eastville Comedy Club',
      location: 'Brooklyn, NY',
      date: '2024-06-11',
      time: '9:30 PM',
      status: 'upcoming',
      plannedJokes: 'Family stories, work complaints',
      audienceCount: '30',
      rating: '6',
      borough: 'Brooklyn',
      createdAt: '2024-06-11',
    }
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);

  const addShow = (newShow: Omit<ShowNote, 'id'>) => {
    const show: ShowNote = {
      ...newShow,
      id: Date.now().toString(),
    };
    setShows([show, ...shows]);
  };

  const updateShow = (id: string, updatedFields: Partial<ShowNote>) => {
    setShows(shows => shows.map(show => show.id === id ? { ...show, ...updatedFields } : show));
  };

  const deleteShow = (id: string) => {
    setShows(shows.filter(show => show.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Show Scheduler</h1>
                <p className="text-xs text-gray-600">Keep track of your upcoming and past shows</p>
                <div className="mt-2 sm:hidden">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Welcome back!</span>
                    </div>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="w-full bg-papaya hover:bg-papaya/80 text-xs py-1.5">
                      <LogIn className="h-3 w-3 mr-1" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="sm:hidden flex items-center gap-2">
                  <Button 
                    onClick={() => setShowHelp(!showHelp)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs px-2 py-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(!showFilters)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs px-2 py-1"
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Button 
                    onClick={() => setShowHelp(!showHelp)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs px-3 py-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span>Help</span>
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(!showFilters)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs px-3 py-1"
                  >
                    <Filter className="h-3 w-3" />
                    <span>Filters</span>
                  </Button>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {user ? (
                    <span className="text-xs text-gray-600">Welcome back!</span>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="bg-papaya hover:bg-papaya/80 text-xs px-3 py-1">
                      <LogIn className="h-3 w-3 mr-1" />
                      Sign In
                    </Button>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" 
                    alt="Show Scheduler Comedian Character" 
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain" 
                  />
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4">
              <button
                className="appearance-none cursor-pointer bg-red-50 border border-red-200 rounded-lg p-2 mb-4 relative w-full text-left flex flex-col hover:bg-red-100 transition font-semibold text-xs text-red-800 gap-1 outline-none"
                aria-label={showInstructions ? 'Collapse instructions' : 'Expand instructions'}
                onClick={() => setShowInstructions(e => !e)}
                type="button"
              >
                <span className="flex items-center gap-1">
                  <span>Demo Only</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''}`}
                  />
                </span>
                {showInstructions && (
                  <div
                    className="text-xs text-red-700 break-words mt-2 font-normal select-text cursor-text"
                    onClick={e => e.stopPropagation()}
                  >
                    This is just a demonstration. Data entered here will not be saved permanently.
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ShowNotepad 
          shows={shows}
          onAddShow={addShow}
          onUpdateShow={updateShow}
          onDeleteShow={deleteShow}
        />
      </div>
    </div>
  );
};

export default Shows;
