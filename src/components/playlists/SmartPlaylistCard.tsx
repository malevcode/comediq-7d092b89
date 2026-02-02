import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SmartPlaylistCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export function SmartPlaylistCard({ title, count, icon: Icon, color, onClick }: SmartPlaylistCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
              {title}
            </h4>
            <Badge variant="outline" className="mt-1 text-xs">
              {count} mics
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
