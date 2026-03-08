import { Trophy, Medal, Crown, User } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const rankAccent = (rank: number) => {
  if (rank === 1) return "text-yellow-500 dark:text-yellow-400";
  if (rank === 2) return "text-gray-400 dark:text-gray-300";
  if (rank === 3) return "text-amber-600 dark:text-amber-500";
  return "text-muted-foreground";
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs font-mono text-muted-foreground w-4 text-center">{rank}</span>;
};

export const LeaderboardTab = () => {
  const { top10, userRank, isLoading } = useLeaderboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  const userInTop10 = userRank && top10.some(e => e.user_id === userRank.user_id);

  return (
    <div className="mt-4 space-y-3">
      {/* Top 3 spotlight */}
      {top10.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 0, 2].map((idx) => {
            const entry = top10[idx];
            if (!entry) return null;
            const isCenter = idx === 0;
            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex flex-col items-center rounded-xl border border-border bg-card p-3",
                  isCenter && "ring-2 ring-yellow-500/30 -mt-2 pb-4"
                )}
              >
                <RankIcon rank={entry.rank} />
                <p className={cn("text-xs font-bold mt-1.5 truncate max-w-full", rankAccent(entry.rank))}>
                  {entry.stage_name || entry.username || "Comedian"}
                </p>
                <p className="text-lg font-black text-foreground">{entry.points_balance}</p>
                <p className="text-[10px] text-muted-foreground">pts</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_60px] gap-2 px-3 py-2 bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>#</span>
          <span>Comedian</span>
          <span className="text-right">Points</span>
        </div>
        {top10.map((entry) => (
          <div
            key={entry.user_id}
            className={cn(
              "grid grid-cols-[40px_1fr_60px] gap-2 px-3 py-2.5 border-t border-border/50 items-center",
              entry.rank <= 3 && "bg-card",
              user?.id === entry.user_id && "bg-primary/5"
            )}
          >
            <RankIcon rank={entry.rank} />
            <span className={cn(
              "text-sm truncate",
              entry.rank <= 3 ? "font-semibold" : "font-medium",
              user?.id === entry.user_id && "text-primary"
            )}>
              {entry.stage_name || entry.username || "Comedian"}
              {user?.id === entry.user_id && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
            </span>
            <span className={cn(
              "text-sm text-right font-mono font-bold",
              rankAccent(entry.rank)
            )}>
              {entry.points_balance}
            </span>
          </div>
        ))}

        {top10.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No rankings yet — verify mics to earn points!
          </div>
        )}
      </div>

      {/* Current user rank (if not in top 10) */}
      {userRank && !userInTop10 && (
        <div className="border border-dashed border-primary/30 rounded-lg px-3 py-3 mt-2">
          <div className="grid grid-cols-[40px_1fr_60px] gap-2 items-center">
            <span className="text-xs font-mono text-primary font-bold">#{userRank.rank}</span>
            <span className="text-sm font-semibold text-primary truncate flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {userRank.stage_name || userRank.username || "You"}
            </span>
            <span className="text-sm text-right font-mono font-bold text-primary">
              {userRank.points_balance}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {userRank.rank <= 3
              ? "🎉 You're in the Top 3 — eligible for a booked show!"
              : `${(top10[2]?.points_balance || 0) - userRank.points_balance} pts to Top 3`}
          </p>
        </div>
      )}

      {!user && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Log in to see your ranking
        </p>
      )}

      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Top 3 are eligible for a booked show spot 🎤
      </p>
    </div>
  );
};
