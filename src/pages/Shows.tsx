
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import ShowForm from "@/components/ShowForm";
import ShowList from "@/components/ShowList";

interface Show {
  id: string;
  title: string;
  venue: string;
  location: string;
  date: Date;
  time: string;
  status: 'upcoming' | 'confirmed' | 'cancelled';
  notes?: string;
}

const Shows = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [shows, setShows] = useState<Show[]>([
    {
      id: '1',
      title: 'Comedy For Peace',
      venue: 'Riverdale Comedy Club',
      location: 'Riverdale, NY',
      date: new Date('2024-06-10'),
      time: '8:00 PM',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Eastville Comedy Club',
      venue: 'Eastville Comedy Club',
      location: 'Brooklyn, NY',
      date: new Date('2024-06-11'),
      time: '9:30 PM',
      status: 'upcoming'
    }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const addShow = (newShow: Omit<Show, 'id'>) => {
    const show: Show = {
      ...newShow,
      id: Date.now().toString()
    };
    setShows([...shows, show]);
    setShowForm(false);
  };

  const updateShow = (id: string, updatedShow: Partial<Show>) => {
    setShows(shows.map(show => 
      show.id === id ? { ...show, ...updatedShow } : show
    ));
  };

  const deleteShow = (id: string) => {
    setShows(shows.filter(show => show.id !== id));
  };

  const getShowsForDate = (date: Date) => {
    return shows.filter(show => 
      format(show.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const upcomingShows = shows.filter(show => isFuture(show.date) || isToday(show.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Show Scheduler</h1>
            <p className="text-lg text-gray-600">Manage your comedy shows like a pro</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Show
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <Button 
            variant={view === 'calendar' ? 'default' : 'outline'}
            onClick={() => setView('calendar')}
            className={view === 'calendar' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button 
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            className={view === 'list' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            List View
          </Button>
        </div>

        {view === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>Select a date to view shows</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      hasShows: shows.map(show => show.date)
                    }}
                    modifiersStyles={{
                      hasShows: { 
                        backgroundColor: '#f97316', 
                        color: 'white',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                  </CardTitle>
                  <CardDescription>
                    {selectedDate && getShowsForDate(selectedDate).length === 0 
                      ? 'No shows scheduled for this date'
                      : `${selectedDate ? getShowsForDate(selectedDate).length : 0} show(s) scheduled`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDate && getShowsForDate(selectedDate).map(show => (
                    <div key={show.id} className="border rounded-lg p-4 mb-4 last:mb-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{show.title}</h3>
                        <Badge 
                          variant={show.status === 'confirmed' ? 'default' : 
                                 show.status === 'cancelled' ? 'destructive' : 'secondary'}
                        >
                          {show.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{show.venue}, {show.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{show.time}</span>
                        </div>
                      </div>
                      {show.notes && (
                        <p className="text-sm text-gray-500 mt-2">{show.notes}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateShow(show.id, { 
                            status: show.status === 'confirmed' ? 'upcoming' : 'confirmed' 
                          })}
                        >
                          {show.status === 'confirmed' ? 'Mark Pending' : 'Confirm'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteShow(show.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <ShowList 
            shows={upcomingShows} 
            onUpdateShow={updateShow}
            onDeleteShow={deleteShow}
          />
        )}

        {showForm && (
          <ShowForm 
            onSubmit={addShow}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Shows;
