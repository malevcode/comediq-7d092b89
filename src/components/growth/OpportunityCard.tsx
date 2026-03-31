import { Calendar, MapPin, DollarSign, ExternalLink, Megaphone, Trophy, GraduationCap, Headphones } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GrowthOpportunity } from "@/api/growthOpportunities";

const typeConfig = {
  barking: { icon: Megaphone, color: "bg-blue-100 text-blue-800", label: "Barking" },
  festival: { icon: Trophy, color: "bg-purple-100 text-purple-800", label: "Festival" },
  school_ad: { icon: GraduationCap, color: "bg-amber-100 text-amber-800", label: "Training" },
  podcast: { icon: Headphones, color: "bg-green-100 text-green-800", label: "Podcast" },
};

interface OpportunityCardProps {
  opportunity: GrowthOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${opportunity.is_featured ? "border-primary/40 ring-1 ring-primary/20" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CardTitle className="text-base leading-tight truncate">{opportunity.title}</CardTitle>
          </div>
          <div className="flex gap-1 shrink-0">
            {opportunity.is_featured && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
            <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {opportunity.description && (
          <p className="text-sm text-muted-foreground line-clamp-4">{opportunity.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {opportunity.venue_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {opportunity.venue_name}
              {opportunity.borough && `, ${opportunity.borough}`}
            </span>
          )}
          {opportunity.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{" "}
              {new Date(opportunity.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {opportunity.time && ` at ${opportunity.time}`}
            </span>
          )}
          {opportunity.compensation && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> {opportunity.compensation}
            </span>
          )}
        </div>

        {opportunity.contact_info && <p className="text-xs text-muted-foreground">📬 {opportunity.contact_info}</p>}

        {opportunity.external_url && (
          <Button variant="outline" size="sm" className="w-full mt-2" asChild>
            <a href={opportunity.external_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Learn More
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
