import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PostingWithRoles } from '@/types/jobBoard';
import { COMPENSATION_TYPES } from '@/config/roleTypes';

interface PostingCardProps {
  posting: PostingWithRoles;
  onClick?: () => void;
}

export function PostingCard({ posting, onClick }: PostingCardProps) {
  const roleCount = posting.roles?.length || 0;
  const openSpots = posting.roles?.reduce((sum, role) => 
    sum + (role.spots_available - role.spots_filled), 0
  ) || 0;

  const uniqueCompensationTypes = [...new Set(
    posting.roles?.map(r => r.compensation_type) || []
  )];

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{posting.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{posting.venue_name}</span>
              {posting.borough && (
                <Badge variant="outline" className="ml-2">
                  {posting.borough}
                </Badge>
              )}
            </CardDescription>
          </div>
          {posting.is_featured && (
            <Badge className="bg-primary/20 text-primary">Featured</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(posting.show_date), 'MMM d, yyyy')}</span>
          </div>
          {posting.show_time && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{posting.show_time.slice(0, 5)}</span>
            </div>
          )}
        </div>

        {posting.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {posting.description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{roleCount} role{roleCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{openSpots} spot{openSpots !== 1 ? 's' : ''} open</span>
          </div>
        </div>

        {uniqueCompensationTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {uniqueCompensationTypes.map(type => {
              const compType = COMPENSATION_TYPES.find(c => c.value === type);
              return (
                <Badge key={type} variant="secondary" className="text-xs">
                  {compType?.label || type}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
