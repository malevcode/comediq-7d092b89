import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, MapPin, Calendar, Clock, Users, Share, CircleAlert, CircleCheckBig, Pencil, Search } from "lucide-react";
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
  type: 'mic' | 'show';
  stageTimeMinutes?: number;
}

interface ShowNotepadProps {
  shows: ShowNote[];
  onUpdateShow: (id: string, updatedFields: Partial<ShowNote>) => void;
  onDeleteShow: (id: string) => void;
  onSetActiveTab?: (tab: string) => void;
}

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl transition-all hover:bg-white/50 dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)] dark:hover:bg-white/10";
const glassButtonClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl transition-all hover:bg-white/50 hover:text-[#1a5fb4] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white";
const primaryGlassButtonClass = "border border-[#1a5fb4]/20 bg-[#1a5fb4] text-white shadow-[0_10px_30px_rgba(2,10,30,0.12)] backdrop-blur-xl transition-all hover:bg-[#1550a0] hover:text-white dark:border-white/10 dark:bg-[#1a5fb4]/70 dark:hover:bg-[#1a5fb4]/90";
const glassFieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 shadow-sm backdrop-blur-xl hover:bg-white/50 focus-visible:ring-[#1a5fb4]/30 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:hover:bg-white/20";
const titleTextClass = "text-[#07111f] dark:text-white";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

const handleExportCalendar = (show) => {
  const url = getGoogleCalendarUrl(show)
  window.open(url, "_blank")
}

const handleDownloadICal = (show) => {
  const event = generateCalendarEvent(show);
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Comediq//Show Notepad//EN',
    'BEGIN:VEVENT',
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `UID:${show.id || show.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}@comediq.app`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([icalContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${show.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function generateCalendarEvent(show) {
  const localDate = show.date.split('T')[0];
  const localDateTimeString = `${localDate}T${show.time}:00`;
  const localDateTime = new Date(localDateTimeString);
  const endDateTime = new Date(localDateTime.getTime() + 90 * 60 * 1000); // 90 minutes duration
  
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const description = show.type === "mic"
    ? `${show.type === "mic" ? "Open mic" : "Comedy show"} at ${show.venue}\n${show.notes ? `Notes: ${show.notes}` : ''}`
    : `Comedy show at ${show.venue}\n${show.notes ? `Notes: ${show.notes}` : ''}`;
  
  return {
    title: show.title || show.venue,
    start: formatDate(localDateTime),
    end: formatDate(endDateTime),
    description: description,
    location: show.location || show.venue,
    date: localDateTime
  };
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
      Brooklyn: "border-l-4 border-l-blue-800",
      Queens: "border-l-4 border-l-purple-600",
      Bronx: "border-l-4 border-l-orange-600",
      "Staten Island": "border-l-4 border-l-gray-500"
    };
    return outlines[cleanBorough] || "border-l-4 border-l-gray-400";
  };

  return (
    <Card key={show.id} className={`${glassCardClass} ${getBoroughOutline(show.borough || '')}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row w-full md:gap-6">
          {/* Left: Title, Venue, Date */}
          <div className="flex-shrink-0 min-w-[220px] max-w-[320px]">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-auto text-md font-semibold ${titleTextClass}`}>{show.title || show.venue}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${show.status === 'completed'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : show.status === 'cancelled'
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-[#07111f]/10 bg-white/40 text-[#07111f] dark:border-white/10 dark:bg-white/10 dark:text-white'}
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
            <div className={`text-sm ${mutedTextClass}`}>
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
          <div className={`flex min-w-0 flex-grow flex-col justify-between gap-x-4 gap-y-1 text-sm ${titleTextClass}`}>
            <div className="flex flex-col w-full">
              <div className="flex items-center mb-2 justify-between">
                <div className={`font-semibold ${titleTextClass}`}>Notes:</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={`text-sm text-[#1a5fb4] dark:text-[#8ec5ff] ${glassButtonClass}`}
                    onClick={() => handleExportCalendar(show)}
                  >
                    <Share className="w-4 h-4" />
                    <span className="hidden sm:inline">Export to Google Calendar</span>
                    <span className="sm:hidden">Google</span>
                  </Button>
                  <Button
                    size="sm"
                    className={`text-sm text-[#f97316] dark:text-[#ffc72c] ${glassButtonClass}`}
                    onClick={() => handleDownloadICal(show)}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Download ICS file</span>
                    <span className="sm:hidden">iCal</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(show.id);
                      setEditValue(show.notes);
                      setEditStatus(show.status);
                    }}
                    className="h-8 w-8 text-[#1a5fb4] hover:bg-white/40 hover:text-[#1550a0] dark:text-[#8ec5ff] dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Edit notes"
                  >
                    <Pencil className="w-4 h-4" size={16} />
                  </Button>
                </div>
              </div>
              {editingId === show.id ? (
                <>
                  <textarea
                    className={`mb-2 w-full rounded border p-2 ${glassFieldClass}`}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                  />
                  <div className="flex gap-2 justify-between">
                    <select
                      className={`mr-2 rounded border px-2 py-1 ${glassFieldClass}`}
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
                        className="text-green-600 hover:bg-white/40 hover:text-green-700 dark:text-green-300 dark:hover:bg-white/10"
                      >
                        <Save size={16} /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="text-red-600 hover:bg-white/40 hover:text-red-700 dark:text-red-300 dark:hover:bg-white/10"
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
                  <div className={`w-full text-base ${titleTextClass}`}>{<span className="text-sm">{show.notes || <span className={mutedTextClass}>No notes</span>}</span>}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ShowNotepad = ({ shows, onUpdateShow, onDeleteShow, onSetActiveTab }: ShowNotepadProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editStatus, setEditStatus] = useState<ShowNote['status'] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveTab } = useTabContext();


  // Handler for opening modal to add
  const handleAddClick = () => {
    navigate('/add-show?from=shows');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-2 mb-0">
      {/* Upcoming Shows Section Header Row: Upcoming Shows + Add Show Button */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${titleTextClass}`}>Upcoming Shows</h2>
        <div className="flex flex-row gap-2 flex-wrap justify-end">
          <Button
            size="sm"
            className={`flex items-center justify-center gap-2 ${glassButtonClass}`}
            onClick={handleAddClick}
          >
            <Plus className="w-4 h-4" />
            Add a Custom Show
          </Button>
          <Button
            size="sm"
            className={`flex items-center justify-center gap-2 ${primaryGlassButtonClass}`}
            onClick={() => {
              if (location.pathname === "/perform") {
                setActiveTab("find-mics");
              } else {
                navigate("/open-mics");
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
            <Card className={glassCardClass}><CardContent className={`py-8 text-center ${mutedTextClass}`}>No upcoming shows.</CardContent></Card>
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
        <h2 className={`mb-2 mt-8 text-xl font-bold ${titleTextClass}`}>Past Shows</h2>
        <div className="space-y-3">
          {shows.filter(show => show.status === 'completed' || show.status === 'cancelled').length === 0 ? (
            <Card className={glassCardClass}><CardContent className={`py-8 text-center ${mutedTextClass}`}>No past shows.</CardContent></Card>
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
