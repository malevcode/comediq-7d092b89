import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Custom hook to fetch user profile from Supabase
function useUserProfile(userId) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, headshot_url")
        .eq("user_id", userId)
        .maybeSingle();
      return (data as { username?: string; headshot_url?: string } | null) ?? null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { profile, loading: isLoading };
}

/**
 * Reusable Header component that displays user information with avatar and welcome message
 * 
 * @example
 * // Basic usage (shows email and level)
 * <Header className="mb-8" />
 * 
 * // Hide email, show only level
 * <Header showEmail={false} showLevel={true} />
 * 
 * // Hide level, show only email
 * <Header showEmail={true} showLevel={false} />
 * 
 * // Hide both email and level
 * <Header showEmail={false} showLevel={false} />
 */
interface HeaderProps {
  className?: string;
  showEmail?: boolean;
  showLevel?: boolean;
}

export default function Header({ className = "", showEmail = true, showLevel = true }: HeaderProps) {
  const { user, subscriptionPlan } = useAuth();
  const { profile } = useUserProfile(user?.id);

  // Fallbacks
  const displayName = profile?.username || user?.email?.split("@")[0] || "Comedian";
  const avatarUrl = profile?.headshot_url || "/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png";
  const level = subscriptionPlan !== "free" ? "Full Pass Subscriber" : "Rising Star";

  return (
    <div className={`rounded-2xl border border-[#07111f]/10 bg-white/25 p-4 text-[#07111f] shadow-[0_30px_100px_rgba(4,20,55,0.18),0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl duration-300 hover:bg-white/35 hover:shadow-[0_34px_110px_rgba(4,20,55,0.22),0_12px_36px_rgba(4,20,55,0.12)] dark:border-0 dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_30px_100px_rgba(2,10,30,0.44),0_10px_32px_rgba(2,10,30,0.28)] dark:hover:bg-white/15 ${className}`}>
      <h1 className="text-3xl font-bold text-[#07111f] dark:text-white">
        Welcome back, {displayName}!
      </h1>
      {showEmail && showLevel && (
        <p className="text-lg text-[#07111f]/70 dark:text-white/70">
          {user?.email} • <span className="font-medium text-[#1a5fb4] dark:text-[#8ec5ff]">{level}</span>
        </p>
      )}
      {showEmail && !showLevel && (
        <p className="text-lg text-[#07111f]/70 dark:text-white/70">{user?.email}</p>
      )}
      {!showEmail && showLevel && (
        <p className="text-lg text-[#07111f]/70 dark:text-white/70">
          <span className="font-medium text-[#1a5fb4] dark:text-[#8ec5ff]">{level}</span>
        </p>
      )}
    </div>
  );
}
