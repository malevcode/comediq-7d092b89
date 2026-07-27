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
    <div className={`rounded-2xl border-0 bg-[#07111f]/26 p-4 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl duration-300 hover:bg-[#07111f]/5 ${className}`}>
      <h1 className="text-3xl font-bold text-white">
        Welcome back, {displayName}!
      </h1>
      {showEmail && showLevel && (
        <p className="text-white/66 text-lg">
          {user?.email} • <span className="font-medium text-[#8ec5ff]">{level}</span>
        </p>
      )}
      {showEmail && !showLevel && (
        <p className="text-white/66 text-lg">{user?.email}</p>
      )}
      {!showEmail && showLevel && (
        <p className="text-white/66 text-lg">
          <span className="font-medium text-[#8ec5ff]">{level}</span>
        </p>
      )}
    </div>
  );
}
