import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, MapPin, Calendar, Clock, Users, Star, CircleAlert, CircleCheckBig, Pencil, Search } from "lucide-react";
import ShowForm from "./ShowForm";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from "react-router-dom";
import { useTabContext } from "@/contexts/TabContext";

interface ShowNote {
  id: string;
  title: string;
  venue: string;
  location: string;
  date: string; // ISO date string
  time: string;
  status: 'upcoming' | 'cancelled' | 'completed';
  notes: string;
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
  onSetActiveTab?: (tab: string) => void;
}

// New ShowCard component
function ShowCard({ show, editingId, setEditingId, editValue, setEditValue, editStatus, setEditStatus, onUpdateShow, onDeleteShow, isPast, supabase, toast }) {
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
  const toAmPm = (time: string) => {
    if (!time) return '';
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
    <Card key={show.id} className={`hover:shadow-md transition-shadow ${getBoroughOutline(show.borough || '')}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row w-full md:gap-6">
          {/* Left: Title, Venue, Date */}
          <div className="flex-shrink-0 min-w-[220px] max-w-[320px]">
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
          {/* Notes Section - now stretches across */}
          <div className="flex-grow flex flex-col justify-between min-w-0 gap-x-4 gap-y-1 text-sm text-gray-700">
            <div className="flex flex-col w-full">
              <div className="flex items-center mb-0 justify-between">
                <div className="font-semibold text-gray-800">Notes:</div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(show.id);
                    setEditValue(show.notes);
                    setEditStatus(show.status);
                  }}
                  className="text-blue-500 hover:text-blue-700 h-8 w-8"
                  aria-label="Edit notes"
                >
                  <Pencil className="w-4 h-4" size={16} />
                </Button>
              </div>
              {editingId === show.id ? (
                <>
                  <textarea
                    className="w-full border rounded p-2 mb-2"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                  />
                  <div className="flex gap-2 justify-between">
                    <select
                      className="border rounded px-2 py-1 mr-2"
                      value={editStatus || show.status}
                      onChange={e => setEditStatus(e.target.value as 'upcoming' | 'completed' | 'cancelled')}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="flex gap-2 mt-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('profile_open_mics')
                            .update({ notes: editValue, schedule_type: editStatus })
                            .eq('id', show.id);
                          if (error) {
                            alert('Failed to update notes and schedule type in database!');
                            return;
                          }
                          onUpdateShow(show.id, { notes: editValue, status: editStatus });
                          setEditingId(null);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save size={16} /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const confirmed = window.confirm('Are you sure you want to delete this show? This action cannot be undone.');
                          if (!confirmed) return;
                          const { error } = await supabase
                            .from('profile_open_mics')
                            .delete()
                            .eq('id', show.id);
                          if (error) {
                            alert('Failed to delete show from database!');
                            return;
                          }
                          onDeleteShow(show.id);
                          setEditingId(null);
                          toast({
                            title: 'Show deleted',
                            description: 'The show has been removed from your schedule.',
                          });
                        }}
                        className="text-white hover:text-white bg-red-500 hover:bg-red-400"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-base text-gray-800 w-full ">{<span className="text-sm">{show.notes || <span className='text-gray-400'>No notes</span>}</span>}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ShowNotepad = ({ shows, onAddShow, onUpdateShow, onDeleteShow, onSetActiveTab }: ShowNotepadProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editShow, setEditShow] = useState<ShowNote | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editStatus, setEditStatus] = useState<ShowNote['status'] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTab } = useTabContext();


  // Handler for opening modal to add
  const handleAddClick = () => {
    setEditShow(null);
    setModalOpen(true);
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
        <div className="flex flex-row gap-2">
          <Button
            size="sm"
            className="bg-white text-black border hover:bg-gray/80 flex items-center justify-center gap-2"
            onClick={() => {
              if (location.pathname === "/perform") {
                setActiveTab("find-mics");
              } else {
                navigate("/perform?tab=find-mics");
              }
            }}
          >
            <Plus className="w-4 h-4" />
            Add a Custom Show
          </Button>
          <Button
            size="sm"
            className="bg-papaya text-white hover:bg-papaya/80 flex items-center justify-center gap-2"
            onClick={() => {
              if (location.pathname === "/perform") {
                setActiveTab("find-mics");
              } else {
                navigate("/perform?tab=find-mics");
              }
            }}
          >
            <Search className="w-4 h-4" />
            Find Shows
          </Button>
        </div>
      </div>
      {/* Upcoming Shows Section */}
      <div>
        <div className="space-y-3">
          {shows.filter(show => show.status === 'upcoming').length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-500">No upcoming shows.</CardContent></Card>
          ) : (
            shows.filter(show => show.status === 'upcoming').map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                editingId={editingId}
                setEditingId={setEditingId}
                editValue={editValue}
                setEditValue={setEditValue}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                onUpdateShow={onUpdateShow}
                onDeleteShow={onDeleteShow}
                isPast={false}
                supabase={supabase}
                toast={toast}
              />
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
              <ShowCard
                key={show.id}
                show={show}
                editingId={editingId}
                setEditingId={setEditingId}
                editValue={editValue}
                setEditValue={setEditValue}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                onUpdateShow={onUpdateShow}
                onDeleteShow={onDeleteShow}
                isPast={true}
                supabase={supabase}
                toast={toast}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowNotepad;
