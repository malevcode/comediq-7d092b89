import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import ShowNotepad from "@/components/ShowNotepad";

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
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
