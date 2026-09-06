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

const glassCardClass = "group cursor-pointer border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/50 hover:shadow-[0_18px_60px_rgba(4,20,55,0.16)] dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)] dark:hover:bg-white/10";

export function SmartPlaylistCard({ title, count, icon: Icon, color, onClick }: SmartPlaylistCardProps) {
  return (
    <Card 
      className={glassCardClass}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium transition-colors group-hover:text-[#1a5fb4] dark:group-hover:text-[#8ec5ff]">
              {title}
            </h4>
            <Badge variant="outline" className="mt-1 border-[#07111f]/10 bg-white/40 text-xs text-[#07111f] dark:border-white/10 dark:bg-white/10 dark:text-white">
              {count} mics
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
