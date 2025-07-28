import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, MapPin, Calendar, Clock, Users, Share, CircleAlert, CircleCheckBig, Pencil, Search } from "lucide-react";
import AddShowForm from "./AddShowForm";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from "react-router-dom";
import { useTabContext } from "@/contexts/TabContext";
import { useAuth } from '@/contexts/AuthContext';

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
  type: 'mic' | 'show';
}

interface ShowNotepadProps {
  shows: ShowNote[];
  onAddShow: (show: ShowNote) => void;
  onUpdateShow: (id: string, updatedFields: Partial<ShowNote>) => void;
  onDeleteShow: (id: string) => void;
  onSetActiveTab?: (tab: string) => void;
}

const handleExportCalendar = (show) => {
  const url = getGoogleCalendarUrl(show)
  window.open(url, "_blank")
}

function getGoogleCalendarDateTimeRange(show) {
  const localDate = show.date.split('T')[0];
  const localDateTimeString = `${localDate}T${show.time}:00`;
  const localDateTime = new Date(localDateTimeString);
  const endDateTime = new Date(localDateTime.getTime() + 90 * 60 * 1000);
  const format = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `${format(localDateTime)}/${format(endDateTime)}`;
}

function getGoogleCalendarUrl(show) {
  const description = show.type === "mic"
  ? `Open mic at ${show.venue}\nCost: ${show.cost}\nStage time: ${show.stageTime}`
  : `Comedy show at ${show.venue}`;

  console.log(show.date)
  console.log(show.time)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: show.title,
    dates: getGoogleCalendarDateTimeRange(show),
    details: description,
    location: show.location ? show.location : '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
              {show.date && show.time && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  {new Date(show.date).toLocaleDateString()}
                </span>
              )}
              {show.date && show.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  {new Date(show.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              )}
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
              <div className="flex items-center mb-2 justify-between">
                <div className="font-semibold text-gray-800">Notes:</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
                    onClick={() => handleExportCalendar(show)}
                  >
                    <Share className="w-4 h-4" />
                    Export to GCal
                  </Button>
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
                          const table = show.type === 'mic' ? 'profile_open_mics' : 'profile_custom_shows';
                          const { error } = await supabase
                            .from(table)
                            .update({ notes: editValue, schedule_type: editStatus, last_modified: new Date().toISOString() })
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
                          const table = show.type === 'mic' ? 'profile_open_mics' : 'profile_custom_shows';
                          const { error } = await supabase
                            .from(table)
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
  const { user } = useAuth();


  // Handler for opening modal to add
  const handleAddClick = () => {
    setEditShow(null);
    setModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      {/* Upcoming Shows Section Header Row: Upcoming Shows + Add Show Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Upcoming Shows</h2>
        <div className="flex flex-row gap-2 flex-wrap justify-end">
          <Button
            size="sm"
            className="bg-white text-black border hover:bg-gray/80 flex items-center justify-center gap-2"
            onClick={handleAddClick}
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
      {/* ShowForm Modal for Adding Custom Show */}
      {modalOpen && editShow === null && (
        <AddShowForm
          onSubmit={async (show) => {
            if (!user) return;
            const date_now = new Date().toISOString();
            const customShow = {
              profile_id: user.id,
              title: show.title,
              venue: show.venue,
              borough: show.borough,
              date: show.date,
              notes: show.notes || '',
              created_at: date_now,
              last_modified: date_now,
              schedule_type: 'upcoming' as const,
            };
            const { error, data } = await supabase.from('profile_custom_shows').insert([customShow]).select();
            if (error) {
              toast({
                title: 'Error',
                description: error.message || 'Failed to add custom show.',
                variant: 'destructive',
              });
              return; // Only return here if there's an error
            }
            toast({
              title: 'Show Added',
              description: 'Your custom show has been added to your schedule.',
            });
            if (data && data[0]) {
              const dateObj = data[0].date ? new Date(data[0].date) : null;
              const localTime = dateObj
                ? dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                : "";
              onAddShow({
                id: data[0].id,
                title: data[0].title || "",
                venue: data[0].venue || "",
                location: data[0].borough || "", // Use borough as location fallback
                date: data[0].date, // use the ISO string directly
                time: localTime,
                status: data[0].schedule_type as 'upcoming' | 'cancelled' | 'completed',
                notes: data[0].notes || "",
                audienceCount: "", // Not available in database, set to empty
                rating: "", // Not available in database, set to empty
                borough: data[0].borough || "",
                createdAt: data[0].created_at || "", // Use correct property name
                type: "show",
              });
            }
            setModalOpen(false); // Always close modal after successful insert
          }}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ShowNotepad;
