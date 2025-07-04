import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, MapPin, Calendar, Clock, Users, Star, CircleAlert, CircleCheckBig } from "lucide-react";
import ShowForm from "./ShowForm";

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

interface ShowNotepadProps {
  shows: ShowNote[];
  onAddShow: (show: Omit<ShowNote, 'id'>) => void;
  onUpdateShow: (id: string, updatedFields: Partial<ShowNote>) => void;
  onDeleteShow: (id: string) => void;
}

const ShowNotepad = ({ shows, onAddShow, onUpdateShow, onDeleteShow }: ShowNotepadProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editShow, setEditShow] = useState<ShowNote | null>(null);

  // Handler for opening modal to add
  const handleAddClick = () => {
    setEditShow(null);
    setModalOpen(true);
  };

  // Handler for opening modal to edit
  const handleEditClick = (show: ShowNote) => {
    setEditShow(show);
    setModalOpen(true);
  };

  // Handler for submitting form
  const handleFormSubmit = (showData: any) => {
    if (editShow) {
      onUpdateShow(editShow.id, {
        ...showData,
        plannedJokes: showData.notes || '',
        borough: showData.borough,
      });
      setModalOpen(false);
    } else {
      onAddShow({
        ...showData,
        plannedJokes: showData.notes || '',
        borough: showData.borough,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setModalOpen(false);
    }
  };

  // Handler for cancel
  const handleFormCancel = () => {
    setModalOpen(false);
  };

  const getRatingColor = (rating: string) => {
    const num = parseInt(rating);
    if (num >= 8) return 'bg-green-100 text-green-800';
    if (num >= 6) return 'bg-yellow-100 text-yellow-800';
    if (num >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Helper to get borough outline color
  const getBoroughOutline = (borough: string) => {
    const cleanBorough = (borough || '').trim();
    const outlines: Record<string, string> = {
      Manhattan: "border-l-4 border-l-cyan-500",
      Brooklyn: "border-l-4 border-l-amber-800",
      Queens: "border-l-4 border-l-purple-600",
      Bronx: "border-l-4 border-l-orange-600",
      "Staten Island": "border-l-4 border-l-gray-500"
    };
    return outlines[cleanBorough] || "border-l-4 border-l-gray-400";
  };

  // Helper to convert 24-hour time to 12-hour am/pm
  const toAmPm = (time: string) => {
    if (!time) return '';
    // If already contains AM or PM, return as is (after trimming)
    if (/am|pm/i.test(time)) return time.trim().replace(/\s+/g, ' ').toUpperCase();
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const min = m || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${min.padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      {/* Upcoming Shows Section Header Row: Upcoming Shows + Add Show Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Upcoming Shows</h2>
        <Button onClick={handleAddClick} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Add Show
        </Button>
      </div>
      {/* Modal for Add/Edit Show */}
      {modalOpen && (
        <ShowForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          {...(editShow ? {
            initialData: {
              title: editShow.title || '',
              venue: editShow.venue || '',
              date: editShow.date || '',
              time: editShow.time || '',
              status: (editShow.status === 'completed' ? 'completed' : (['upcoming', 'cancelled', 'completed'].includes(editShow.status) ? editShow.status : 'upcoming')) as 'upcoming' | 'cancelled' | 'completed',
              notes: editShow.plannedJokes || '',
              borough: editShow.borough || '',
            },
            onDelete: () => {
              if (editShow) {
                onDeleteShow(editShow.id);
                setModalOpen(false);
              }
            },
            showDelete: true
          } : {})}
        />
      )}
      {/* Upcoming Shows Section */}
      <div>
        <div className="space-y-3">
          {shows.filter(show => show.status === 'upcoming').length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-500">No upcoming shows.</CardContent></Card>
          ) : (
            shows.filter(show => show.status === 'upcoming').map((show) => (
              <Card key={show.id} className={`hover:shadow-md transition-shadow ${getBoroughOutline(show.borough || '')}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row w-full gap-2 md:gap-6">
                    {/* Left: Title, Venue, Date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-md text-gray-900 w-auto inline-block">{show.title || show.venue}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${show.status === 'completed'
                            ? 'border border-green-200 bg-green-50 text-green-700'
                            : show.status === 'cancelled'
                              ? 'border border-red-200 bg-red-50 text-red-700'
                              : 'border border-gray-200 bg-gray-50 text-gray-700'}
                        `}>
                          <span className="flex items-center gap-1">
                            {show.status === 'completed' && (
                              <><CircleCheckBig className="w-3 h-3" /> Completed</>
                            )}
                            {show.status === 'cancelled' && (
                              <><CircleAlert className="w-3 h-3" /> Cancelled</>
                            )}
                            {show.status === 'upcoming' && (
                              <><Clock className="w-3 h-3" /> Upcoming</>
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {show.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{show.venue}</span>}
                        {show.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0" />{new Date(show.date).toLocaleDateString()}</span>}
                        {show.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3 flex-shrink-0" />{toAmPm(show.time)}</span>}
                        {show.createdAt && (
                          <span className="flex items-center gap-1 mt-1 text-xs">
                            {'Added '}
                            {new Date(show.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Mid: Time, Minutes, Audience, Rating, Planned Jokes */}
                    <div className="flex-1 flex flex-col justify-evenly min-w-0 gap-x-4 gap-y-1 text-sm text-gray-700 max-w-lg">
                      {show.plannedJokes && (
                        <div className="text-base text-gray-800 min-h-[2.5rem] mt-1 w-[320px]">Jokes: {show.plannedJokes}</div>
                      )}
                    </div>
                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2 max-w-lg">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(show)}
                        className="text-blue-500 hover:text-blue-700 w-full"
                      >
                        Edit
                      </Button>
                      {show.status === 'upcoming' && (
                        <div className="flex gap-0 w-full border rounded overflow-hidden">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdateShow(show.id, { status: 'completed' })}
                            className="text-green-600 hover:text-green-800 w-full rounded-none"
                          >
                            I performed
                          </Button>
                          <div className="w-px bg-gray-300 self-stretch" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdateShow(show.id, { status: 'cancelled' })}
                            className="text-red-600 hover:text-red-800 w-full rounded-none"
                          >
                            I didn't perform
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Past Shows Section */}
      <div>
        <h2 className="text-xl font-bold mt-8 mb-2">Past Shows</h2>
        <div className="space-y-3">
          {shows.filter(show => show.status === 'completed' || show.status === 'cancelled').length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-500">No past shows.</CardContent></Card>
          ) : (
            shows.filter(show => show.status === 'completed' || show.status === 'cancelled').map((show) => (
              <Card key={show.id} className={`hover:shadow-md transition-shadow ${getBoroughOutline(show.borough || '')}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row w-full gap-2 md:gap-6">
                    {/* Left: Title, Venue, Date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-md text-gray-900 w-auto inline-block">{show.title || show.venue}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${show.status === 'completed'
                            ? 'border border-green-200 bg-green-50 text-green-700'
                            : show.status === 'cancelled'
                              ? 'border border-red-200 bg-red-50 text-red-700'
                              : 'border border-gray-200 bg-gray-50 text-gray-700'}
                        `}>
                          <span className="flex items-center gap-1">
                            {show.status === 'completed' && (
                              <><CircleCheckBig className="w-3 h-3" /> Completed</>
                            )}
                            {show.status === 'cancelled' && (
                              <><CircleAlert className="w-3 h-3" /> Cancelled</>
                            )}
                            {show.status === 'upcoming' && (
                              <><Clock className="w-3 h-3" /> Upcoming</>
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {show.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{show.venue}</span>}
                        {show.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0" />{new Date(show.date).toLocaleDateString()}</span>}
                        {show.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3 flex-shrink-0" />{toAmPm(show.time)}</span>}
                        {show.createdAt && (
                          <span className="flex items-center gap-1 mt-1 text-xs">
                            {'Added '}
                            {new Date(show.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Mid: Time, Minutes, Audience, Rating, Planned Jokes */}
                    <div className="flex-1 flex flex-col justify-evenly min-w-0 gap-x-4 gap-y-1 text-sm text-gray-700 max-w-lg">
                      {show.plannedJokes && (
                        <div className="text-base text-gray-800 min-h-[2.5rem] mt-1 w-[320px]">Jokes: {show.plannedJokes}</div>
                      )}
                    </div>
                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2 w-[200px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(show)}
                        className="text-blue-500 hover:text-blue-700 w-full"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowNotepad;
