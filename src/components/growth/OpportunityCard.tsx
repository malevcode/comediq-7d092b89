import { Calendar, MapPin, DollarSign, ExternalLink, Megaphone, Trophy, GraduationCap, Headphones, Clock, Instagram } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingSignupDialog } from "@/components/growth/BookingSignupDialog";
import type { GrowthOpportunity } from "@/api/growthOpportunities";

const typeConfig = {
  barking: { icon: Megaphone, color: "bg-blue-100 text-blue-800 dark:bg-[#8ec5ff]/18 dark:text-[#8ec5ff]", label: "Booking" },
  festival: { icon: Trophy, color: "bg-purple-100 text-purple-800 dark:bg-purple-300/18 dark:text-purple-100", label: "Festival" },
  school_ad: { icon: GraduationCap, color: "bg-amber-100 text-amber-800 dark:bg-[#f7c600]/18 dark:text-[#f7c600]", label: "Training" },
  podcast: { icon: Headphones, color: "bg-green-100 text-green-800 dark:bg-emerald-300/18 dark:text-emerald-100", label: "Podcast" },
};

interface OpportunityCardProps {
  opportunity: GrowthOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  return (
    <Card
      className={`border-0 bg-[rgba(255,255,255,0.58)] text-foreground shadow-[0_18px_60px_rgba(4,20,55,0.16)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[rgba(255,255,255,0.72)] dark:bg-[rgba(7,17,31,0.30)] dark:text-white dark:hover:bg-[rgba(7,17,31,0.42)] ${opportunity.is_featured ? "ring-1 ring-[#8ec5ff]/30" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0 text-[#1a5fb4] dark:text-[#8ec5ff]" />
            <CardTitle className="text-base leading-tight break-words">{opportunity.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-1 shrink-0">
            {opportunity.is_featured && (
              <Badge variant="default" className="bg-[#1a5fb4] text-xs text-white dark:bg-white dark:text-[#07111f]">
                Featured
              </Badge>
            )}
            {opportunity.type !== "podcast" && <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {opportunity.description && (
          <p className="text-sm text-muted-foreground line-clamp-none dark:text-white/70">{opportunity.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground dark:text-white/66">
          {opportunity.type !== "podcast" && opportunity.venue_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {opportunity.venue_name}
              {opportunity.borough && `, ${opportunity.borough}`}
            </span>
          )}
          {opportunity.type !== "podcast" && opportunity.date && (
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
          {opportunity.type !== "podcast" && opportunity.compensation && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> {opportunity.compensation}
            </span>
          )}
          {opportunity.type === "podcast" && opportunity.compensation && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {opportunity.compensation}
            </span>
          )}
        </div>

        {opportunity.type !== "podcast" && opportunity.contact_info && (
          <p className="text-xs text-muted-foreground dark:text-white/66">📬 {opportunity.contact_info}</p>
        )}

        {opportunity.type === "podcast" && opportunity.contact_info && (
          <a
            href={`https://instagram.com/${opportunity.contact_info.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground dark:text-white/66 dark:hover:text-white"
          >
            <Instagram className="h-3 w-3" /> Follow on Instagram
          </a>
        )}

        {opportunity.external_url && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full bg-[rgba(255,255,255,0.58)] hover:bg-[rgba(255,255,255,0.75)] dark:border-white/12 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white"
            asChild
          >
            <a href={opportunity.external_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              {opportunity.external_label ?? (opportunity.type === "podcast" ? "Watch on YouTube" : "Learn More")}
            </a>
          </Button>
        )}

        {opportunity.type === "barking" && !opportunity.external_url && (
          <BookingSignupDialog opportunity={opportunity} />
        )}
      </CardContent>
    </Card>
  );
}
