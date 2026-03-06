import { Calendar, MapPin, DollarSign, ExternalLink, Megaphone, Trophy, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GrowthOpportunity } from "@/api/growthOpportunities";

const typeConfig = {
  barking: { icon: Megaphone, label: "Barking" },
  festival: { icon: Trophy, label: "Festival" },
  school_ad: { icon: GraduationCap, label: "Training" },
};

interface OpportunityCardProps {
  opportunity: GrowthOpportunity;
  isExample?: boolean;
}

export function OpportunityCard({ opportunity, isExample }: OpportunityCardProps) {
  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  return (
    <Card className={`relative overflow-hidden transition-shadow hover:shadow-md ${
      opportunity.is_featured ? 'border-primary/40 ring-1 ring-primary/20' : ''
    } ${isExample ? 'border-dashed' : ''}`}>
      <CardContent className="p-4 space-y-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h3 className="font-semibold text-sm leading-tight truncate">{opportunity.title}</h3>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {opportunity.is_featured && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                Featured
              </Badge>
            )}
            {isExample && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Example
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {opportunity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {opportunity.venue_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {opportunity.venue_name}
              {opportunity.borough && `, ${opportunity.borough}`}
            </span>
          )}
          {opportunity.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(opportunity.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {opportunity.time && ` at ${opportunity.time}`}
            </span>
          )}
          {!opportunity.date && opportunity.time && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {opportunity.time}
            </span>
          )}
          {opportunity.compensation && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> {opportunity.compensation}
            </span>
          )}
        </div>

        {/* Contact */}
        {opportunity.contact_info && (
          <p className="text-xs text-muted-foreground">📬 {opportunity.contact_info}</p>
        )}

        {/* CTA */}
        {opportunity.external_url && !isExample && (
          <Button variant="outline" size="sm" className="w-full mt-1" asChild>
            <a href={opportunity.external_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Learn More
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
