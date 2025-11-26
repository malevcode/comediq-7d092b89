import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, DollarSign } from 'lucide-react';
import type { RoleOpening } from '@/types/jobBoard';
import { PERFORMER_ROLES, CREW_ROLES, COMPENSATION_TYPES, EXPERIENCE_LEVELS } from '@/config/roleTypes';

interface RoleOpeningCardProps {
  role: RoleOpening;
  showApplyButton?: boolean;
  onApply?: () => void;
}

export function RoleOpeningCard({ role }: RoleOpeningCardProps) {
  const allRoles = [...PERFORMER_ROLES, ...CREW_ROLES];
  const roleInfo = allRoles.find(r => r.value === role.role_type);
  const compInfo = COMPENSATION_TYPES.find(c => c.value === role.compensation_type);
  const expInfo = EXPERIENCE_LEVELS.find(e => e.value === role.experience_level);

  const spotsRemaining = role.spots_available - role.spots_filled;
  const isFilled = spotsRemaining === 0 || role.status === 'filled';

  return (
    <Card className={isFilled ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">
              {roleInfo?.label || role.role_type}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={role.role_category === 'performer' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {role.role_category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {expInfo?.label || role.experience_level}
              </Badge>
            </div>
          </div>
          {isFilled ? (
            <Badge variant="secondary">Filled</Badge>
          ) : (
            <Badge variant="outline" className="bg-primary/5">
              {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} open
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {role.stage_time_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{role.stage_time_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{role.spots_available} total</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>
              {compInfo?.label || role.compensation_type}
              {role.compensation_amount && ` - $${role.compensation_amount}`}
            </span>
          </div>
        </div>

        {role.requirements && (
          <div className="text-sm">
            <p className="font-medium mb-1">Requirements:</p>
            <p className="text-muted-foreground">{role.requirements}</p>
          </div>
        )}

        {role.compensation_details && (
          <div className="text-sm">
            <p className="font-medium mb-1">Compensation Details:</p>
            <p className="text-muted-foreground">{role.compensation_details}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
