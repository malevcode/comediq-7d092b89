
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import ShowNotepad from "@/components/ShowNotepad";

interface ShowNote {
  id: string;
  venue: string;
  time: string;
  day: string;
  minutes: string;
  plannedJokes: string;
  audienceCount: string;
  rating: string;
  createdAt: Date;
}

const Shows = () => {
  const [shows, setShows] = useState<ShowNote[]>([
    {
      id: '1',
      venue: 'Comedy Cellar',
      time: '8:00 PM',
      day: 'Friday',
      minutes: '7',
      plannedJokes: 'Dating app material, subway observations',
      audienceCount: '45',
      rating: '8',
      createdAt: new Date('2024-06-10')
    },
    {
      id: '2',
      venue: 'Eastville Comedy Club',
      time: '9:30 PM',
      day: 'Saturday',
      minutes: '5',
      plannedJokes: 'Family stories, work complaints',
      audienceCount: '30',
      rating: '6',
      createdAt: new Date('2024-06-11')
    }
  ]);

  const addShow = (newShow: Omit<ShowNote, 'id' | 'createdAt'>) => {
    const show: ShowNote = {
      ...newShow,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setShows([show, ...shows]);
  };

  const deleteShow = (id: string) => {
    setShows(shows.filter(show => show.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Show Notes</h1>
          <p className="text-lg text-gray-600">Quick notepad for tracking your comedy performances</p>
        </div>

        <ShowNotepad 
          shows={shows}
          onAddShow={addShow}
          onDeleteShow={deleteShow}
        />
      </div>
    </div>
  );
};

export default Shows;
