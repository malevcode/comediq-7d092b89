
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2 } from "lucide-react";

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

interface ShowNotepadProps {
  shows: ShowNote[];
  onAddShow: (show: Omit<ShowNote, 'id' | 'createdAt'>) => void;
  onDeleteShow: (id: string) => void;
}

const ShowNotepad = ({ shows, onAddShow, onDeleteShow }: ShowNotepadProps) => {
  const [newShow, setNewShow] = useState({
    venue: '',
    time: '',
    day: '',
    minutes: '',
    plannedJokes: '',
    audienceCount: '',
    rating: ''
  });

  const handleAddShow = () => {
    if (newShow.venue.trim()) {
      onAddShow(newShow);
      setNewShow({
        venue: '',
        time: '',
        day: '',
        minutes: '',
        plannedJokes: '',
        audienceCount: '',
        rating: ''
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddShow();
    }
  };

  const getRatingColor = (rating: string) => {
    const num = parseInt(rating);
    if (num >= 8) return 'bg-green-100 text-green-800';
    if (num >= 6) return 'bg-yellow-100 text-yellow-800';
    if (num >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quick Entry Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Show Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Input
              placeholder="Venue"
              value={newShow.venue}
              onChange={(e) => setNewShow({ ...newShow, venue: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="Time"
              value={newShow.time}
              onChange={(e) => setNewShow({ ...newShow, time: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="Day"
              value={newShow.day}
              onChange={(e) => setNewShow({ ...newShow, day: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="Minutes"
              value={newShow.minutes}
              onChange={(e) => setNewShow({ ...newShow, minutes: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input
              placeholder="Planned jokes"
              value={newShow.plannedJokes}
              onChange={(e) => setNewShow({ ...newShow, plannedJokes: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="# Audience"
              value={newShow.audienceCount}
              onChange={(e) => setNewShow({ ...newShow, audienceCount: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="Rating (1-10)"
              value={newShow.rating}
              onChange={(e) => setNewShow({ ...newShow, rating: e.target.value })}
              onKeyDown={handleKeyPress}
              className="text-sm"
            />
          </div>

          <Button 
            onClick={handleAddShow}
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={!newShow.venue.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Show (Ctrl+Enter)
          </Button>
        </CardContent>
      </Card>

      {/* Shows List */}
      <div className="space-y-3">
        {shows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No shows recorded yet. Add your first show above!</p>
            </CardContent>
          </Card>
        ) : (
          shows.map((show) => (
            <Card key={show.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{show.venue}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                      <span>{show.day}</span>
                      {show.time && <span>• {show.time}</span>}
                      {show.minutes && <span>• {show.minutes} min</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {show.rating && (
                      <Badge className={getRatingColor(show.rating)}>
                        {show.rating}/10
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteShow(show.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {show.plannedJokes && (
                    <div>
                      <span className="font-medium text-gray-700">Planned Jokes:</span>
                      <p className="text-gray-600 mt-1">{show.plannedJokes}</p>
                    </div>
                  )}
                  {show.audienceCount && (
                    <div>
                      <span className="font-medium text-gray-700">Audience:</span>
                      <p className="text-gray-600 mt-1">{show.audienceCount} people</p>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-400 mt-3">
                  Added {show.createdAt.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ShowNotepad;
