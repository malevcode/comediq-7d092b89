
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

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

interface ShowListProps {
  shows: Show[];
  onUpdateShow: (id: string, updatedShow: Partial<Show>) => void;
  onDeleteShow: (id: string) => void;
}

const ShowList = ({ shows, onUpdateShow, onDeleteShow }: ShowListProps) => {
  return (
    <div className="space-y-4">
      {shows.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No upcoming shows scheduled</p>
              <p className="text-gray-400">Add your first show to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        shows.map((show) => (
          <Card key={show.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{show.title}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {show.venue}
                  </CardDescription>
                </div>
                <Badge 
                  variant={show.status === 'confirmed' ? 'default' : 
                           show.status === 'cancelled' ? 'destructive' : 'secondary'}
                  className="ml-4"
                >
                  {show.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  <span>{format(show.date, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  <span>{show.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                  <span>{show.location}</span>
                </div>
              </div>
              
              {show.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{show.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateShow(show.id, { 
                    status: show.status === 'confirmed' ? 'upcoming' : 'confirmed' 
                  })}
                  className="hover:bg-orange-50 hover:border-orange-200"
                >
                  {show.status === 'confirmed' ? 'Mark Pending' : 'Confirm Show'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateShow(show.id, { 
                    status: show.status === 'cancelled' ? 'upcoming' : 'cancelled' 
                  })}
                  className="hover:bg-red-50 hover:border-red-200"
                >
                  {show.status === 'cancelled' ? 'Reactivate' : 'Cancel Show'}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onDeleteShow(show.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ShowList;
